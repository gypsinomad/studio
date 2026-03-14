'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';


// This function will correctly handle the singleton pattern for Firebase services.
function getFirebaseServices() {
    // Initialize the app, or get the existing one.
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    // TEMPORARILY DISABLED: Persistence is disabled to debug 'Missing or insufficient permissions' errors.
    // Stale local cache can sometimes cause rule evaluation failures.
    /*
    enableIndexedDbPersistence(firestore)
      .catch((error: any) => {
        if (error.code == 'failed-precondition') {
            // This can happen if persistence is already enabled on another tab
            // or in a previous hot-reload. It's safe to ignore.
        } else if (error.code == 'unimplemented') {
            // The browser doesn't support persistence.
            console.warn('Browser does not support offline persistence.');
        }
    });
    */

    // Return all initialized services.
    return {
        firebaseApp: app,
        auth: getAuth(app),
        firestore,
        storage: getStorage(app),
    };
}

// The result is memoized at the module level, ensuring it's only called once.
const firebaseServices = getFirebaseServices();

// The main export now simply returns the memoized services.
export function initializeFirebase() {
    return firebaseServices;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/update-user-role';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

// Export individual Firebase functions
export { initializeApp, getApp, getApps } from 'firebase/app';
export { getAuth } from 'firebase/auth';
export { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
export { getStorage } from 'firebase/storage';
