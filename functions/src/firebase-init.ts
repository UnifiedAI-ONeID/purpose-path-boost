/**
 * Firebase Admin initialization - use this across all function files
 * to ensure Firebase is only initialized once.
 */
import * as admin from 'firebase-admin';

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export the shared instances
export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();

export { admin };
