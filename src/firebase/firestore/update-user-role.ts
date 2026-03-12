import { doc, updateDoc } from 'firebase/firestore';
import { getFirestore } from '@/firebase';
import type { User } from '@/lib/types';

/**
 * Updates a user's role in Firestore
 * @param userId - The user ID to update
 * @param newRole - The new role to assign ('admin' | 'manager' | 'viewer')
 */
export async function updateUserRole(userId: string, newRole: 'superadmin' | 'admin' | 'manager' | 'viewer') {
  try {
    const firestore = getFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    // Update the user's role in Firestore
    await updateDoc(doc(firestore, 'users', userId), {
      role: newRole,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return { success: false, error: error.message };
  }
}
