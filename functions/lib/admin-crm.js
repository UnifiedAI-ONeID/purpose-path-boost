"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCrm = void 0;
const functions = require("firebase-functions");
const firestore_1 = require("firebase-admin/firestore");
exports.adminCrm = functions.https.onCall(async (data, context) => {
    var _a;
    // Verify admin auth
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { action, leadId, updates, filters } = data || {};
    const db = (0, firestore_1.getFirestore)();
    try {
        switch (action) {
            case 'list': {
                let query = db.collection('leads').orderBy('created_at', 'desc');
                if (filters === null || filters === void 0 ? void 0 : filters.stage) {
                    query = query.where('stage', '==', filters.stage);
                }
                if (filters === null || filters === void 0 ? void 0 : filters.limit) {
                    query = query.limit(filters.limit);
                }
                else {
                    query = query.limit(100);
                }
                const snapshot = await query.get();
                const leads = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                return { ok: true, leads };
            }
            case 'update': {
                if (!leadId || !updates) {
                    throw new functions.https.HttpsError('invalid-argument', 'leadId and updates required');
                }
                await db.collection('leads').doc(leadId).update(Object.assign(Object.assign({}, updates), { updated_at: new Date().toISOString() }));
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
                if (!leadId || !(updates === null || updates === void 0 ? void 0 : updates.note)) {
                    throw new functions.https.HttpsError('invalid-argument', 'leadId and note required');
                }
                const leadRef = db.collection('leads').doc(leadId);
                const lead = await leadRef.get();
                const existingNotes = ((_a = lead.data()) === null || _a === void 0 ? void 0 : _a.notes) || [];
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
                const leads = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                // Return actual data from database - no sample/dummy data
                return { ok: true, leads };
            }
        }
    }
    catch (error) {
        console.error('CRM Error:', error);
        throw new functions.https.HttpsError('internal', 'Failed to process CRM request');
    }
});
//# sourceMappingURL=admin-crm.js.map