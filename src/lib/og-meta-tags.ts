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
}) {
  const {
    title,
    description,
    slug,
    imageUrl,
    author = 'Grace Huang',
    publishedAt,
    url = `https://zhengrowth.com/blog/${slug}`,
  } = params;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const defaultImage = `${supabaseUrl}/storage/v1/object/public/social-images/${slug}/facebook.png`;
  const twitterImage = `${supabaseUrl}/storage/v1/object/public/social-images/${slug}/x.png`;

  return {
    // Basic OG tags
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:type': 'article',
    'og:image': imageUrl || defaultImage,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:site_name': 'ZhenGrowth',

    // Article specific
    ...(publishedAt && { 'article:published_time': publishedAt }),
    ...(author && { 'article:author': author }),

    // Twitter Card
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': imageUrl || twitterImage,
    'twitter:site': '@zhengrowth',
    'twitter:creator': '@gracehuangco',
  };
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
