// src/app/api/webhooks/whatsapp/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/firebase/admin';
import type { Lead, Task, WhatsappEvent, Contact } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { addDays } from 'date-fns';
import { validateAndStandardizeLeadData } from '@/ai/flows/validate-and-standardize-lead-data';
import type { ValidateAndStandardizeLeadDataInput } from '@/ai/flows/validate-and-standardize-lead-data';


/**
 * Finds a default user and company to assign a new lead to.
 * This is a fallback for when a lead comes from an automated source.
 */
async function getDefaultLeadAssignment(): Promise<{ userId: string; userName: string } | null> {
    if (!adminDb) return null;
    const adminUsersSnapshot = await adminDb.collection('users').where('role', '==', 'admin').limit(1).get();
    if (adminUsersSnapshot.empty) {
      console.warn('Webhook: No admin user found to assign new lead.');
      return null;
    }
    const adminUser = adminUsersSnapshot.docs[0].data();
    const adminUserId = adminUsersSnapshot.docs[0].id;
    const adminUserName = adminUser.displayName || 'Admin';
  
    return { userId: adminUserId, userName: adminUserName };
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
    
    // Log every event for debugging purposes. We will update this log later with more context.
    const logRef = adminDb.collection('whatsappEvents').doc();
    await logRef.set({
        rawPayload: rawPayload,
        processedAt: FieldValue.serverTimestamp(),
        eventType: eventType || 'unknown',
    } as Omit<WhatsappEvent, 'id' | 'leadId' | 'contactId' | 'error'>);

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
            await logRef.update({ error: 'CRM is not configured to accept new leads.' });
            return NextResponse.json({ success: false, error: 'CRM is not configured to accept new leads.' }, { status: 500 });
        }
        
        const leadInput: ValidateAndStandardizeLeadDataInput = {
            fullName: userName,
            companyName: userName,
            email: `${userPhone}@whatsapp.spiceroute.crm`,
            phone: userPhone,
            whatsappNumber: userPhone,
            source: 'whatsapp',
            productInterest: 'Not specified',
            destinationCountry: 'Not specified',
            incotermsPreference: 'Not specified',
        };

        const result = await validateAndStandardizeLeadData(leadInput);
        console.log(`WhatsApp Webhook: AI standardization result for ${userPhone}:`, JSON.stringify(result, null, 2));

        let leadDataToSave;
        if (result.aiUsed && result.aiData) {
            leadDataToSave = result.aiData;
        } else {
            console.log(`WhatsApp Webhook: AI not used for ${userPhone}. Reason: ${result.aiReason}. Saving raw data.`);
            leadDataToSave = {
                fullName: leadInput.fullName,
                companyName: leadInput.companyName,
                email: leadInput.email,
                phone: leadInput.phone,
                whatsappNumber: leadInput.whatsappNumber,
                destinationCountry: leadInput.destinationCountry,
                productInterest: leadInput.productInterest,
            };
        }

        const batch = adminDb.batch();

        // Create Contact
        const contactRef = adminDb.collection('contacts').doc();
        const nameParts = leadDataToSave.fullName.split(' ');
        const contactPayload: Omit<Contact, 'id'> = {
            firstName: nameParts[0] || 'N/A',
            lastName: nameParts.slice(1).join(' ') || 'N/A',
            email: leadDataToSave.email,
            phone: leadDataToSave.phone,
            whatsappNumber: leadDataToSave.whatsappNumber,
            contactSource: 'WhatsApp',
            createdAt: FieldValue.serverTimestamp(),
        };
        batch.set(contactRef, contactPayload);

        // Create Lead
        const leadRef = adminDb.collection('leads').doc();
        const finalLeadPayload: Omit<Lead, 'id'> = {
            ...leadDataToSave,
            source: 'whatsapp',
            incotermsPreference: 'N/A',
            status: 'new',
            assignedUserId: assignment.userId,
            createdAt: FieldValue.serverTimestamp(),
            lastContactAt: FieldValue.serverTimestamp(),
            lastInboundChannel: 'whatsapp',
            whatsappThreadId: messageInfo.id,
            aiStandardization: {
                status: result.aiUsed ? 'completed' : 'failed',
                reason: result.aiReason,
                completedAt: FieldValue.serverTimestamp()
            }
        };
        batch.set(leadRef, finalLeadPayload);

        // Create an activity log entry for the user-facing feed
        const activityLog = {
            icon: 'Sprout',
            title: `New WhatsApp Lead: ${finalLeadPayload.fullName}`,
            description: `From ${userPhone}, assigned to ${assignment.userName}.`,
            timestamp: FieldValue.serverTimestamp()
        };
        const activityRef = adminDb.collection('activity_logs').doc();
        batch.set(activityRef, activityLog);
    
        // Create a follow-up task for the new lead
        const taskPayload: Omit<Task, 'id'> = {
            title: `Follow up with new WhatsApp lead: ${finalLeadPayload.fullName}`,
            status: 'open',
            dueDate: addDays(new Date(), 2), // Due in 2 days
            assigneeId: assignment.userId,
            relatedLeadId: leadRef.id,
            createdAt: FieldValue.serverTimestamp()
        };
        const taskRef = adminDb.collection('tasks').doc();
        batch.set(taskRef, taskPayload);
        
        await batch.commit();

        await logRef.update({
            leadId: leadRef.id,
            contactId: contactRef.id,
            aiUsed: result.aiUsed,
            aiReason: result.aiReason
        });
        
        console.log(`WhatsApp Webhook: Created new lead ${leadRef.id}, contact ${contactRef.id}, and automations for ${userPhone}.`);
        return NextResponse.json({ 
            success: true, 
            message: 'Lead and contact created successfully.', 
            leadId: leadRef.id, 
            contactId: contactRef.id,
            aiUsed: result.aiUsed, 
            aiReason: result.aiReason 
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('WhatsApp Webhook Error:', errorMessage, error);
        await logRef.update({ error: errorMessage });
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
