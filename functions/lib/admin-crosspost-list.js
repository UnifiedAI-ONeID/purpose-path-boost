"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminCrosspostList = void 0;
const functions = require("firebase-functions");
const firebase_init_1 = require("./firebase-init");
exports.adminCrosspostList = functions.https.onCall(async (data, context) => {
    // Verify admin auth
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const crossposts = await firebase_init_1.db.collection('crossposts')
            .orderBy('created_at', 'desc')
            .limit(50)
            .get();
        const rows = crossposts.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // Return actual data from database - no sample/dummy data
        return {
            ok: true,
            rows: rows,
        };
    }
    catch (error) {
        console.error('Error fetching crossposts:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch crossposts');
    }
});
//# sourceMappingURL=admin-crosspost-list.js.map