'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';
import { User as FirebaseUser } from 'firebase/auth';

interface UseCurrentUserResult {
  user: FirebaseUser | null;
  userProfile: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSales: boolean;
  isViewer: boolean;
  canCreateLead: boolean;
}

const ADMIN_EMAIL = 'akhilvenugopal@gmail.com';

/**
 * A hook to manage the user's authentication state and Firestore profile data.
 * It provides a consolidated view of the user, their role, and permissions.
 * It also handles creating a user profile document in Firestore on their first sign-in.
 * Admin status is determined by email, while other roles are from the Firestore document.
 */
export function useCurrentUser(): UseCurrentUserResult {
  const { user: firebaseUser, isUserLoading: authLoading } = useUser();
  const firestore = useFirestore();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Memoize the document reference to prevent re-fetching on every render
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<User>(userDocRef);

  // This effect handles the creation of the user profile document in Firestore
  // if it doesn't exist upon login.
  useEffect(() => {
    const shouldCreateProfile = !authLoading && firebaseUser && !profileLoading && !userProfile && !isCreatingProfile;

    if (shouldCreateProfile) {
      const createProfile = async () => {
        setIsCreatingProfile(true);
        if (!userDocRef) return;

        // The user's role is determined by email for admin, otherwise defaults to 'salesExecutive'.
        const initialRole: UserRole = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'salesExecutive';

        const newUserProfileData: Omit<User, 'id'> = {
          authUid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'New User',
          role: initialRole,
          isActive: true,
          createdAt: serverTimestamp(),
          companyIds: [],
          avatarUrl: firebaseUser.photoURL || undefined,
        };

        try {
          await setDoc(userDocRef, newUserProfileData);
        } catch (error) {
          console.error("Failed to create user profile in hook:", error);
          // Handle error appropriately, maybe set an error state
        } finally {
          setIsCreatingProfile(false);
        }
      };
      createProfile();
    }
  }, [authLoading, firebaseUser, profileLoading, userProfile, isCreatingProfile, userDocRef]);
  
  const isLoading = authLoading || profileLoading || isCreatingProfile;
  const isAuthenticated = !!firebaseUser && !isLoading;
  
  // Admin status is definitively determined by the email address.
  const isAdmin = isAuthenticated && firebaseUser.email?.toLowerCase() === ADMIN_EMAIL;
  
  // The role is 'admin' if the email matches, otherwise it's the role from their Firestore profile.
  const role = isAdmin ? 'admin' : (userProfile?.role || null);
  
  const isSales = role === 'salesExecutive';
  const isViewer = role === 'viewer';
  
  // Define who can create leads based on their role.
  const canCreateLead = isAdmin || isSales;

  return {
    user: firebaseUser,
    userProfile,
    role,
    isLoading,
    isAuthenticated,
    isAdmin,
    isSales,
    isViewer,
    canCreateLead,
  };
}
