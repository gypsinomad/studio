import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { validateAndStandardizeLeadData, type ValidateAndStandardizeLeadDataInput } from '@/ai/flows/validate-and-standardize-lead-data';
import { FieldValue } from 'firebase-admin/firestore';
import type { Lead, LeadPriority } from '@/lib/types';


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

        const result = await validateAndStandardizeLeadData(aiInput);
        let updateData: any = {};

        if (result.aiUsed && result.aiData) {
             updateData = {
                ...result.aiData,
                'aiStandardization.status': 'completed',
                'aiStandardization.completedAt': FieldValue.serverTimestamp(),
                'aiStandardization.reason': result.aiReason,
            };
        } else {
             updateData = {
                'aiStandardization.status': 'failed',
                'aiStandardization.failedAt': FieldValue.serverTimestamp(),
                'aiStandardization.reason': result.aiReason,
            };
        }

        let score = 0;
        const dataForScoring = { ...leadData, ...updateData };

        const sourceScores: { [key: string]: number } = {
            referral: 25,
            tradeShow: 20,
            website: 15,
            whatsapp: 10,
            facebookLeadAds: 5,
        };
        score += sourceScores[dataForScoring.source] || 0;

        const countryScores: { [key: string]: number } = {
            "United States": 15, "USA": 15,
            "UAE": 15, "United Arab Emirates": 15,
            "Germany": 10,
            "United Kingdom": 10, "UK": 10,
        };
        if (countryScores[dataForScoring.destinationCountry]) {
            score += countryScores[dataForScoring.destinationCountry];
        }

        if (dataForScoring.productInterest?.toLowerCase().includes('cardamom')) score += 15;
        if (dataForScoring.productInterest?.toLowerCase().includes('pepper')) score += 10;
        if (dataForScoring.productInterest?.toLowerCase().includes('saffron')) score += 20;

        let priority: LeadPriority = 'cold';
        if (score > 50) {
            priority = 'hot';
        } else if (score > 25) {
            priority = 'warm';
        }

        updateData.score = score;
        updateData.priority = priority;

        await leadRef.update(updateData);

        return NextResponse.json({ success: true, leadId, message: "Lead standardized and scored." });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in /api/ai/standardize-lead for leadId ${leadId}:`, errorMessage);

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
