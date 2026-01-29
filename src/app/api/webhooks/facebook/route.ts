import { NextResponse } from 'next/server';
import { validateAndStandardizeLeadData } from '@/ai/flows/validate-and-standardize-lead-data';
import type { ValidateAndStandardizeLeadDataInput } from '@/ai/flows/validate-and-standardize-lead-data';
import type { Lead } from '@/lib/types';
import { adminDb } from '@/firebase/admin';

export async function POST(request: Request) {
  try {
    const rawLeadData = await request.json();

    console.log('Received raw lead data from Facebook:', JSON.stringify(rawLeadData, null, 2));

    // This is a sample mapping. The actual field names from Facebook may differ.
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

    console.log('Mapped input for Genkit flow:', JSON.stringify(leadInput, null, 2));

    // Call the Genkit flow to validate and standardize the data
    const result = await validateAndStandardizeLeadData(leadInput);

    console.log('Received guarded result from Genkit:', JSON.stringify(result, null, 2));

    let leadDataToSave: Omit<Lead, 'id' | 'assignedUserId' | 'createdAt'> & { createdAt: any };

    if (result.aiUsed && result.aiData) {
      leadDataToSave = {
        ...result.aiData,
        source: leadInput.source,
        incotermsPreference: leadInput.incotermsPreference,
        status: 'new',
        rawPayload: rawLeadData,
        createdAt: new Date(),
      };
    } else {
      // Fallback to saving unstandardized data if AI is not used
      leadDataToSave = {
        fullName: leadInput.fullName,
        companyName: leadInput.companyName,
        email: leadInput.email,
        phone: leadInput.phone,
        whatsappNumber: leadInput.whatsappNumber,
        source: leadInput.source,
        productInterest: leadInput.productInterest,
        destinationCountry: leadInput.destinationCountry,
        incotermsPreference: leadInput.incotermsPreference,
        status: 'new',
        rawPayload: rawLeadData,
        createdAt: new Date(),
      };
    }
    
    // In a real application, you would assign to a user.
    const leadWithUser = { ...leadDataToSave, assignedUserId: 'sales-exec-01' };

    console.log('Simulated saving standardized lead to Firestore:', JSON.stringify(leadWithUser, null, 2));
    // const docRef = await adminDb.collection('leads').add(leadWithUser);
    // console.log(`Lead saved with ID: ${docRef.id}`);

    return NextResponse.json({ success: true, message: 'Lead processed successfully.', aiInfo: { used: result.aiUsed, reason: result.aiReason }});

  } catch (error) {
    console.error('Error processing webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// Facebook requires a GET endpoint for webhook verification
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')
  
    // Your verification token. This should be stored securely as an environment variable.
    const VERIFY_TOKEN = process.env.FACEBOOK_VERIFY_TOKEN || "your-secret-verify-token";
  
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified successfully!');
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error('Failed webhook verification.');
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
