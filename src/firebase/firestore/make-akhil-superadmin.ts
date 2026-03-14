import { doc, updateDoc, getDocs, query, where, collection } from 'firebase/firestore';
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

    // Try multiple ways to find akhilvenugopal user
    const searchQueries = [
      query(collection(firestore, 'users'), where('email', '==', 'akhilvenugopal@gmail.com')),
      query(collection(firestore, 'users'), where('displayName', '==', 'akhil venugopal')),
      query(collection(firestore, 'users'), where('email', '==', 'akhil venugopal'))
    ];

    let userDoc = null;
    
    for (const usersQuery of searchQueries) {
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        userDoc = querySnapshot.docs[0];
        console.log('Found user:', userDoc.data());
        break;
      }
    }
    
    if (!userDoc) {
      console.log('User akhilvenugopal not found with any search method');
      return { success: false, error: 'User not found' };
    }

    const currentRole = userDoc.data()?.role;
    console.log('Current role:', currentRole);
    
    // Update to superadmin role
    await updateDoc(doc(firestore, 'users', userDoc.id), {
      role: 'superadmin',
      updatedAt: new Date()
    });

    console.log('Successfully updated akhilvenugopal to superadmin');
    toast.success('akhilvenugopal has been promoted to Super Admin');
    return { success: true, userId: userDoc.id, previousRole: currentRole };
    
  } catch (error: any) {
    console.error('Error making akhilvenugopal superadmin:', error);
    toast.error('Failed to update user role');
    return { success: false, error: error.message };
  }
}
