'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  // If in development, connect to emulators.
  // This is a common pattern but might need adjustment based on specific dev environment.
  if (process.env.NODE_ENV === 'development') {
    // Check if not already connected to avoid re-connecting on hot reloads
    // @ts-ignore - _isInitialized is not in the public API but useful here
    if (!auth.emulatorConfig) {
      try {
        connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      } catch (e) {
        console.warn("Could not connect to Auth Emulator. This is normal if it's not running.", e instanceof Error ? e.message: e)
      }
    }
     // @ts-ignore
    if (!firestore._settings.host) {
       try {
        connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
      } catch (e) {
         console.warn("Could not connect to Firestore Emulator. This is normal if it's not running.", e instanceof Error ? e.message: e)
      }
    }
  }

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
