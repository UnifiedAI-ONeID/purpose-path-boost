/**
 * @file This file provides utility functions for HTML sanitization and content analysis,
 * such as stripping HTML tags and calculating reading time. It uses DOMPurify for robust
 * XSS protection.
 */

import DOMPurify, { Config } from 'dompurify';

// --- Reusable DOMPurify Instance ---

/**
 * A pre-configured, reusable instance of DOMPurify.
 * This is more efficient than calling `DOMPurify.sanitize` directly every time,
 * as the configuration is parsed only once.
 */
const purifier = DOMPurify();

// --- Configuration ---

/**
 * The default configuration for sanitizing HTML content.
 * This config is designed to be secure by default, allowing only a specific set of
 * safe tags and attributes.
 */
const SAFE_HTML_CONFIG: Config = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 's', 'a',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title', 'class', 'style',
    'target', 'rel', 'loading', 'width', 'height',
  ],
  // Be cautious with `ALLOWED_URI_REGEXP`. A permissive regex can be a security risk.
  // This one is a slightly modified version of DOMPurify's default.
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Forbid all data attributes to prevent potential abuse (e.g., with frameworks like Alpine.js)
  FORBID_DATA_ATTR: true,
  // Allow specific target values for links
  ALLOWED_TARGETS: ['_blank', '_self', '_parent', '_top'],
};

// --- Public Functions ---

/**
 * Sanitizes an HTML string to prevent XSS attacks, while allowing a safe subset of tags and attributes.
 *
 * @param {string} dirtyHtml - The potentially unsafe HTML string to sanitize.
 * @param {Config} [config=SAFE_HTML_CONFIG] - An optional DOMPurify configuration object to override the default.
 * @returns {string} The sanitized, safe HTML string.
 */
export function sanitizeHtml(dirtyHtml: string, config: Config = SAFE_HTML_CONFIG): string {
  return purifier.sanitize(dirtyHtml, config);
}

/**
 * Strips all HTML tags from a string, returning only the plain text content.
 *
 * @param {string} html - The HTML string to strip.
 * @returns {string} The extracted plain text.
 */
export function stripHtml(html: string): string {
  // Use the browser's built-in capabilities to parse and extract text.
  // This is generally safer and more robust than using regex.
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sanitizeHtml(html, { ALLOWED_TAGS: [] }); // Sanitize with no tags to be safe
  return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Estimates the reading time for a given HTML content.
 *
 * @param {string} html - The HTML content to analyze.
 * @param {number} [wordsPerMinute=200] - The average reading speed in words per minute.
 * @returns {number} The estimated reading time in minutes, rounded up to the nearest whole number.
 */
export function calculateReadTime(html: string, wordsPerMinute = 200): number {
  const text = stripHtml(html);
  const words = text.trim().split(/\s+/).length;
  
  if (words === 0) return 0;

  const minutes = Math.ceil(words / wordsPerMinute);
  
  // A minimum of 1 minute is often shown for very short texts.
  return Math.max(1, minutes);
}
