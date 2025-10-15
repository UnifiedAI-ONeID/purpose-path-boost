# OG Image Generation System

## Overview
Automated Open Graph (OG) image generation using Satori and resvg to create platform-optimized cover images for social media posts.

## Architecture

### Technology Stack
- **Satori**: React-like JSX to SVG renderer
- **resvg**: High-quality SVG to PNG converter
- **Supabase Storage**: Image hosting with public CDN
- **Edge Functions**: Serverless rendering

### Platform Sizes
```typescript
linkedin:    1200 x 627   // LinkedIn link share
facebook:    1200 x 630   // Facebook link share  
x:           1200 x 675   // X (Twitter) card
ig_square:   1080 x 1080  // Instagram square post
ig_portrait: 1080 x 1350  // Instagram portrait feed
story:       1080 x 1920  // IG Stories / Reels / YT Shorts
```

## Components

### 1. Edge Functions

#### `og-render` (Single Image)
- Generates one image for specified platform
- Input: title, subtitle, slug, theme, lang, size
- Output: PNG uploaded to storage + public URL

#### `og-render-all` (Batch)
- Generates all 6 platform images at once
- Parallel processing for speed
- Returns array of results with URLs

### 2. UI Components

#### `CoverComposer`
- Admin UI for generating images
- Theme selector (light/dark)
- Language selector (EN, 简体, 繁體)
- Live preview of all generated images
- Download and preview buttons

### 3. Storage Structure

```
social-images/
├── {slug}/
│   ├── linkedin.png
│   ├── facebook.png
│   ├── x.png
│   ├── ig_square.png
│   ├── ig_portrait.png
│   └── story.png
```

## Design System

### Color Gradients

The OG image system uses a **tag-based accent system** that automatically picks gradient colors based on the blog post's primary tag.

**Tag Palette:**
- **mindset**: Jade → Teal (#0B3D3C → #15706A) - default
- **confidence**: Deep Blue (#004E92 → #000428)
- **clarity**: Indigo → Aqua (#2E3192 → #1BFFFF)
- **consistency**: Charcoal → Steel (#0F2027 → #203A43)
- **leadership**: Purple gradient (#8E2DE2 → #4A00E0)
- **career**: Emeralds (#11998E → #38EF7D)
- **relationships**: Coral → Magenta (#FF512F → #DD2476)
- **wellness**: Amber (#F7971E → #FFD200)
- **money**: Growth Green (#56ab2f → #a8e063)
- **productivity**: Corporate Dusk (#1D2B64 → #F8CDDA)

Chinese tag aliases (自信, 清晰, 一致性, 職涯, 關係) map to their English equivalents.

**Fallback Themes:**

When no tag is specified or tag not found in palette:

**Light Theme (Default):**
```css
background: linear-gradient(135deg, #0b3d3c 0%, #15706a 100%);
card: rgba(255,255,255,0.16);
text: #ffffff;
```

**Dark Theme:**
```css
background: linear-gradient(135deg, #0b0c0d 0%, #161a1d 100%);
card: rgba(255,255,255,0.06);
text: #ffffff;
```

### Typography
- **Title**: 8% of width, line-height 1.05, weight 800
- **Subtitle**: 3.2% of width, opacity 0.95
- **Brand**: 2.8% of width, weight 700
- **Font Stack**: System fonts with CJK fallbacks

### Layout
- **Padding**: 8% of width
- **Gap**: 2% of width
- **Border Radius**: 2% of width
- **Brand Card**: Auto-positioned at bottom

## Usage Workflow

### 1. Generate Images (Admin)
```typescript
// In BlogComposer dialog or AdminDashboard
<CoverComposer 
  post={{
    title: "Your Blog Title",
    slug: "your-blog-slug",
    excerpt: "Optional subtitle",
    tags: ["mindset", "confidence"] // Tag determines gradient color
  }}
/>
```

**Steps:**
1. Select **tag** (determines gradient color from palette)
2. Select **theme** (light/dark)
3. Select **language** (EN/简体/繁體)
4. Click "Generate All"
5. Wait for 6 images to render
6. Preview and download

### 2. Auto-Use in Social Posts
```typescript
// BlogComposer automatically uses generated images
const baseUrl = `${supabaseUrl}/storage/v1/object/public/social-images/${slug}`;

const imagePaths = {
  linkedin: `${baseUrl}/linkedin.png`,
  facebook: `${baseUrl}/facebook.png`,
  x: `${baseUrl}/x.png`,
  instagram: `${baseUrl}/ig_portrait.png`,
  // Chinese platforms use square
  wechat: `${baseUrl}/ig_square.png`,
};
```

### 3. OG Meta Tags
```typescript
import { generateOGMetaTags } from '@/lib/og-meta-tags';

const tags = generateOGMetaTags({
  title: post.title,
  description: post.excerpt,
  slug: post.slug,
  author: 'Grace Huang',
  publishedAt: post.published_at,
});

// Renders to:
<meta property="og:title" content="..." />
<meta property="og:image" content="https://.../social-images/slug/facebook.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://.../social-images/slug/x.png" />
```

## API Reference

### Edge Function: `og-render`

**Endpoint:** `/functions/v1/og-render`

**Request:**
```json
{
  "title": "Your Blog Title",
  "subtitle": "Optional subtitle text",
  "slug": "blog-post-slug",
  "theme": "light",
  "lang": "en",
  "size": "linkedin",
  "tag": "confidence"
}
```

**Response:**
```json
{
  "ok": true,
  "url": "https://...supabase.co/storage/v1/object/public/social-images/slug/linkedin.png",
  "path": "slug/linkedin.png",
  "w": 1200,
  "h": 627
}
```

### Edge Function: `og-render-all`

**Endpoint:** `/functions/v1/og-render-all`

**Request:**
```json
{
  "title": "Your Blog Title",
  "subtitle": "Optional subtitle",
  "slug": "blog-post-slug",
  "theme": "light",
  "lang": "en",
  "tag": "mindset"
}
```

**Response:**
```json
{
  "ok": true,
  "images": [
    {
      "key": "linkedin",
      "ok": true,
      "url": "https://...linkedin.png",
      "path": "slug/linkedin.png",
      "w": 1200,
      "h": 627
    },
    // ... 5 more entries
  ]
}
```

## Customization

### Adding New Tag Colors

Edit `src/lib/og/palette.ts`:

```typescript
export const TAG_PALETTE: Record<string, Accent> = {
  // ... existing tags
  newtag: { start: '#HEX1', end: '#HEX2' },
};
```

Then add to the UI selector in `src/components/CoverComposer.tsx`:

```typescript
const TAGS = [...existingTags, 'newtag'];
```

### Modify Design
Edit `supabase/functions/og-render/index.ts`:

```typescript
// Change colors
function bgGradient(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%)'
    : 'linear-gradient(135deg, #your-color-3 0%, #your-color-4 100%)';
}

// Change layout
const svg = await satori({
  type: 'div',
  props: {
    style: {
      // Your custom styles
      display: 'flex',
      flexDirection: 'column',
      // ...
    },
    children: [
      // Your custom elements
    ]
  }
}, { width: w, height: h });
```

### Add Custom Fonts
```typescript
// Load font file
const fontData = await Deno.readFile('./fonts/YourFont.ttf');

// Pass to Satori
const svg = await satori(element, {
  width: w,
  height: h,
  fonts: [{
    name: 'YourFont',
    data: fontData,
    weight: 400,
    style: 'normal',
  }]
});
```

### Add Logo/Images
```typescript
// In JSX structure
{
  type: 'img',
  props: {
    src: 'data:image/png;base64,...', // or URL
    style: {
      width: 100,
      height: 100,
      borderRadius: 50,
    }
  }
}
```

## Performance

### Generation Time
- Single image: ~500-800ms
- All 6 images: ~3-5 seconds (parallel)

### Optimization Tips
1. **Reuse Generated Images**: Only regenerate when content changes
2. **CDN Caching**: Supabase Storage serves via CDN
3. **Lazy Generate**: Only generate when sharing dialog opens
4. **Background Task**: Generate after blog publish (not blocking)

## Troubleshooting

### Images Not Displaying
- Check storage bucket is public: `public: true`
- Verify RLS policies allow public read
- Check browser console for CORS errors

### Font Rendering Issues
- CJK characters may not render perfectly
- Use system font stack for better compatibility
- Consider embedding Noto Sans CJK if needed

### Memory Issues
- Large images may cause memory errors
- Use resvg with `fitTo` option for size limits
- Process images sequentially if parallel fails

## Integration Checklist

- [x] Storage bucket `social-images` created
- [x] RLS policies for public access
- [x] Edge functions `og-render` and `og-render-all` deployed
- [x] CoverComposer UI component
- [x] Auto-use in BlogComposer
- [x] OG meta tags helper
- [x] Supabase config updated

## Future Enhancements

1. **Video Covers**: Generate animated covers for Stories
2. **A/B Testing**: Test different designs and track performance
3. **Template Library**: Multiple design templates to choose from
4. **Brand Kit**: Upload logo, colors, fonts
5. **Scheduled Generation**: Auto-regenerate on schedule
6. **Analytics**: Track which designs perform best

## Best Practices

1. **Generate Early**: Create images when publishing blog post
2. **Test Sharing**: Use Facebook Debugger, Twitter Card Validator
3. **Version Control**: Keep old versions when regenerating
4. **Consistent Branding**: Use same theme/colors across platforms
5. **Localization**: Generate separate images for EN/CN audiences
6. **File Names**: Use slug for consistency and easy reference
