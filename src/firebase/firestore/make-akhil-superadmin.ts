import { doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { getFirestore } from '@/firebase';
import { toast } from 'sonner';

/**
 * Makes akhilvenugopal a superadmin user
 * This is a one-time operation that should be called after deployment
 */
export async function makeAkhilSuperAdmin() {
  try {
    const firestore = getFirestore();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    // Find akhilvenugopal user
    const usersQuery = query(
      collection(firestore, 'users'),
      where('email', '==', 'akhil venugopal')
    );

    const querySnapshot = await getDocs(usersQuery);
    
    if (querySnapshot.empty) {
      console.log('User akhilvenugopal not found');
      return { success: false, error: 'User not found' };
    }

    const userDoc = querySnapshot.docs[0];
    
    // Update to superadmin role
    await updateDoc(doc(firestore, 'users', userDoc.id), {
      role: 'superadmin',
      updatedAt: new Date()
    });

    toast.success('akhilvenugopal has been promoted to Super Admin');
    return { success: true };
    
  } catch (error: any) {
    console.error('Error making akhilvenugopal superadmin:', error);
    toast.error('Failed to update user role');
    return { success: false, error: error.message };
  }
}
