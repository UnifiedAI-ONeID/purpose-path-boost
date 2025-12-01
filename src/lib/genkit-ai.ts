/**
 * @file This file is responsible for initializing and configuring the Genkit AI client.
 * It reads the configuration from environment variables, provides default values,
 * and exports a ready-to-use singleton instance of the Genkit client.
 */

import { Genkit } from 'genkit-ai';

// --- Configuration Loading ---

// It is a standard practice to load environment variables and provide fallbacks in a central place.
// This uses `import.meta.env` which is standard in Vite-powered projects.
// If you are using another framework (e.g., Create React App, Next.js), you might need to adjust the prefix
// or the way you access environment variables (e.g., `process.env.REACT_APP_GENKIT_API_KEY`).

/**
 * The API Key for the Genkit AI service.
 * This is a critical piece of configuration and must be set in the environment.
 * @type {string}
 */
export const GENKIT_API_KEY: string = (import.meta.env.VITE_GENKIT_API_KEY as string) || '';

/**
 * The base URL for the Genkit AI service API.
 * This defaults to a production URL but can be overridden for different environments (e.g., staging, development).
 * @type {string}
 */
export const GENKIT_API_URL: string = (import.meta.env.VITE_GENKIT_API_URL as string) || 'https://api.genkit.ai';


// --- Client Initialization ---

/**
 * Factory function to create and configure a Genkit client instance.
 * It ensures that the required API key is present before attempting to create an instance.
 *
 * @returns {Genkit} A configured instance of the Genkit client.
 * @throws {Error} If the `GENKIT_API_KEY` is not found in the environment variables.
 */
function createGenkitClient(): Genkit {
  // Fail-fast if the API key is not configured. This prevents runtime errors in other parts of the app.
  if (!GENKIT_API_KEY) {
    throw new Error(
      'Missing Genkit API Key. Please ensure `VITE_GENKIT_API_KEY` is set in your environment.'
    );
  }

  // Assuming the `Genkit` constructor accepts a configuration object.
  // This is a common pattern for SDK clients.
  return new Genkit({
    apiKey: GENKIT_API_KEY,
    apiUrl: GENKIT_API_URL,
  });
}

/**
 * A singleton instance of the configured Genkit client.
 * This is the main export that other parts of the application should use to interact with the Genkit AI service.
 */
export const genkit: Genkit = createGenkitClient();
