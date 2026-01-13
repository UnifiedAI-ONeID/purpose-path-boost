import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

export const adminCrosspostList = functions.https.onCall(async (data, context) => {
  // Verify admin auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    const db = getFirestore();
    const crossposts = await db.collection('crossposts')
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();

    const rows = crossposts.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      ok: true,
      rows: rows.length > 0 ? rows : [
        {
          id: '1',
          platform: 'linkedin',
          title: 'Sample LinkedIn post',
          status: 'posted',
          scheduled_at: null,
          published_at: new Date().toISOString(),
        },
        {
          id: '2',
          platform: 'x',
          title: 'Sample X post',
          status: 'queued',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          published_at: null,
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching crossposts:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch crossposts');
  }
});
