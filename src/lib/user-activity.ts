'use client';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { ActivityLog } from './types';

/**
 * Creates a user-facing activity log entry in the 'activity_logs' collection.
 * This is for display in the main dashboard feed.
 * @param firestore Firestore instance.
 * @param icon Lucide icon name for the activity.
 * @param title A short title for the activity feed.
 * @param description A longer description of what happened.
 */
export async function logUserActivity(
  firestore: Firestore,
  icon: string,
  title: string,
  description: string
) {
  if (!firestore) {
    console.error('logUserActivity: Firestore instance not available.');
    return;
  }
  
  try {
    const logData: Omit<ActivityLog, 'id'> = {
      icon,
      title,
      description,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(firestore, 'activity_logs'), logData);
  } catch (error) {
    console.error('Failed to write to user activity log:', error);
  }
}
