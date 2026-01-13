"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.storage = exports.auth = exports.db = void 0;
/**
 * Firebase Admin initialization - use this across all function files
 * to ensure Firebase is only initialized once.
 */
const admin = require("firebase-admin");
exports.admin = admin;
// Initialize Firebase Admin only once
if (!admin.apps.length) {
    admin.initializeApp();
}
// Export the shared instances
exports.db = admin.firestore();
exports.auth = admin.auth();
exports.storage = admin.storage();
//# sourceMappingURL=firebase-init.js.map