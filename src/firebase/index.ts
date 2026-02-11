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

    // Try to enable persistence, but catch the error if it's already enabled.
    // This is the key to preventing crashes during development hot-reloads.
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
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
