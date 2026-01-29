// src/firebase/admin.ts
import "server-only";
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

export const adminDb = admin.firestore();
