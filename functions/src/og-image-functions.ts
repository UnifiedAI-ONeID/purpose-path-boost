/**
 * OG Image Generation Functions
 * 
 * Functions for generating Open Graph and social media cover images
 */

import * as functions from 'firebase-functions';
import { db } from './firebase-init';

// Platform sizes configuration
const PLAT_SIZES: Record<string, { w: number; h: number }> = {
  linkedin:    { w: 1200, h: 627 },   // LinkedIn link share
  facebook:    { w: 1200, h: 630 },   // Facebook link share
  x:           { w: 1200, h: 675 },   // X (Twitter) card
  ig_square:   { w: 1080, h: 1080 },  // Instagram square post
  ig_portrait: { w: 1080, h: 1350 },  // Instagram portrait feed
  story:       { w: 1080, h: 1920 },  // Instagram Stories / Reels / YouTube Shorts
};

// Tag to emoji mapping
const EMO_BY_TAG: Record<string, string> = {
  mindset: '🧠',
  confidence: '💪',
  clarity: '🔎',
  consistency: '📆',
  habits: '🔁',
  leadership: '👑',
  career: '💼',
  relationships: '💬',
  wellness: '🌿',
  spirituality: '✨',
  money: '💰',
  productivity: '⏱️',
};

interface OgRenderRequest {
  title: string;
  subtitle?: string;
  slug: string;
  theme?: 'light' | 'dark';
  lang?: 'en' | 'zh-CN' | 'zh-TW';
  tag?: string;
}

interface OgImageResult {
  ok: boolean;
  key: string;
  url: string;
  width: number;
  height: number;
}

/**
 * OG Render All - Generate cover images for all social platforms
 * Used by CoverComposer component
 */
export const ogRenderAll = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = context.auth.uid;
  
  // Verify admin access
  const adminDoc = await db.collection('admins').doc(userId).get();
  if (!adminDoc.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }

  const { title, subtitle, slug, theme = 'light', lang = 'en', tag = 'mindset' } = data as OgRenderRequest || {};

  if (!title || !slug) {
    throw new functions.https.HttpsError('invalid-argument', 'title and slug are required');
  }

  try {
    const images: OgImageResult[] = [];
    const emoji = EMO_BY_TAG[tag] || '✨';

    // Generate URLs for each platform
    for (const [key, size] of Object.entries(PLAT_SIZES)) {
      // Build OG image URL using a service like Vercel OG or similar
      // This creates parameterized URLs that can be rendered on-demand
      const params = new URLSearchParams({
        title: title,
        subtitle: subtitle || '',
        theme: theme,
        lang: lang,
        emoji: emoji,
        w: size.w.toString(),
        h: size.h.toString(),
        slug: slug,
        platform: key
      });

      // Use your OG image generation endpoint
      // This could be a Vercel Edge Function, Cloudflare Worker, or custom endpoint
      const baseUrl = process.env.OG_IMAGE_BASE_URL || 'https://og-image.yoursite.com';
      const url = `${baseUrl}/api/og?${params.toString()}`;

      images.push({
        ok: true,
        key,
        url,
        width: size.w,
        height: size.h
      });
    }

    // Store the generation config for reference
    await db.collection('og_generations').add({
      userId,
      slug,
      title,
      subtitle,
      theme,
      lang,
      tag,
      platforms: Object.keys(PLAT_SIZES),
      created_at: new Date().toISOString()
    });

    // Log the generation
    console.log(`Generated OG images for "${slug}" by user ${userId}`);

    return {
      ok: true,
      images,
      config: {
        title,
        subtitle,
        theme,
        lang,
        tag,
        emoji
      }
    };

  } catch (error) {
    console.error('OG render error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate cover images');
  }
});

/**
 * OG Render Single - Generate a single cover image for a specific platform
 */
export const ogRenderSingle = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { title, subtitle, slug, theme = 'light', lang = 'en', tag = 'mindset', platform = 'linkedin' } = data || {};

  if (!title || !slug) {
    throw new functions.https.HttpsError('invalid-argument', 'title and slug are required');
  }

  const size = PLAT_SIZES[platform] || PLAT_SIZES.linkedin;
  const emoji = EMO_BY_TAG[tag] || '✨';

  try {
    const params = new URLSearchParams({
      title,
      subtitle: subtitle || '',
      theme,
      lang,
      emoji,
      w: size.w.toString(),
      h: size.h.toString(),
      slug,
      platform
    });

    const baseUrl = process.env.OG_IMAGE_BASE_URL || 'https://og-image.yoursite.com';
    const url = `${baseUrl}/api/og?${params.toString()}`;

    return {
      ok: true,
      key: platform,
      url,
      width: size.w,
      height: size.h
    };

  } catch (error) {
    console.error('OG render single error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate cover image');
  }
});
