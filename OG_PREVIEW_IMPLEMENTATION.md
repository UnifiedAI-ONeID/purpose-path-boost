# Open Graph Preview Implementation Guide

## Overview

This implementation ensures that when your website or PWA links are shared on social media platforms, messaging apps, or anywhere that supports Open Graph protocol, they display beautiful, branded previews with proper titles, descriptions, and images.

## What Was Implemented

### 1. **Global Default Meta Tags** (`index.html`)
Enhanced base Open Graph and Twitter Card meta tags with:
- Comprehensive Open Graph tags (title, description, image, type, URL)
- Twitter Card tags with proper dimensions
- Site name and locale information
- Image dimensions for optimal rendering
- Social media handles (@zhengrowth, @gracehuangco)

### 2. **Per-Page SEO Meta Tags**

All key pages now have custom `SEOHelmet` components with:

#### Main Routes:
- **Home** (`/home`) - Main landing page with hero message
- **Coaching Programs** (`/coaching`) - Multi-language support
- **Events & Workshops** (`/events`) - Event listing page

#### PWA Routes:
- **PWA Home** (`/pwa/home`) - Mobile-first experience
- **PWA Quiz** (`/pwa/quiz`) - Self-assessment tool
- **PWA Coaching** (`/pwa/coaching`) - Personalized recommendations

### 3. **Multi-Language Support**

Each page supports three languages with proper meta tags:
- English (`en`)
- Simplified Chinese (`zh-CN`)
- Traditional Chinese (`zh-TW`)

### 4. **SEO Components Used**

- **`SEOHelmet`** (`src/components/SEOHelmet.tsx`)
  - Handles per-page title, description, and image
  - Supports canonical URLs
  - Manages hreflang tags for international SEO
  - Sets Open Graph and Twitter Card metadata

- **`GlobalHead`** (`src/components/GlobalHead.tsx`)
  - Site-wide meta tags and PWA configuration
  - Structured data (JSON-LD)
  - Robots directives

## How Link Previews Work

### Social Media Platforms

1. **Facebook/LinkedIn**
   - Uses Open Graph (`og:`) meta tags
   - Image size: 1200x630px (recommended)
   - Shows title, description, and image

2. **Twitter/X**
   - Uses Twitter Card (`twitter:`) meta tags
   - Falls back to Open Graph tags
   - Summary with large image format

3. **WhatsApp/Telegram/iMessage**
   - Reads Open Graph meta tags
   - Shows compact preview with title and image

4. **Slack/Discord**
   - Uses Open Graph protocol
   - Shows rich embed with image, title, description

## Testing Link Previews

### 1. **Facebook Sharing Debugger**
```
https://developers.facebook.com/tools/debug/
```
- Enter your URL
- Click "Scrape Again" to refresh cache
- Check if title, description, and image appear correctly

### 2. **Twitter Card Validator**
```
https://cards-dev.twitter.com/validator
```
- Enter your URL
- Preview how the card will look
- Verify image loads properly

### 3. **LinkedIn Post Inspector**
```
https://www.linkedin.com/post-inspector/
```
- Enter your URL
- Check preview appearance
- Clear cache if needed

### 4. **OpenGraph.xyz**
```
https://www.opengraph.xyz/
```
- Universal OG tag checker
- Shows preview for multiple platforms
- Identifies missing or incorrect tags

### 5. **Local Testing**

View page source and check for meta tags:
```html
<!-- Should see tags like: -->
<meta property="og:title" content="Your Page Title" />
<meta property="og:description" content="Your description" />
<meta property="og:image" content="https://zhengrowth.com/app-icon.png" />
<meta property="og:url" content="https://zhengrowth.com/your-page" />
```

## Current Image Configuration

### Default Image
- **Location**: `https://zhengrowth.com/app-icon.png`
- **Size**: 512x512px
- **Format**: PNG
- **Usage**: Fallback for all pages

### Recommendations for Better Previews

1. **Create Platform-Specific Images**
   - Facebook/LinkedIn: 1200x630px
   - Twitter: 1200x675px
   - Instagram: 1080x1080px

2. **Use the OG Image Generation System**
   - Generate custom images for blog posts
   - Use `og-render` edge function
   - See `OG_IMAGE_SYSTEM.md` for details

3. **Image Best Practices**
   - Use descriptive images with text overlay
   - Keep important content in center (safe zone)
   - Use high contrast colors
   - Include your brand/logo
   - Optimize file size (< 1MB)

## Page-Specific Configuration

### Example: Home Page
```tsx
<SEOHelmet
  title="ZhenGrowth - Grow with Clarity, Confidence, and Purpose"
  description="Transform your career and life with personalized coaching..."
  path="/home"
  lang={lang as 'en'|'zh-CN'|'zh-TW'}
  image="https://zhengrowth.com/app-icon.png"
/>
```

### Example: Multi-Language Support
```tsx
<SEOHelmet
  title={
    lang === 'zh-CN' ? '辅导项目 | ZhenGrowth' : 
    lang === 'zh-TW' ? '輔導項目 | ZhenGrowth' : 
    'Coaching Programs | ZhenGrowth'
  }
  description={
    lang === 'zh-CN' ? '选择适合你的路径 — 立即预约专业的生涯与生活辅导' : 
    lang === 'zh-TW' ? '選擇適合你的路徑 — 立即預約專業的生涯與生活輔導' : 
    'Choose the path that fits — book instantly with professional coaching'
  }
  path="/coaching"
  lang={lang as 'en'|'zh-CN'|'zh-TW'}
/>
```

## Adding OG Tags to New Pages

1. **Import SEOHelmet**
```tsx
import { SEOHelmet } from '@/components/SEOHelmet';
```

2. **Add to Component**
```tsx
export default function YourPage() {
  return (
    <>
      <SEOHelmet
        title="Your Page Title"
        description="Your page description"
        path="/your-page"
        image="https://zhengrowth.com/your-image.png"
      />
      {/* Your page content */}
    </>
  );
}
```

3. **Optional Parameters**
- `lang` - Language code for hreflang tags
- `noIndex` - Prevent search engine indexing
- `canonical` - Custom canonical URL
- `alternates` - Alternate language URLs

## Cache Management

### Social Platform Caches

When you update meta tags, platforms cache old data:

1. **Facebook** - Cache: ~7 days
   - Clear: Use Sharing Debugger "Scrape Again"

2. **Twitter** - Cache: ~7 days
   - Clear: Use Card Validator

3. **LinkedIn** - Cache: ~7 days
   - Clear: Use Post Inspector

4. **WhatsApp** - Cache: Permanent
   - No official clear method
   - Contact support if critical

### Tip: Use Query Parameters

Force fresh crawl by adding timestamp:
```
https://zhengrowth.com/page?v=20250116
```

## Troubleshooting

### Image Not Showing

1. **Check Image URL**
   - Must be absolute URL (https://...)
   - Image must be publicly accessible
   - No redirects in image URL

2. **Check Image Size**
   - Minimum: 200x200px
   - Maximum: 8MB (Facebook limit)
   - Recommended: 1200x630px

3. **Check Image Format**
   - Supported: JPG, PNG, GIF
   - Avoid: WebP (limited support)

### Description Truncated

- Facebook: ~300 characters
- Twitter: ~200 characters
- Keep important info in first 150 characters

### Title Too Long

- Ideal: 60-90 characters
- Maximum before truncation: ~70 characters

## Performance Considerations

### Image Optimization

- Compress images to reduce load time
- Use CDN for faster delivery
- Implement lazy loading for images
- Consider WebP with JPG fallback

### Meta Tag Priority

1. Page-specific meta tags (highest priority)
2. Layout/wrapper meta tags
3. Global default tags (fallback)

## Related Documentation

- `SEO_IMPLEMENTATION_SUMMARY.md` - Complete SEO setup
- `OG_IMAGE_SYSTEM.md` - Dynamic OG image generation
- `ROBOTS_SEO_GUIDE.md` - Search engine indexing

## Next Steps

### Immediate
- [x] Add SEOHelmet to all main pages
- [x] Add SEOHelmet to all PWA routes
- [x] Update index.html with comprehensive defaults
- [ ] Test all pages with social media validators

### Short-term
- [ ] Generate custom OG images for blog posts
- [ ] Create page-specific preview images
- [ ] Add OG images to event pages
- [ ] Set up automated OG image generation

### Long-term
- [ ] Implement dynamic OG images for all content
- [ ] Monitor social media click-through rates
- [ ] A/B test different preview images
- [ ] Create branded template library

## Support

For questions or issues:
- Review `src/components/SEOHelmet.tsx` implementation
- Check `src/lib/og-meta-tags.ts` utility functions
- Refer to Open Graph protocol: https://ogp.me/
- Twitter Card docs: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup
