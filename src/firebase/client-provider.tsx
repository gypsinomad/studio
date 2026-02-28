'use client';

import React, { useMemo, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { terminate } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []);

  useEffect(() => {
    /**
     * Emergency Recovery: Listen for the specific INTERNAL ASSERTION FAILED (ID: ca9) crash.
     * This usually happens if a listener fails a permission check and React attempts to re-subscribe
     * before the SDK can clean up.
     */
    const handleRejection = async (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || '';
      if (message.includes('INTERNAL ASSERTION FAILED') || message.includes('ca9')) {
        console.error("[CRITICAL] Firestore SDK Assertion Failed. Terminating and reloading...");
        try {
          // Attempt to shut down the corrupted instance
          await terminate(firebaseServices.firestore);
        } finally {
          // Force a full reload to reset the state machine
          window.location.reload();
        }
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, [firebaseServices.firestore]);

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
