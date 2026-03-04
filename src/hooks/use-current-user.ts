'use client';

import { useUser } from '@/firebase';
import type { User as CRMUser, UserRole } from '@/lib/types';
import { User as FirebaseUser } from 'firebase/auth';

interface UseCurrentUserResult {
  user: FirebaseUser | null;
  idToken: string | null;
  userProfile: CRMUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  canCreate: boolean;
}

export function useCurrentUser(): UseCurrentUserResult {
  const {
    user,
    idToken,
    userProfile,
    isUserLoading,
    isUserProfileLoading,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
  } = useUser();

  const isLoading = isUserLoading || isUserProfileLoading;

  return {
    user: user as FirebaseUser | null,
    idToken,
    userProfile,
    isLoading,
    isAuthenticated,
    isAdmin,
    role,
    canCreate,
  };
}
