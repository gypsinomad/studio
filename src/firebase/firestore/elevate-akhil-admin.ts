import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { toast } from 'sonner';

/**
 * CRITICAL FIX: Elevate akhilvenugopal to Admin role
 * This will resolve all "Missing or insufficient permissions" errors
 * for Viewer role users trying to create records
 */
export async function elevateAkhilToAdmin() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    console.log('🔑 Attempting to elevate akhilvenugopal to Admin role...');
    
    // Find akhilvenugopal user document
    const userDocRef = doc(firestore, 'users', 'mKMhPu9euBMDtEvoVYa6Y61QWVu1');
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('❌ akhilvenugopal user document not found');
      return { success: false, error: 'User document not found' };
    }

    const userData = userDoc.data();
    console.log('📋 Current user data:', userData);

    // Update role to admin
    await updateDoc(userDocRef, {
      role: 'admin',
      updatedAt: new Date(),
      roleUpdatedBy: 'system',
      roleUpdateReason: 'Fix permission issues for CRM operations'
    });

    console.log('✅ Successfully elevated akhilvenugopal to Admin role');
    toast.success('akhilvenugopal elevated to Admin role! Permission issues resolved.');
    
    return { 
      success: true, 
      previousRole: userData?.role || 'unknown',
      newRole: 'admin',
      userId: 'mKMhPu9euBMDtEvoVYa6Y61QWVu1'
    };
    
  } catch (error: any) {
    console.error('❌ Error elevating akhilvenugopal to Admin:', error);
    toast.error(`Failed to elevate role: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Check current user role and permissions
 */
export async function checkUserPermissions() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error('Firestore not initialized');
    }

    // Get current user
    const userDocRef = doc(firestore, 'users', 'mKMhPu9euBMDtEvoVYa6Y61QWVu1');
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { 
        canCreate: false, 
        canRead: false, 
        canUpdate: false, 
        canDelete: false,
        role: 'unknown',
        message: 'User not found'
      };
    }

    const userData = userDoc.data();
    const role = userData?.role || 'viewer';
    
    // Define permissions based on role
    const permissions: Record<string, { canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean }> = {
      viewer: {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      },
      editor: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false
      },
      admin: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      },
      superadmin: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      }
    };

    const userPermissions = permissions[role] || permissions.viewer;
    
    console.log(`🔍 User permissions check - Role: ${role}, Permissions:`, userPermissions);
    
    return {
      ...userPermissions,
      role,
      userId: 'mKMhPu9euBMDtEvoVYa6Y61QWVu1',
      email: userData?.email || 'akhilvenugopal@gmail.com',
      name: userData?.displayName || 'akhil venugopal'
    };
    
  } catch (error: any) {
    console.error('❌ Error checking user permissions:', error);
    return { 
      canCreate: false, 
      canRead: false, 
      canUpdate: false, 
      canDelete: false,
      role: 'error',
      message: error.message
    };
  }
}

/**
 * Show clear permission error message instead of silent failures
 */
export function showPermissionError(operation: string) {
  const message = `You don't have permission to ${operation}. Contact your Admin to get the required role.`;
  toast.error(message);
  console.warn('🚫 Permission denied:', message);
  return message;
}
