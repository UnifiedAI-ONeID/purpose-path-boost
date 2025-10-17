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

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}

/**
 * Validate plan interval
 */
export function isValidInterval(interval: string): boolean {
  return ['month', 'year'].includes(interval);
}

/**
 * Validate numeric range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= min && value <= max;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Generic error response helper
 */
export function sanitizeError(error: any): string {
  // Map database error codes to user-friendly messages
  const errorMap: Record<string, string> = {
    '23505': 'This record already exists',
    '23503': 'Invalid reference',
    '42P01': 'Resource not found',
    '23502': 'Required field missing',
    '22P02': 'Invalid data format',
    '42501': 'Permission denied',
  };
  
  const code = error?.code || error?.status;
  if (code && errorMap[code]) {
    return errorMap[code];
  }
  
  // Return generic message, don't leak internal details
  return 'An error occurred while processing your request';
}
