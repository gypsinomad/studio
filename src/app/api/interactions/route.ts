import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: Request) {
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
        const { leadId, type, direction, summary } = await request.json();

        if (!leadId || !type || !direction || !summary) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
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
            return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
        }

        const batch = adminDb.batch();

        // 1. Create the interaction document
        const interactionRef = adminDb.collection('interactions').doc();
        batch.set(interactionRef, {
            leadId,
            type,
            direction,
            summary,
            userId: uid,
            timestamp: FieldValue.serverTimestamp(),
        });

        // 2. Update the lead's lastContactAt timestamp
        batch.update(leadRef, {
            lastContactAt: FieldValue.serverTimestamp(),
        });

        await batch.commit();

        return NextResponse.json({ success: true, interactionId: interactionRef.id });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error('Error in /api/interactions:', errorMessage);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
