
import * as functions from "firebase-functions";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const secretManager = new SecretManagerServiceClient();
const PROJECT_ID = process.env.GCLOUD_PROJECT;

// Define the list of public keys that are safe to expose to the client.
const PUBLIC_KEYS = ['VITE_UMAMI_ID', 'POSTHOG_KEY'];

async function accessSecret(secretName: string): Promise<string | null> {
  try {
    const [version] = await secretManager.accessSecretVersion({
      name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`,
    });
    const payload = version.payload?.data?.toString();
    return payload || null;
  } catch (error) {
    console.warn(`Could not access secret: ${secretName}`, error);
    return null;
  }
}

export const getPublicConfig = functions.https.onCall(async (data, context) => {
  // Optional: Add authentication/authorization checks if needed.
  // e.g., if (!context.auth) {
  //   throw new functions.https.HttpsError("unauthenticated", "You must be logged in.");
  // }

  const config: { [key: string]: string | null } = {};

  for (const key of PUBLIC_KEYS) {
    const value = await accessSecret(key);
    if (value) {
      config[key] = value;
    }
  }

  return { config };
});
