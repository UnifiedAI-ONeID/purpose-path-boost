/**
 * Schema validation utilities for Edge Functions
 * Validates JSON responses from AI and other external sources
 */

/**
 * Validate AI-generated social media suggestions
 */
export function validateSuggestions(json: any): any | null {
  const ok = json && 
    json.headlines && Array.isArray(json.headlines) && 
    json.hooks && Array.isArray(json.hooks);
  return ok ? json : null;
}

/**
 * Validate AI-generated content topics
 */
export function validateTopics(json: any): any | null {
  const ok = json && 
    json.topics && Array.isArray(json.topics) &&
    json.topics.every((t: any) => t.title && t.angle && t.hook);
  return ok ? json : null;
}

/**
 * Validate AI-generated pricing suggestions
 */
export function validatePricing(json: any): any | null {
  const ok = json && 
    json.suggest_cents && typeof json.suggest_cents === 'number' &&
    json.reasoning && typeof json.reasoning === 'string';
  return ok ? json : null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email) && email.length <= 255;
}

/**
 * Sanitize email (trim and lowercase)
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
