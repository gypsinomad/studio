
import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { checkExportOrderCompliance, type CheckExportOrderComplianceInput } from '@/ai/flows/check-export-order-compliance';
import { FieldValue } from 'firebase-admin/firestore';
import type { ExportOrder, ComplianceRiskLevel } from '@/lib/types';

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
    const { orderId } = params;

    if (!orderId) {
        return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }
    if (!adminDb) {
        return NextResponse.json({ success: false, error: 'Database connection is not available' }, { status: 500 });
    }

    try {
        const orderRef = adminDb.collection('exportOrders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (!orderSnap.exists) {
            return NextResponse.json({ success: false, error: 'Export Order not found' }, { status: 404 });
        }
        
        const orderData = orderSnap.data() as ExportOrder;
        
        // This input should be built from the most current order data
        const aiInput: CheckExportOrderComplianceInput = {
            title: orderData.title,
            stage: orderData.stage,
            companyId: orderData.companyId,
            contactId: orderData.contactId,
            productType: orderData.productType || 'N/A',
            destinationCountry: orderData.destinationCountry,
            incoterms: orderData.incoterms,
            hsCode: orderData.hsCode || 'N/A',
            totalValue: orderData.totalValue,
            paymentTerms: orderData.paymentTerms,
            containerType: orderData.containerType || 'N/A',
            portOfLoading: orderData.portOfLoading || 'N/A',
            // @ts-ignore
            expectedShipmentDate: orderData.etd?.toDate ? orderData.etd.toDate().toISOString() : new Date().toISOString(),
            fssaiLicenseNumber: orderData.fssaiNumber || 'N/A',
            icegateStatus: orderData.iceGateStatus || 'Not Started',
            certificateRequirements: orderData.certificateRequirements || [],
        };

        const result = await checkExportOrderCompliance(aiInput);
        let updateData: any = {};

        if (result.aiUsed && result.aiData) {
            // Determine risk level based on the AI's notes.
            const notes = result.aiData.aiValidation.toLowerCase();
            let riskLevel: ComplianceRiskLevel = 'low';
            if (notes.includes('critical') || notes.includes('prohibited') || notes.includes('high risk')) {
                riskLevel = 'high';
            } else if (notes.includes('warning') || notes.includes('requires review') || notes.includes('potential issue')) {
                riskLevel = 'medium';
            }

            updateData = {
                'complianceNotes': result.aiData.aiValidation,
                'complianceRiskLevel': riskLevel,
                'aiValidation': result.aiReason, // Using this field to store the guard reason
            };
        } else {
             updateData = {
                'complianceNotes': `AI check could not be performed. Reason: ${result.aiReason}`,
                'complianceRiskLevel': 'medium', // Default to medium risk if AI fails
                'aiValidation': result.aiReason,
            };
        }

        await orderRef.update(updateData);

        return NextResponse.json({ success: true, orderId, message: "Compliance check completed." });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in /api/export-orders/check-compliance for orderId ${orderId}:`, errorMessage);
       
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
