// src/firebase/admin.ts
import "server-only";
import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | undefined;

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  adminDb = admin.firestore();
} catch (error) {
  console.error("Firebase Admin SDK initialization failed. This can happen in a local environment without Application Default Credentials. Server-side Firebase features will be disabled.", error instanceof Error ? error.message : error);
}

export { adminDb };
