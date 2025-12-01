import { GENKIT_API_KEY, GENKIT_API_URL } from "./genkit-ai";

interface AppConfig {
  genkit: {
    apiKey: string;
    apiUrl: string;
  };
}

export const loadConfig = (): AppConfig => {
  if (!GENKIT_API_KEY) {
    throw new Error(
      "Missing GENKIT_API_KEY: Please set it in your environment."
    );
  }

  if (!GENKIT_API_URL || !URL.canParse(GENKIT_API_URL)) {
    throw new Error(
      "Invalid or missing GENKIT_API_URL: Please set a valid URL in your environment."
    );
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
  console.log("Configuration loaded successfully.");
} catch (error) {
  console.error("Failed to load configuration:", (error as Error).message);
  // Optionally, prevent app from starting if config is critical
  // process.exit(1);
}
