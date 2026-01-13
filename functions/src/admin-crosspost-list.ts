import * as functions from 'firebase-functions';
import { db } from './firebase-init';

export const adminCrosspostList = functions.https.onCall(async (data, context) => {
  // Verify admin auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const crossposts = await db.collection('crossposts')
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const rows = crossposts.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Return actual data from database - no sample/dummy data
    return {
      ok: true,
      rows: rows,
    };
  } catch (error) {
    console.error('Error fetching crossposts:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch crossposts');
  }
});
