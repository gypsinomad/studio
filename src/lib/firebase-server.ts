import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK for server-side use
let firestore: any;

try {
  if (getApps().length === 0) {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'demo-project',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'demo@example.com',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || 'demo-key',
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
    });
    firestore = getFirestore(app);
  } else {
    firestore = getFirestore(getApps()[0]);
  }
} catch (error) {
  console.warn('Firebase Admin SDK initialization failed:', error);
  // Fallback to mock for development
  firestore = {
    collection: () => ({
      add: () => Promise.resolve({ id: 'mock-id' }),
      get: () => Promise.resolve({ docs: [] }),
      where: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      orderBy: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      limit: () => ({ get: () => Promise.resolve({ docs: [] }) }),
    })
  };
}

export { firestore };
