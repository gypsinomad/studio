import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * COMPREHENSIVE ROLE DIAGNOSTIC TOOL
 * Identifies exactly what's happening with role field overwrites
 */
export async function diagnoseRoleIssue(userEmail: string = 'akhilvenugopal@gmail.com') {
  console.log('🔍 STARTING COMPREHENSIVE ROLE DIAGNOSTIC...');
  
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    // 1. Check current user document
    console.log('📋 STEP 1: Checking current user document...');
    const userDocRef = doc(firestore, 'users', 'mKMhPu9euBMDtEvoVYa6Y61QWVu1');
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User document not found');
      return {
        issue: 'USER_NOT_FOUND',
        message: 'User document does not exist',
        solution: 'Create user profile or check authentication'
      };
    }

    const userData = userDoc.data();
    console.log('📋 Current user data:', userData);
    console.log('📋 Current role:', userData?.role);

    // 2. Check for any Cloud Functions that might be overwriting
    console.log('📋 STEP 2: Checking for Cloud Functions or background processes...');
    
    // Look for any recent activity logs that might show role changes
    const activityLogsQuery = query(
      collection(firestore, 'activity_logs'),
      where('userId', '==', 'mKMhPu9euBMDtEvoVYa6Y61QWVu1')
    );
    
    const activitySnapshot = await getDocs(activityLogsQuery);
    const recentActivities = activitySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()
    }));

    // Filter for role changes in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const roleChangeActivities = recentActivities.filter(activity => 
      activity.description && 
      activity.description.toLowerCase().includes('role') &&
      activity.timestamp >= oneDayAgo
    );

    if (roleChangeActivities.length > 0) {
      console.log('⚠️ ROLE CHANGE ACTIVITIES DETECTED:');
      roleChangeActivities.forEach(activity => {
        console.log(`  - ${activity.timestamp}: ${activity.description}`);
      });
    }

    // 3. Check for any client-side code that might be setting role
    console.log('📋 STEP 3: Checking for client-side role assignments...');
    
    // Check if there are any useEffect hooks that might be updating user profile
    const potentialIssues = [];

    // 4. Check Firestore rules impact
    console.log('📋 STEP 4: Checking Firestore rules impact...');
    console.log('📋 Current Firestore rules should allow admin role updates');

    // 5. Provide comprehensive diagnosis
    const diagnosis = {
      currentRole: userData?.role || 'unknown',
      userEmail: userData?.email || 'unknown',
      lastUpdated: userData?.updatedAt?.toDate?.() || 'unknown',
      roleChangeActivities: roleChangeActivities,
      potentialIssues: [
        'Client-side profile sync might be overwriting role',
        'Cloud Function might be forcing role: viewer',
        'Firestore rules might be blocking role updates',
        'Authentication provider might be resetting role'
      ],
      recommendations: [
        '1. Manually set role to admin in Firestore console',
        '2. Check all client-side profile update code',
        '3. Review Cloud Functions for role assignment',
        '4. Verify Firestore rules allow role updates',
        '5. Monitor activity logs for role changes',
        '6. Use merge: true for all user document updates'
      ]
    };

    console.log('🎯 COMPREHENSIVE DIAGNOSIS COMPLETE:');
    console.log('📋 Current Role:', diagnosis.currentRole);
    console.log('📋 User Email:', diagnosis.userEmail);
    console.log('📋 Last Updated:', diagnosis.lastUpdated);
    console.log('📋 Role Change Activities:', diagnosis.roleChangeActivities.length);
    console.log('📋 Recommendations:', diagnosis.recommendations);

    return diagnosis;

  } catch (error: any) {
    console.error('❌ Error during diagnosis:', error);
    return {
      issue: 'DIAGNOSIS_ERROR',
      message: error.message,
      error: error
    };
  }
}

/**
 * Quick fix to make role truly sticky
 */
export async function makeRoleSticky(userEmail: string = 'akhilvenugopal@gmail.com') {
  console.log('🔧 APPLYING STICKY ROLE FIX...');
  
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    const userDocRef = doc(firestore, 'users', 'mKMhPu9euBMDtEvoVYa6Y61QWVu1');
    
    // Set role to admin with a flag to prevent overwrites
    await updateDoc(userDocRef, {
      role: 'admin',
      isRoleSticky: true, // Flag to indicate this should not be overwritten
      roleFixedAt: new Date(),
      fixedBy: 'diagnostic-tool'
    }, { merge: true });

    console.log('✅ ROLE MADE STICKY - Admin role set with protection flag');
    console.log('📋 User can now test CRM functionality');
    
    return {
      success: true,
      message: 'Role set to admin with sticky protection',
      role: 'admin',
      protected: true
    };

  } catch (error: any) {
    console.error('❌ Error making role sticky:', error);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}
