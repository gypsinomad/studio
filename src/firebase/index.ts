'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage';


// This function will correctly handle the singleton pattern for Firebase services.
function getFirebaseServices() {
    // If an app is already initialized, return the existing services.
    if (getApps().length) {
        const app = getApp();
        return {
            firebaseApp: app,
            auth: getAuth(app),
            firestore: getFirestore(app),
            storage: getStorage(app),
        };
    }

    // This block runs only once per application load.
    // Initialize the app and then immediately enable persistence.
    let firebaseApp;
    try {
        // For Firebase App Hosting
        firebaseApp = initializeApp();
    } catch (e) {
        if (process.env.NODE_ENV === "production") {
            console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        }
        firebaseApp = initializeApp(firebaseConfig);
    }
    
    const firestore = getFirestore(firebaseApp);
    enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence enabled in first tab only.');
        } else if (err.code === 'unimplemented') {
            console.warn('Browser does not support offline persistence.');
        }
    });

    // Return all initialized services.
    return {
        firebaseApp,
        auth: getAuth(firebaseApp),
        firestore,
        storage: getStorage(firebaseApp),
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
