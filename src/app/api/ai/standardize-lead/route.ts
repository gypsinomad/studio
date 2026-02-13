import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { validateAndStandardizeLeadData, type ValidateAndStandardizeLeadDataInput } from '@/ai/flows/validate-and-standardize-lead-data';
import { FieldValue } from 'firebase-admin/firestore';
import type { Lead } from '@/lib/types';


export async function POST(request: Request) {
    const { leadId } = await request.json();

    if (!leadId) {
        return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }
    if (!adminDb) {
        return NextResponse.json({ success: false, error: 'Database connection is not available' }, { status: 500 });
    }

    try {
        const leadRef = adminDb.collection('leads').doc(leadId as string);
        const leadSnap = await leadRef.get();

        if (!leadSnap.exists) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }
        
        const leadData = leadSnap.data() as Lead;
        
        // Prepare input for the Genkit flow
        const aiInput: ValidateAndStandardizeLeadDataInput = {
            fullName: leadData.fullName,
            companyName: leadData.companyName,
            email: leadData.email,
            phone: leadData.phone,
            whatsappNumber: leadData.whatsappNumber,
            source: leadData.source,
            productInterest: leadData.productInterest,
            destinationCountry: leadData.destinationCountry,
            incotermsPreference: leadData.incotermsPreference,
        };

        // Run AI standardization
        const result = await validateAndStandardizeLeadData(aiInput);

        // Update lead document based on AI result
        if (result.aiUsed && result.aiData) {
            await leadRef.update({
                ...result.aiData,
                'aiStandardization.status': 'completed',
                'aiStandardization.completedAt': FieldValue.serverTimestamp(),
                'aiStandardization.reason': result.aiReason,
            });
        } else {
             await leadRef.update({
                'aiStandardization.status': 'failed',
                'aiStandardization.failedAt': FieldValue.serverTimestamp(),
                'aiStandardization.reason': result.aiReason,
            });
        }

        return NextResponse.json({ success: true, leadId });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in /api/ai/standardize-lead for leadId ${leadId}:`, errorMessage);

        // Update the lead to reflect the failure
        if (adminDb && leadId) {
             try {
                const leadRef = adminDb.collection('leads').doc(leadId as string);
                await leadRef.update({
                    'aiStandardization.status': 'failed',
                    'aiStandardization.failedAt': FieldValue.serverTimestamp(),
                    'aiStandardization.reason': `API Error: ${errorMessage}`,
                });
            } catch (updateError) {
                console.error(`Failed to update lead status to 'failed' for leadId ${leadId}:`, updateError);
            }
        }
       
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
