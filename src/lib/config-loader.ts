
import { GENKIT_API_KEY, GENKIT_API_URL } from "./genkit-ai";

export const loadConfig = () => {
  if (!GENKIT_API_KEY) {
    throw new Error("Missing GENKIT_API_KEY");
  }

  return {
    genkit: {
      apiKey: GENKIT_API_KEY,
      apiUrl: GENKIT_API_URL,
    },
  };
};

try {
  const config = loadConfig();
  console.log("Configuration loaded successfully:", config);
} catch (error) {
  console.error("Failed to load configuration:", error);
}
