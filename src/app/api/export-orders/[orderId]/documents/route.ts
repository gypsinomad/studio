import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { DEFAULT_DOCUMENT_CHECKLIST } from '@/lib/constants';
import type { DocumentChecklistItem } from '@/lib/types';

async function verifyAccess(
  token: string | undefined,
  orderId: string
): Promise<{ uid: string; role: string; hasAccess: boolean }> {
  if (!token) {
    return { uid: '', role: '', hasAccess: false };
  }
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  const decodedToken = await getAuth().verifyIdToken(token);
  const { uid } = decodedToken;

  const userDoc = await adminDb.collection('users').doc(uid).get();
  const role = userDoc.data()?.role || '';

  if (role === 'admin') {
    return { uid, role, hasAccess: true };
  }

  const orderDoc = await adminDb.collection('exportOrders').doc(orderId).get();
  const orderData = orderDoc.data();

  if (orderData?.assignedUserId === uid) {
    return { uid, role, hasAccess: true };
  }

  return { uid, role, hasAccess: false };
}

export async function GET(request: Request, { params }: { params: { orderId: string } }) {
  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  const { orderId } = params;
  const token = request.headers.get('Authorization')?.split('Bearer ')[1];

  try {
    const { hasAccess } = await verifyAccess(token, orderId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const checklistRef = adminDb.collection('exportOrders').doc(orderId).collection('documentsChecklist');
    let checklistSnapshot = await checklistRef.get();

    // If checklist is empty, initialize it with defaults
    if (checklistSnapshot.empty) {
      const batch = adminDb.batch();
      DEFAULT_DOCUMENT_CHECKLIST.forEach((item) => {
        const docRef = checklistRef.doc();
        batch.set(docRef, {
          ...item,
          updatedAt: FieldValue.serverTimestamp(),
        });
      });
      await batch.commit();
      // Re-fetch after creation
      checklistSnapshot = await checklistRef.get();
    }

    const checklist = checklistSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(checklist);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error(`Error fetching document checklist for order ${orderId}:`, errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { orderId: string } }) {
    if (!adminDb) {
        return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const { orderId } = params;
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    const body = await request.json();
    const { checklistItemId, ...updateData } = body;

    if (!checklistItemId) {
        return NextResponse.json({ error: 'checklistItemId is required' }, { status: 400 });
    }

    try {
        const { uid, hasAccess } = await verifyAccess(token, orderId);
        if (!hasAccess) {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const itemRef = adminDb.collection('exportOrders').doc(orderId).collection('documentsChecklist').doc(checklistItemId);

        await itemRef.update({
            ...updateData,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: uid,
        });

        return NextResponse.json({ success: true, message: 'Checklist item updated.' });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error updating checklist item ${checklistItemId} for order ${orderId}:`, errorMessage);
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
