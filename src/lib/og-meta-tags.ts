/**
 * @file This file provides utility functions for generating Open Graph (OG) and Twitter Card meta tags.
 * It helps create the necessary metadata for rich social media previews of web pages.
 */

// --- Constants and Configuration ---

const STORAGE_BUCKET = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string;

// Ensure the storage bucket is configured, fail fast if not.
if (!STORAGE_BUCKET) {
  throw new Error("VITE_FIREBASE_STORAGE_BUCKET is not set in the environment variables.");
}

const STORAGE_BASE_URL = `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o`;

// --- Type Definitions ---

/**
 * Defines the parameters required to generate a complete set of OG and Twitter meta tags.
 */
export interface OGMetaTagsParams {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  url?: string;
  type?: 'article' | 'website';
}

/**
 * Represents a single meta tag with its attribute (`name` or `property`) and content.
 */
export interface MetaTag {
  attr: 'name' | 'property';
  key: string;
  content: string;
}

// --- Helper Functions ---

/**
 * Constructs a public URL for a file stored in Firebase Storage.
 * @param {string} path - The path to the file within the bucket.
 * @returns {string} The full, publicly accessible URL for the file.
 */
function getStorageUrl(path: string): string {
  // The path needs to be URI encoded for the URL to be valid.
  return `${STORAGE_BASE_URL}/${encodeURIComponent(path)}?alt=media`;
}

// --- Core Logic ---

/**
 * Generates an array of meta tag objects for social media previews.
 * @param {OGMetaTagsParams} params - The data to be used for generating the tags.
 * @returns {MetaTag[]} An array of meta tag objects.
 */
export function generateOGMetaTags(params: OGMetaTagsParams): MetaTag[] {
  const {
    title,
    description,
    slug,
    imageUrl,
    author = 'Grace Huang',
    publishedAt,
    url = `https://zhengrowth.com/${slug}`,
    type = 'website',
  } = params;

  // Use a generated image from storage as a fallback if no specific imageUrl is provided.
  const defaultImage = imageUrl || getStorageUrl(`social-images/${slug}/facebook.png`);
  const twitterImage = imageUrl || getStorageUrl(`social-images/${slug}/x.png`);

  const tags: Record<string, string> = {
    // Standard Open Graph Tags
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:type': type,
    'og:image': defaultImage,
    'og:image:secure_url': defaultImage,
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': `Preview image for ${title}`,
    'og:site_name': 'ZhenGrowth',
    'og:locale': 'en_US',

    // Twitter Card Tags
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': twitterImage,
    'twitter:image:alt': `Preview image for ${title}`,
    'twitter:site': '@zhengrowth',
    'twitter:creator': '@gracehuangco',
  };

  // Article-specific tags
  if (type === 'article') {
    if (publishedAt) tags['article:published_time'] = publishedAt;
    if (author) tags['article:author'] = author;
  }
  
  // Convert the record into an array of MetaTag objects
  return Object.entries(tags).map(([key, content]) => ({
    attr: key.startsWith('twitter:') ? 'name' : 'property',
    key,
    content,
  }));
}

/**
 * Generates the direct URL for a pre-generated OG image for a given slug and platform.
 * @param {string} slug - The unique identifier for the page (e.g., a blog post slug).
 * @param {'facebook' | 'x' | 'linkedin'} [platform='facebook'] - The social media platform.
 * @returns {string} The full URL to the OG image.
 */
export function getOGImageUrl(slug: string, platform: 'facebook' | 'x' | 'linkedin' = 'facebook'): string {
  return getStorageUrl(`social-images/${slug}/${platform}.png`);
}

/**
 * Converts an array of MetaTag objects into a raw HTML string.
 * This is useful for server-side rendering or inserting into the document head at runtime.
 * @param {MetaTag[]} tags - An array of meta tag objects.
 * @returns {string} A string of HTML `<meta>` tags.
 */
export function metaTagsToHTML(tags: MetaTag[]): string {
  return tags
    .map(tag => `<meta ${tag.attr}="${tag.key}" content="${tag.content}" />`)
    .join('\n');
}
