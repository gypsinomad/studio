'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { User } from '@/lib/types';

interface UseCurrentCompanyResult {
  companyId: string | null;
  companyIds: string[];
  setCompanyId: (companyId: string) => void;
  isLoading: boolean;
}

/**
 * A hook to manage the user's currently selected company.
 * It fetches the user's profile, determines their associated companies,
 * and provides a mechanism to switch between them.
 */
export function useCurrentCompany(): UseCurrentCompanyResult {
  const { user } = useUser();
  const firestore = useFirestore();
  
  // State to hold the currently selected company ID
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null);

  // Fetch the user's profile document from Firestore
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userProfileRef);

  // This effect runs when the user's profile is loaded or changes.
  // It sets the default company ID.
  useEffect(() => {
    if (userProfile && userProfile.companyIds && userProfile.companyIds.length > 0) {
      // If a company is already selected and is still valid, do nothing.
      if (currentCompanyId && userProfile.companyIds.includes(currentCompanyId)) {
        return;
      }
      // Otherwise, default to the first company in the list.
      setCurrentCompanyId(userProfile.companyIds[0]);
    } else {
        setCurrentCompanyId(null);
    }
  }, [userProfile, currentCompanyId]);
  
  const companyIds = userProfile?.companyIds || [];

  return {
    companyId: currentCompanyId,
    companyIds,
    setCompanyId: setCurrentCompanyId,
    isLoading: isProfileLoading,
  };
}
