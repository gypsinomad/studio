'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';
import { User as FirebaseUser } from 'firebase/auth';

interface UseCurrentUserResult {
  user: FirebaseUser | null;
  idToken: string | null;
  userProfile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  canCreate: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const { user: firebaseUser, idToken, isUserLoading: authLoading } = useUser();
  const firestore = useFirestore();
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !firebaseUser) return null;
    return doc(firestore, 'users', firebaseUser.uid);
  }, [firestore, firebaseUser]);

  const { data: userProfile, isLoading: profileLoading } = useDoc<User>(userDocRef);

  useEffect(() => {
    const shouldCreateProfile = !authLoading && firebaseUser && !profileLoading && !userProfile && !isCreatingProfile;

    if (shouldCreateProfile) {
      const createProfile = async () => {
        setIsCreatingProfile(true);
        if (!userDocRef) return;

        // RESTRICTION REMOVED: Everyone is an admin now.
        const initialRole: UserRole = 'admin';

        const newUserProfileData: Omit<User, 'id'> = {
          authUid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName || 'New User',
          role: initialRole,
          isActive: true,
          createdAt: serverTimestamp(),
          avatarUrl: firebaseUser.photoURL || undefined,
        };

        try {
          await setDoc(userDocRef, newUserProfileData);
        } catch (error) {
          console.error("Failed to create user profile in hook:", error);
        } finally {
          setIsCreatingProfile(false);
        }
      };
      createProfile();
    }
  }, [authLoading, firebaseUser, profileLoading, userProfile, isCreatingProfile, userDocRef]);
  
  const isLoading = authLoading || profileLoading || isCreatingProfile;
  const isAuthenticated = !!firebaseUser && !isLoading;
  
  // RESTRICTION REMOVED: isAdmin is always true if authenticated.
  const isAdmin = isAuthenticated;
  const role = userProfile?.role ?? (isAuthenticated ? 'admin' : null);
  const canCreate = isAuthenticated;

  return {
    user: firebaseUser,
    idToken,
    userProfile,
    isLoading,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
  };
}
