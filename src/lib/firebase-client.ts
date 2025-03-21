import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// We only want to initialize Firebase on the client
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Check if we're running on the client side
const isClient = typeof window !== "undefined";

if (!isClient) {
  // Return placeholder objects for server-side
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
} else {
  try {
    // Check if we have required config
    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId
    ) {
      console.error(
        "Firebase configuration error: Missing required environment variables. Check your .env.local file."
      );
      throw new Error("Missing Firebase config");
    }

    // Initialize Firebase if not already initialized
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization error:", error);
    // Provide fallbacks for client-side
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
  }
}

export { app, auth, db };
