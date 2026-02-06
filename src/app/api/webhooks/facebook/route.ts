import { NextResponse } from 'next/server';
import { validateAndStandardizeLeadData } from '@/ai/flows/validate-and-standardize-lead-data';
import type { ValidateAndStandardizeLeadDataInput } from '@/ai/flows/validate-and-standardize-lead-data';
import type { Lead, Task } from '@/lib/types';
import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { addDays } from 'date-fns';

async function getDefaultLeadAssignment(): Promise<{ companyId: string; userId: string; userName: string } | null> {
  if (!adminDb) return null;
  // Find an admin user to assign the lead to their first company.
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

export async function POST(request: Request) {
  try {
    if (!adminDb) {
      console.error('Firebase Admin is not available. Cannot process webhook.');
      return NextResponse.json({ success: false, error: 'Database connection not available.' }, { status: 500 });
    }

    const rawLeadData = await request.json();
    console.log('Received raw lead data:', JSON.stringify(rawLeadData, null, 2));

    const assignment = await getDefaultLeadAssignment();
    if (!assignment) {
      console.error('Webhook: Could not determine default assignment for new lead.');
      return NextResponse.json({ success: false, error: 'CRM is not configured to accept new leads.' }, { status: 500 });
    }

    const leadInput: ValidateAndStandardizeLeadDataInput = {
      fullName: rawLeadData.full_name || 'N/A',
      companyName: rawLeadData.company_name || 'N/A',
      email: rawLeadData.email || 'N/A',
      phone: rawLeadData.phone_number || 'N/A',
      whatsappNumber: rawLeadData.whatsapp_number || undefined,
      source: 'Facebook Lead Ads',
      productInterest: rawLeadData.product_interest || 'N/A',
      destinationCountry: rawLeadData.destination_country || 'N/A',
      incotermsPreference: rawLeadData.incoterms_preference || 'N/A',
    };

    const result = await validateAndStandardizeLeadData(leadInput);
    console.log('AI standardization result:', JSON.stringify(result, null, 2));

    let leadDataToSave;

    if (result.aiUsed && result.aiData) {
      leadDataToSave = { ...result.aiData };
    } else {
      // Fallback to saving unstandardized data if AI is not used or fails
      console.log(`AI not used. Reason: ${result.aiReason}. Saving raw lead data.`);
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
    
    const finalLeadPayload: Omit<Lead, 'id'> = {
      ...leadDataToSave,
      source: leadInput.source,
      incotermsPreference: leadInput.incotermsPreference,
      status: 'new',
      assignedUserId: assignment.userId,
      createdAt: FieldValue.serverTimestamp(),
    };

    const leadsCollection = adminDb.collection('companies').doc(assignment.companyId).collection('leads');
    const leadRef = await leadsCollection.add(finalLeadPayload);
    console.log(`Lead saved with ID: ${leadRef.id} in Company: ${assignment.companyId}`);
    
    const batch = adminDb.batch();

    // Create an activity log entry
    const activityLog = {
        icon: 'Sprout',
        title: `New Lead: ${finalLeadPayload.fullName}`,
        description: `From ${finalLeadPayload.source}, assigned to ${assignment.userName}.`,
        timestamp: FieldValue.serverTimestamp()
    };
    const activityRef = adminDb.collection('companies').doc(assignment.companyId).collection('activity_logs').doc();
    batch.set(activityRef, activityLog);

    // Create a follow-up task for the new lead
    const taskPayload: Omit<Task, 'id'> = {
        title: `Follow up with new lead: ${finalLeadPayload.fullName}`,
        status: 'open',
        dueDate: addDays(new Date(), 2), // Due in 2 days
        assigneeId: assignment.userId,
        relatedLeadId: leadRef.id,
        createdAt: FieldValue.serverTimestamp()
    };
    const taskRef = adminDb.collection('companies').doc(assignment.companyId).collection('tasks').doc();
    batch.set(taskRef, taskPayload);
    
    await batch.commit();
    console.log(`Created activity log and follow-up task for lead ${leadRef.id}.`);

    return NextResponse.json({ 
        success: true, 
        message: 'Lead processed successfully.', 
        leadId: leadRef.id,
        aiUsed: result.aiUsed,
        aiReason: result.aiReason,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error processing webhook:', errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Facebook requires a GET endpoint for webhook verification
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')
  
    // Use an environment variable for the verification token for security
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN;
  
    if (!VERIFY_TOKEN) {
        console.error('FACEBOOK_VERIFY_TOKEN is not set in environment variables.');
        return new NextResponse('Configuration error', { status: 500 });
    }

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error('Failed webhook verification. Tokens did not match.');
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

    