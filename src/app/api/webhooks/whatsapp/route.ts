// src/app/api/webhooks/whatsapp/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/firebase/admin';
import type { Lead, Task, Contact, WhatsappEvent } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { addDays } from 'date-fns';

/**
 * Finds a default user and company to assign a new lead to.
 * This is a fallback for when a lead comes from an automated source.
 */
async function getDefaultLeadAssignment(): Promise<{ companyId: string; userId: string; userName: string } | null> {
    if (!adminDb) return null;
    const adminUsersSnapshot = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
    if (adminUsersSnapshot.empty) {
      console.warn('Webhook: No admin user found to assign new lead.');
      return null;
    }
    const adminUser = adminUsersSnapshot.docs[0].data();
    const adminUserId = adminUsersSnapshot.docs[0].id;
    const defaultCompanyId = adminUser.companyIds?.[0];
    const adminUserName = adminUser.displayName || 'Admin';
  
    if (!defaultCompanyId) {
      console.warn(`Webhook: Admin user ${adminUserId} has no companies assigned.`);
      return null;
    }
  
    return { companyId: defaultCompanyId, userId: adminUserId, userName: adminUserName };
}


/**
 * Handles incoming WhatsApp Cloud API webhooks.
 */
export async function POST(request: NextRequest) {
    if (!adminDb) {
        console.error('WhatsApp Webhook: Firebase Admin is not available.');
        return NextResponse.json({ success: false, error: 'Database connection not available.' }, { status: 500 });
    }

    const rawPayload = await request.json();
    const eventType = rawPayload.entry?.[0]?.changes?.[0]?.field;
    
    // Log every event for debugging purposes
    const logRef = adminDb.collection('whatsappEvents').doc();
    await logRef.set({
        rawPayload: rawPayload,
        processedAt: FieldValue.serverTimestamp(),
        eventType: eventType || 'unknown',
    } as Omit<WhatsappEvent, 'id'>);

    // We only care about new messages
    if (eventType !== 'messages') {
        return NextResponse.json({ success: true, message: 'Event received, but not a new message. No action taken.' });
    }

    try {
        const messageValue = rawPayload.entry?.[0]?.changes?.[0]?.value;
        const contactInfo = messageValue?.contacts?.[0];
        const messageInfo = messageValue?.messages?.[0];

        if (!contactInfo || !messageInfo) {
            console.warn('WhatsApp Webhook: Payload is missing contact or message info.', JSON.stringify(rawPayload));
            return NextResponse.json({ success: false, error: 'Incomplete payload.' }, { status: 400 });
        }

        const userPhone = contactInfo.wa_id; // This is already in E.164 format
        const userName = contactInfo.profile?.name || `WhatsApp User ${userPhone.slice(-4)}`;
        
        // Check if an open lead already exists for this phone number to avoid duplicates
        const leadsQuery = await adminDb.collectionGroup('leads')
            .where('whatsappNumber', '==', userPhone)
            .where('status', '!=', 'converted')
            .where('status', '!=', 'lost')
            .limit(1).get();

        if (!leadsQuery.empty) {
            console.log(`WhatsApp Webhook: Active lead already exists for ${userPhone}. No action taken.`);
            return NextResponse.json({ success: true, message: 'Active lead already exists.' });
        }

        const assignment = await getDefaultLeadAssignment();
        if (!assignment) {
            return NextResponse.json({ success: false, error: 'CRM is not configured to accept new leads.' }, { status: 500 });
        }
        
        const finalLeadPayload: Omit<Lead, 'id'> = {
            fullName: userName,
            companyName: userName, // Defaulting company name to user's name
            email: `${userPhone}@whatsapp.spiceroute.crm`, // Placeholder email
            phone: userPhone,
            whatsappNumber: userPhone,
            source: 'whatsapp',
            productInterest: 'N/A',
            destinationCountry: 'N/A',
            incotermsPreference: 'N/A',
            status: 'new',
            assignedUserId: assignment.userId,
            createdAt: FieldValue.serverTimestamp(),
            lastContactAt: FieldValue.serverTimestamp(),
            lastInboundChannel: 'whatsapp',
            whatsappThreadId: messageInfo.id,
        };

        const leadRef = await adminDb.collection('companies').doc(assignment.companyId).collection('leads').add(finalLeadPayload);
        
        await adminDb.doc(logRef.path).update({ leadId: leadRef.id });

        console.log(`WhatsApp Webhook: Created new lead ${leadRef.id} for ${userPhone}.`);
        return NextResponse.json({ success: true, message: 'Lead created successfully.', leadId: leadRef.id });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('WhatsApp Webhook Error:', errorMessage, error);
        await adminDb.doc(logRef.path).update({ error: errorMessage });
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}


/**
 * Handles the Meta webhook verification challenge.
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
  
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
  
    if (!VERIFY_TOKEN) {
        console.error('FACEBOOK_VERIFY_TOKEN is not set in environment variables.');
        return new NextResponse('Configuration error', { status: 500 });
    }

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WhatsApp Webhook verified successfully!');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error('Failed WhatsApp webhook verification. Tokens did not match.');
      return new NextResponse('Forbidden', { status: 403 });
    }
}
