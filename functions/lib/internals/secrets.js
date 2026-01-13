"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manageSecrets = void 0;
exports.accessSecretVersion = accessSecretVersion;
const functions = require("firebase-functions");
const secret_manager_1 = require("@google-cloud/secret-manager");
const secretManager = new secret_manager_1.SecretManagerServiceClient();
const PROJECT_ID = process.env.GCLOUD_PROJECT;
// Access a secret value from Google Secret Manager
async function accessSecretVersion(secretName) {
    var _a, _b;
    const [version] = await secretManager.accessSecretVersion({
        name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    const payload = (_b = (_a = version.payload) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.toString();
    return payload;
}
async function setSecretValue(secretName, value) {
    try {
        // Check if the secret exists
        await secretManager.getSecret({
            name: `projects/${PROJECT_ID}/secrets/${secretName}`,
        });
    }
    catch (err) {
        const error = err;
        if (error.code === 5) {
            // Secret does not exist, so create it
            await secretManager.createSecret({
                parent: `projects/${PROJECT_ID}`,
                secretId: secretName,
                secret: {
                    replication: {
                        automatic: {},
                    },
                },
            });
        }
        else {
            throw err;
        }
    }
    // Add a new version to the secret
    await secretManager.addSecretVersion({
        parent: `projects/${PROJECT_ID}/secrets/${secretName}`,
        payload: {
            data: Buffer.from(value, "utf8"),
        },
    });
}
async function listSecrets() {
    const [secrets] = await secretManager.listSecrets({
        parent: `projects/${PROJECT_ID}`,
    });
    return secrets.map(secret => secret.name.split("/").pop());
}
exports.manageSecrets = functions.https.onCall(async (data, context) => {
    // Your authentication logic here
    // For example, check if the user is an admin
    // if (!context.auth?.token.admin) {
    //   throw new functions.https.HttpsError("permission-denied", "You must be an admin to manage secrets.");
    // }
    const { action, key, value, keys } = data;
    try {
        switch (action) {
            case "list": {
                const secretKeys = await listSecrets();
                const existingKeys = (keys || '').split(',').filter(k => k && secretKeys.includes(k));
                return { data: existingKeys.map(k => ({ key: k })) };
            }
            case "set": {
                if (!key || value === undefined) {
                    throw new functions.https.HttpsError("invalid-argument", "Key and value are required for set action.");
                }
                await setSecretValue(key, value);
                return { success: true };
            }
            default:
                throw new functions.https.HttpsError("invalid-argument", "Invalid action");
        }
    }
    catch (error) {
        console.error("Error managing secrets:", error);
        throw new functions.https.HttpsError("internal", "An internal error occurred");
    }
});
//# sourceMappingURL=secrets.js.map