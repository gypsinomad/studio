// Admin utility to fix user roles
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export async function fixUserRole(email: string, role: 'admin' | 'salesExecutive' | 'viewer') {
  try {
    const { firestore } = initializeFirebase();
    
    // Find user by email
    const usersQuery = query(collection(firestore, 'users'), where('email', '==', email));
    const userSnapshot = await getDocs(usersQuery);
    
    if (userSnapshot.empty) {
      console.error(`User ${email} not found`);
      return false;
    }
    
    const userDoc = userSnapshot.docs[0];
    await updateDoc(doc(firestore, 'users', userDoc.id), {
      role: role,
      updatedAt: new Date()
    });
    
    console.log(`Updated ${email} role to ${role}`);
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

// Fix akhil venugopal's role
export async function fixAkhilRole() {
  return await fixUserRole('akhil venugopal', 'admin');
}
