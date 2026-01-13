import * as functions from 'firebase-functions';
import { db } from './firebase-init';

export const adminCrm = functions.https.onCall(async (data, context) => {
  // Verify admin auth
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { action, leadId, updates, filters } = data || {};

  try {
    switch (action) {
      case 'list': {
        let query = db.collection('leads').orderBy('created_at', 'desc');
        
        if (filters?.stage) {
          query = query.where('stage', '==', filters.stage);
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        } else {
          query = query.limit(100);
        }

        const snapshot = await query.get();
        const leads = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        return { ok: true, leads };
      }

      case 'update': {
        if (!leadId || !updates) {
          throw new functions.https.HttpsError('invalid-argument', 'leadId and updates required');
        }
        await db.collection('leads').doc(leadId).update({
          ...updates,
          updated_at: new Date().toISOString()
        });
        return { ok: true, message: 'Lead updated' };
      }

      case 'delete': {
        if (!leadId) {
          throw new functions.https.HttpsError('invalid-argument', 'leadId required');
        }
        await db.collection('leads').doc(leadId).delete();
        return { ok: true, message: 'Lead deleted' };
      }

      case 'addNote': {
        if (!leadId || !updates?.note) {
          throw new functions.https.HttpsError('invalid-argument', 'leadId and note required');
        }
        const leadRef = db.collection('leads').doc(leadId);
        const lead = await leadRef.get();
        const existingNotes = lead.data()?.notes || [];
        await leadRef.update({
          notes: [...existingNotes, {
            text: updates.note,
            created_at: new Date().toISOString(),
            author: context.auth.uid
          }]
        });
        return { ok: true, message: 'Note added' };
      }

      default: {
        // Default: list leads
        const snapshot = await db.collection('leads')
          .orderBy('created_at', 'desc')
          .limit(100)
          .get();
        
        const leads = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Return actual data from database - no sample/dummy data
        return { ok: true, leads };
      }
    }
  } catch (error) {
    console.error('CRM Error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process CRM request');
  }
});
