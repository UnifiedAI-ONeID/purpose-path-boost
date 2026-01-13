"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCsv = exports.update = exports.list = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const json2csv_1 = require("json2csv");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const COLLECTION = 'leads';
exports.list = (0, https_1.onCall)(async (req) => {
    var _a, _b;
    if (!((_b = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.token.roles) === null || _b === void 0 ? void 0 : _b.includes('admin'))) {
        throw new https_1.HttpsError('permission-denied', 'You must be an admin to access leads.');
    }
    const { limit = 100, sortBy = 'created_at', sortOrder = 'desc', stage, source, search } = req.data.data;
    let query = db.collection(COLLECTION);
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
    const leads = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return { ok: true, leads };
});
exports.update = (0, https_1.onCall)(async (req) => {
    var _a, _b;
    if (!((_b = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.token.roles) === null || _b === void 0 ? void 0 : _b.includes('admin'))) {
        throw new https_1.HttpsError('permission-denied', 'You must be an admin to update leads.');
    }
    const _c = req.data, { id } = _c, data = __rest(_c, ["id"]);
    if (!id) {
        throw new https_1.HttpsError('invalid-argument', 'Lead ID is required.');
    }
    await db.collection(COLLECTION).doc(id).update(data);
    return { ok: true };
});
exports.exportCsv = (0, https_1.onCall)(async (req) => {
    var _a, _b;
    if (!((_b = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.token.roles) === null || _b === void 0 ? void 0 : _b.includes('admin'))) {
        throw new https_1.HttpsError('permission-denied', 'You must be an admin to export leads.');
    }
    const snapshot = await db.collection(COLLECTION).orderBy('created_at', 'desc').get();
    const leads = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    if (leads.length === 0) {
        return '';
    }
    const json2csvParser = new json2csv_1.Parser();
    const csv = json2csvParser.parse(leads);
    return csv;
});
//# sourceMappingURL=api.js.map