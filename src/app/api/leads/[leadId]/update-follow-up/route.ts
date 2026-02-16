import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: Request, { params }: { params: { leadId: string } }) {
    const { leadId } = params;

    if (!adminDb) {
        return NextResponse.json({ success: false, error: 'Database connection is not available' }, { status: 500 });
    }

    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let decodedToken;
    try {
        decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
    const uid = decodedToken.uid;


    try {
        const { nextFollowUpAt } = await request.json();

        if (!nextFollowUpAt) {
            return NextResponse.json({ success: false, error: 'nextFollowUpAt is required' }, { status: 400 });
        }

        const leadRef = adminDb.collection('leads').doc(leadId);
        const leadDoc = await leadRef.get();

        if (!leadDoc.exists) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }
        
        // RBAC Check
        const leadData = leadDoc.data();
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userRole = userDoc.data()?.role;

        if (userRole !== 'admin' && leadData?.assignedUserId !== uid) {
            return NextResponse.json({ success: false, error: 'Permission denied to update this lead' }, { status: 403 });
        }
        
        await leadRef.update({
            nextFollowUpAt: new Date(nextFollowUpAt),
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in /api/leads/${leadId}/update-follow-up:`, errorMessage);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
