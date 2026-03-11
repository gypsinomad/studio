import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function backfillActivityLog() {
  try {
    // Backfill leads
    const leadsSnap = await getDocs(collection(db, 'leads'));
    for (const doc of leadsSnap.docs) {
      const data = doc.data();
      await addDoc(collection(db, 'activity_logs'), {
        orgId: data.orgId || 'default',
        type: 'lead_created',
        message: `Lead created: ${data.companyName || data.fullName || 'Unknown'}`,
        action: 'create',
        collectionName: 'leads',
        docId: doc.id,
        userId: data.createdBy || 'unknown',
        timestamp: data.createdAt || serverTimestamp(),
        backfilled: true
      });
    }

    // Backfill tasks
    const tasksSnap = await getDocs(collection(db, 'tasks'));
    for (const doc of tasksSnap.docs) {
      const data = doc.data();
      await addDoc(collection(db, 'activity_logs'), {
        orgId: data.orgId || 'default',
        type: 'task_created',
        message: `Task created: ${data.title || 'Unknown'}`,
        action: 'create',
        collectionName: 'tasks',
        docId: doc.id,
        userId: data.createdBy || 'unknown',
        timestamp: data.createdAt || serverTimestamp(),
        backfilled: true
      });
    }

    console.log('Activity log backfill complete');
  } catch (error) {
    console.error('Error backfilling activity log:', error);
  }
}
