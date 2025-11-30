
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, OrderByDirection } from 'firebase-admin/firestore';
import { Parser } from 'json2csv';

initializeApp();
const db = getFirestore();

const COLLECTION = 'leads';

interface ListData {
    limit?: number;
    sortBy?: string;
    sortOrder?: OrderByDirection;
    stage?: string;
    source?: string;
    search?: string;
}

export const list = onCall<{data: ListData}>(async (req) => {
  if (!req.auth?.token.roles?.includes('admin')) {
    throw new HttpsError('permission-denied', 'You must be an admin to access leads.');
  }

  const { limit = 100, sortBy = 'created_at', sortOrder = 'desc', stage, source, search } = req.data.data;

  let query: FirebaseFirestore.Query = db.collection(COLLECTION);

  if (stage) {
    query = query.where('stage', '==', stage);
  }
  if (source) {
    query = query.where('source', '==', source);
  }
  if (search) {
    // Note: This is a simple search. For production, use a dedicated search service like Algolia.
    query = query.where('name', '>=', search).where('name', '<=', search + '\uf8ff');
  }

  query = query.orderBy(sortBy, sortOrder).limit(limit);

  const snapshot = await query.get();
  const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { ok: true, leads };
});

export const update = onCall(async (req) => {
  if (!req.auth?.token.roles?.includes('admin')) {
    throw new HttpsError('permission-denied', 'You must be an admin to update leads.');
  }

  const { id, ...data } = req.data;
  if (!id) {
    throw new HttpsError('invalid-argument', 'Lead ID is required.');
  }

  await db.collection(COLLECTION).doc(id).update(data);
  return { ok: true };
});

export const exportCsv = onCall(async (req) => {
  if (!req.auth?.token.roles?.includes('admin')) {
    throw new HttpsError('permission-denied', 'You must be an admin to export leads.');
  }

  const snapshot = await db.collection(COLLECTION).orderBy('created_at', 'desc').get();
  const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (leads.length === 0) {
    return '';
  }

  const json2csvParser = new Parser();
  const csv = json2csvParser.parse(leads);

  return csv;
});
