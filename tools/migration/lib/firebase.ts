import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  // Check if we have credentials in env or use default Google Cloud credentials
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback to default (works in Cloud Run / Google Env)
    admin.initializeApp();
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export const firestore = admin.firestore;
