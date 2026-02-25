'use client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AuditLog } from './types';

type Action = 'create' | 'update' | 'delete';

export async function logActivity(
  firestore: Firestore,
  user: FirebaseUser,
  action: Action,
  collectionName: string,
  docId: string,
  before: any = null,
  after: any = null
) {
  if (!firestore || !user) {
    console.error('Logger: Firestore or User not available.');
    return;
  }
  
  try {
    const logData: Omit<AuditLog, 'id'> = {
      userId: user.uid,
      userEmail: user.email || 'unknown',
      action,
      collectionName,
      docId,
      timestamp: serverTimestamp(),
    };

    if (before) {
        logData.before = JSON.parse(JSON.stringify(before, (key, value) => {
            if (value && typeof value === 'object' && value.hasOwnProperty('seconds')) {
                return new Date(value.seconds * 1000).toISOString();
            }
            return value;
        }));
    }
    if (after) {
        logData.after = JSON.parse(JSON.stringify(after, (key, value) => {
            if (value && typeof value === 'object' && value.hasOwnProperty('seconds')) {
                return new Date(value.seconds * 1000).toISOString();
            }
            return value;
        }));
    }

    // Standardized to activity_logs
    await addDoc(collection(firestore, 'activity_logs'), logData);
  } catch (error) {
    console.error('Failed to write to activity log:', error);
  }
}
