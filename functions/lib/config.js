"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicConfig = void 0;
const functions = require("firebase-functions");
const secret_manager_1 = require("@google-cloud/secret-manager");
const secretManager = new secret_manager_1.SecretManagerServiceClient();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
// Define the list of public keys that are safe to expose to the client.
const PUBLIC_KEYS = ['VITE_UMAMI_ID', 'POSTHOG_KEY'];
async function accessSecret(secretName) {
    var _a, _b;
    try {
        const [version] = await secretManager.accessSecretVersion({
            name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
        });
        const payload = (_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
        return payload || null;
    }
    catch (error) {
        console.warn(`Could not access secret: ${secretName}`, error);
        return null;
    }
}
exports.getPublicConfig = functions.https.onCall(async (data, context) => {
    // Optional: Add authentication/authorization checks if needed.
    // e.g., if (!context.auth) {
    //   throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
    // }
    const config = {};
    for (const key of PUBLIC_KEYS) {
        const value = await accessSecret(key);
        if (value) {
            config[key] = value;
        }
    }
    return { config };
});
//# sourceMappingURL=config.js.map