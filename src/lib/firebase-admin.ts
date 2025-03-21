import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// This file is only imported server-side (in API routes or Server Components)
// These variables are never exposed to the client

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY 
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
  : undefined;

if (!projectId) {
  throw new Error('Firebase Project ID is required');
}

// Initialize Firebase Admin SDK for server-side operations
// This requires a service account key from Firebase console
const apps = getApps();
const firebaseAdmin = !apps.length
  ? privateKey 
    ? initializeApp({
        credential: cert({
          projectId,
          clientEmail: clientEmail!,
          privateKey,
        }),
      }) 
    : initializeApp({ projectId }) // Use Application Default Credentials if no service account
  : apps[0];

// Get Auth and Firestore instances
const adminAuth = getAuth(firebaseAdmin);
const adminDb = getFirestore(firebaseAdmin);

export { firebaseAdmin, adminAuth, adminDb };
