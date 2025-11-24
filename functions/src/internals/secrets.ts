
import * as functions from "firebase-functions";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretManager = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GCLOUD_PROJECT;

async function accessSecretVersion(secretName: string) {
  const [version] = await secretManager.accessSecretVersion({
    name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
  });
  const payload = version.payload?.data?.toString();
  return payload;
}

async function setSecretValue(secretName: string, value: string) {
  try {
    // Check if the secret exists
    await secretManager.getSecret({
      name: `projects/${PROJECT_ID}/secrets/${secretName}`,
    });
  } catch (error: any) {
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
    } else {
      throw error;
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

export const manageSecrets = functions.https.onCall(async (data, context) => {
  // Your authentication logic here
  // For example, check if the user is an admin
  // if (!context.auth?.token.admin) {
  //   throw new functions.https.HttpsError("permission-denied", "You must be an admin to manage secrets.");
  // }

  const { action, key, value, keys } = data;

  try {
    switch (action) {
      case "list":
        const secretKeys = await listSecrets();
        const existingKeys = (keys as string).split(',').filter(k => secretKeys.includes(k));
        return { data: existingKeys.map(k => ({key: k})) };
      case "set":
        await setSecretValue(key, value);
        return { success: true };
      default:
        throw new functions.https.HttpsError("invalid-argument", "Invalid action");
    }
  } catch (error) {
    console.error("Error managing secrets:", error);
    throw new functions.https.HttpsError("internal", "An internal error occurred");
  }
});
