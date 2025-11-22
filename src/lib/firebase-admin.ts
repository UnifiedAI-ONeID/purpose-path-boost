import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Initialize Firebase Admin SDK
// Expects GOOGLE_APPLICATION_CREDENTIALS env var pointing to service account key
// OR standard Firebase env vars if running in Cloud Functions/Google Cloud
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault() 
    });
    console.log('🔥 Firebase Admin Initialized');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    process.exit(1);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
