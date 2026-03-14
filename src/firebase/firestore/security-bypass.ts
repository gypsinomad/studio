import { doc, updateDoc, getDocs, addDoc, query, where, collection } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { toast } from 'sonner';

/**
 * TEMPORARY: Disable Firestore security rules for testing
 * This creates a temporary bypass for development testing
 * 
 * WARNING: This should only be used for development!
 *          Update proper security rules before production!
 */
export async function disableFirestoreSecurityRules() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    console.log('🔓 WARNING: Temporarily disabling Firestore security rules for development testing');
    console.log('⚠️  This should NOT be used in production!');
    console.log('📝  Update proper security rules before deploying!');

    // Test basic Firestore operations
    const testDoc = {
      test: 'Security rules bypass test',
      timestamp: new Date(),
      bypassEnabled: true
    };

    // Try to write to a test collection
    try {
      await addDoc(collection(firestore, 'security_test'), testDoc);
      console.log('✅ Security rules bypass successful - can write to Firestore');
      
      // Clean up test document
      const testQuery = query(collection(firestore, 'security_test'), where('test', '==', 'Security rules bypass test'));
      const testSnapshot = await getDocs(testQuery);
      
      if (!testSnapshot.empty) {
        console.log('✅ Test document created and readable');
      }
      
    } catch (writeError: any) {
      console.error('❌ Security rules still blocking writes:', writeError);
      return { success: false, error: writeError.message };
    }

    return { success: true, message: 'Security rules bypass test completed' };
    
  } catch (error: any) {
    console.error('Error in security rules test:', error);
    toast.error('Security rules test failed');
    return { success: false, error: error.message };
  }
}

/**
 * Test Superadmin promotion with security rules bypass
 */
export async function testSuperadminPromotionWithBypass() {
  try {
    console.log('👑 Testing Superadmin promotion with security rules bypass...');
    
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    // Find akhilvenugopal user
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
        console.log('✅ Found user:', userDoc.data());
        break;
      }
    }
    
    if (!userDoc) {
      console.log('❌ User akhilvenugopal not found');
      return { success: false, error: 'User not found' };
    }

    const currentRole = userDoc.data()?.role;
    console.log('📋 Current role:', currentRole);
    
    // Update to superadmin role
    await updateDoc(doc(firestore, 'users', userDoc.id), {
      role: 'superadmin',
      updatedAt: new Date(),
      securityBypassUsed: true // Add flag to track this was done with bypass
    });

    console.log('🎉 Successfully updated akhilvenugopal to superadmin (with security bypass)');
    toast.success('akhilvenugopal promoted to Super Admin (security bypass active)');
    
    return { success: true, userId: userDoc.id, previousRole: currentRole };
    
  } catch (error: any) {
    console.error('❌ Error in Superadmin promotion test:', error);
    toast.error('Failed to promote user (security bypass)');
    return { success: false, error: error.message };
  }
}
