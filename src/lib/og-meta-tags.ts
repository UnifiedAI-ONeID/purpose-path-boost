/**
 * Generates Open Graph and Twitter Card meta tags for a blog post
 */
export function generateOGMetaTags(params: {
  title: string;
  description: string;
  slug: string;
  imageUrl?: string;
  author?: string;
  publishedAt?: string;
  url?: string;
  type?: 'article' | 'website';
}) {
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

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  // Try generated images first, fallback to high-res app icon
  const defaultImage = imageUrl || `${supabaseUrl}/storage/v1/object/public/social-images/${slug}/facebook.png`;
  const twitterImage = imageUrl || `${supabaseUrl}/storage/v1/object/public/social-images/${slug}/x.png`;
  const fallbackImage = 'https://zhengrowth.com/app-icon-512.png';

  return {
    // Basic OG tags
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:type': type,
    'og:image': defaultImage,
    'og:image:secure_url': defaultImage,
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': title,
    'og:site_name': 'ZhenGrowth',
    'og:locale': 'en_US',

    // Article specific
    ...(type === 'article' && publishedAt && { 'article:published_time': publishedAt }),
    ...(type === 'article' && author && { 'article:author': author }),

    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': twitterImage,
    'twitter:image:alt': title,
    'twitter:site': '@zhengrowth',
    'twitter:creator': '@gracehuangco',
  };
}

/**
 * Helper to get OG image URL for a page
 */
export function getOGImageUrl(slug: string, platform: 'facebook' | 'x' | 'linkedin' = 'facebook'): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/social-images/${slug}/${platform}.png`;
}

/**
 * Converts meta tags object to HTML meta tag strings
 */
export function metaTagsToHTML(tags: Record<string, string>): string {
  return Object.entries(tags)
    .map(([property, content]) => {
      const attr = property.startsWith('twitter:') ? 'name' : 'property';
      return `<meta ${attr}="${property}" content="${content}" />`;
    })
    .join('\n');
}
