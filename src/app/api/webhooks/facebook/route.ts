import { NextResponse } from 'next/server';
import { validateAndStandardizeLeadData } from '@/ai/flows/validate-and-standardize-lead-data';
import type { ValidateAndStandardizeLeadDataInput } from '@/ai/flows/validate-and-standardize-lead-data';

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
    const standardizedData = await validateAndStandardizeLeadData(leadInput);

    console.log('Received standardized data from Genkit:', JSON.stringify(standardizedData, null, 2));

    // In a real application, you would now save the `standardizedData` to your Firestore 'leads' collection.
    // e.g., await db.collection('leads').add({ ...standardizedData, createdAt: new Date() });
    
    console.log('Simulated saving standardized lead to Firestore.');


    return NextResponse.json({ success: true, message: 'Lead processed successfully.' });
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
