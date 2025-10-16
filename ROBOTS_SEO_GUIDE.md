# Robots & SEO Indexing Guide

## Overview

Complete SEO indexing control system with:
- Dynamic robots.txt based on environment and domain
- Per-page robots meta tags
- Global environment controls for staging/preview
- CN domain detection
- Path-based indexing rules

---

## Dynamic robots.txt

### API Endpoint

**File:** `api/robots.ts`

**URL:** `/robots.txt` (via Vercel rewrite)

### Features

1. **Environment Detection**
   - Production: Allow indexing
   - Preview/Staging: Disallow all (`SEO_INDEX=false` or `VERCEL_ENV=preview`)

2. **Domain-Aware Sitemaps**
   - CN domains: Use CN host for sitemap URLs
   - Global: Use zhengrowth.com

3. **Protected Routes**
   - `/admin` - Admin dashboard
   - `/api` - API endpoints
   - `/_vercel` - Vercel internals
   - `/*?preview=` - Preview mode
   - `/*?draft=` - Draft mode

### Example Output (Production)

```
User-agent: *
Disallow: /admin
Disallow: /api
Disallow: /_vercel
Disallow: /*?preview=
Disallow: /*?draft=
Disallow: /*&preview=
Disallow: /*&draft=

Sitemap: https://zhengrowth.com/sitemap.xml
Sitemap: https://zhengrowth.com/sitemap-blogs.xml
Sitemap: https://zhengrowth.com/sitemap-events.xml

Crawl-delay: 1
```

### Example Output (Staging/Preview)

```
User-agent: *
Disallow: /

# Indexing disabled for preview/staging
User-agent: *
Disallow: /admin
Disallow: /api
Disallow: /_vercel
Disallow: /*?preview=
Disallow: /*?draft=
Disallow: /*&preview=
Disallow: /*&draft=

Sitemap: https://zhengrowth.com/sitemap.xml
Sitemap: https://zhengrowth.com/sitemap-blogs.xml
Sitemap: https://zhengrowth.com/sitemap-events.xml

Crawl-delay: 1
```

---

## Environment Variables

### Required Variables

```bash
# Control global indexing (default: true)
VITE_SEO_INDEX=true

# CN domains for domain detection
CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com

# Vercel environment (auto-set by Vercel)
VERCEL_ENV=production  # or preview
```

### Usage

**Production:**
```bash
VITE_SEO_INDEX=true
VERCEL_ENV=production
```

**Staging/Preview:**
```bash
VITE_SEO_INDEX=false
# or
VERCEL_ENV=preview
```

**Development:**
```bash
# Local development - no indexing by default
VITE_SEO_INDEX=false
```

---

## Robots Meta Component

### Basic Usage

**File:** `src/components/Robots.tsx`

```tsx
import Robots from '@/components/Robots';

// Default: index,follow
<Robots />

// Explicit control
<Robots content="noindex,follow" />

// With X-Robots-Tag header hint
<Robots content="index,follow" addHttpHint={true} />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `'index,follow' \| 'noindex,follow' \| 'noindex,nofollow' \| 'index,nofollow'` | `'index,follow'` | Robots directive |
| `addHttpHint` | `boolean` | `false` | Add X-Robots-Tag meta |

### Environment Override

The component automatically overrides to `noindex,nofollow` if:
- `VITE_SEO_INDEX=false`
- Preview environment detected (`.lovableproject.com` or `.vercel.app`)

---

## Global Head Components

### GlobalHead

Use once per app (in main layout).

**File:** `src/components/GlobalHead.tsx`

```tsx
import { GlobalHead } from '@/components/GlobalHead';

function App() {
  return (
    <>
      <GlobalHead />
      {/* rest of app */}
    </>
  );
}
```

**Includes:**
- Organization JSON-LD
- Website JSON-LD
- Default robots meta
- Favicon links
- Manifest
- Theme color
- Viewport
- Security headers

### PageHead

Use per page/route for specific SEO.

```tsx
import { PageHead } from '@/components/GlobalHead';

function AboutPage() {
  return (
    <>
      <PageHead
        title="About ZhenGrowth - Life Coaching"
        description="Learn about our coaching philosophy and approach"
        path="/about"
        lang="en"
        image="https://zhengrowth.com/og/about.png"
        robots="index,follow"
      />
      {/* page content */}
    </>
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Page title |
| `description` | `string` | **required** | Meta description |
| `path` | `string` | `'/'` | Page path for canonical |
| `lang` | `'en' \| 'zh-CN' \| 'zh-TW'` | `'en'` | Content language |
| `image` | `string` | auto | OG image URL |
| `robots` | robots directive | `'index,follow'` | Indexing control |
| `noIndex` | `boolean` | `false` | Force noindex |

---

## SEO Utilities

### File: `src/lib/seo/indexing.ts`

#### `shouldIndex()`

Check if current environment should be indexed.

```tsx
import { shouldIndex } from '@/lib/seo/indexing';

if (shouldIndex()) {
  console.log('This site is indexable');
}
```

Returns `false` if:
- `VITE_SEO_INDEX !== 'true'`
- Hostname contains `.lovableproject.com` or `.vercel.app`

#### `shouldIndexPath(path: string)`

Check if specific path should be indexed.

```tsx
import { shouldIndexPath } from '@/lib/seo/indexing';

shouldIndexPath('/about');        // true
shouldIndexPath('/admin/users');  // false
shouldIndexPath('/api/data');     // false
```

Returns `false` for:
- `/admin/*`
- `/api/*`
- `/auth/*`
- `/_vercel/*`
- URLs with `?preview` or `?draft`

#### `getRobotsContent(customContent?: string)`

Get robots meta content for environment.

```tsx
import { getRobotsContent } from '@/lib/seo/indexing';

getRobotsContent();                    // 'index,follow' (prod)
getRobotsContent('noindex,follow');    // 'noindex,follow' (prod)
getRobotsContent();                    // 'noindex,nofollow' (preview)
```

#### `isCNDomain()`

Check if current hostname is a CN domain.

```tsx
import { isCNDomain } from '@/lib/seo/indexing';

if (isCNDomain()) {
  // Load CN-specific resources
}
```

#### `getBaseURL()`

Get base URL for current environment.

```tsx
import { getBaseURL } from '@/lib/seo/indexing';

const base = getBaseURL();  // 'https://zhengrowth.com' or 'https://zhengrowth.cn'
```

---

## useSEO Hook

### Dynamic Route-Based Indexing

**File:** `src/hooks/useSEO.ts`

Automatically updates robots meta tags when route changes.

```tsx
import { useSEO } from '@/hooks/useSEO';

function MyComponent() {
  const { shouldIndex, shouldIndexPath } = useSEO();
  
  return (
    <div>
      {shouldIndex && shouldIndexPath && (
        <div>This page is indexable</div>
      )}
    </div>
  );
}
```

**Returns:**
- `shouldIndex`: Global indexing flag
- `shouldIndexPath`: Current path indexability

---

## Deployment Workflow

### Production Deployment

1. **Set environment variables:**
   ```bash
   VITE_SEO_INDEX=true
   CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com
   ```

2. **Deploy:**
   ```bash
   npm run build
   vercel --prod
   ```

3. **Verify:**
   - Check `/robots.txt` - should allow indexing
   - Check page source - robots meta should be `index,follow`
   - Submit sitemaps to Google Search Console

### Preview Deployment

1. **Vercel automatically sets:**
   ```bash
   VERCEL_ENV=preview
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Result:**
   - `/robots.txt` - Disallow: /
   - All pages - `noindex,nofollow`

### Staging Environment

1. **Set environment variables:**
   ```bash
   VITE_SEO_INDEX=false
   ```

2. **Deploy normally**

3. **Result:** Same as preview (no indexing)

---

## Testing

### Test robots.txt

```bash
# Production
curl https://zhengrowth.com/robots.txt

# Preview
curl https://preview-abc123.vercel.app/robots.txt
```

### Test Meta Tags

```tsx
// In browser console
document.querySelector('meta[name="robots"]').content
// Expected: 'index,follow' (prod) or 'noindex,nofollow' (preview)
```

### Test Path Indexing

```tsx
import { shouldIndexPath } from '@/lib/seo/indexing';

console.log(shouldIndexPath('/'));              // true
console.log(shouldIndexPath('/admin'));         // false
console.log(shouldIndexPath('/blog/post-1'));   // true
console.log(shouldIndexPath('/api/data'));      // false
```

---

## Best Practices

### 1. Environment Management

✅ **DO:**
- Set `VITE_SEO_INDEX=true` only in production
- Use Vercel preview deployments for testing
- Keep `SEO_INDEX=false` in `.env.local`

❌ **DON'T:**
- Index staging/preview environments
- Hardcode indexing flags in code
- Forget to update after domain changes

### 2. Per-Page Control

✅ **DO:**
```tsx
// Private pages
<PageHead noIndex={true} />

// Public pages
<PageHead robots="index,follow" />

// Public but don't follow links
<PageHead robots="index,nofollow" />
```

❌ **DON'T:**
```tsx
// Don't mix signals
<PageHead robots="index,follow" noIndex={true} />  // Conflicting
```

### 3. CN Domain Handling

✅ **DO:**
```tsx
import { isCNDomain, getBaseURL } from '@/lib/seo/indexing';

const base = getBaseURL();  // Auto-detects CN vs global
const canonical = `${base}/about`;
```

❌ **DON'T:**
```tsx
// Hardcoded URLs
const canonical = 'https://zhengrowth.com/about';  // Breaks CN domain
```

---

## Troubleshooting

### Issue: Preview site is indexed

**Cause:** `SEO_INDEX` not set or `VERCEL_ENV` not detected

**Solution:**
```bash
# Explicitly set in Vercel dashboard
VITE_SEO_INDEX=false
```

### Issue: robots.txt shows 404

**Cause:** Vercel rewrite not configured

**Solution:**
Check `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/robots.txt",
      "destination": "/api/robots.ts"
    }
  ]
}
```

### Issue: CN domain shows wrong sitemap URLs

**Cause:** `CN_DOMAINS` environment variable not set

**Solution:**
```bash
CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com
```

### Issue: Admin pages appearing in search

**Cause:** Missing robots meta or path check

**Solution:**
```tsx
// In admin routes
<PageHead noIndex={true} />

// Or in layout
const { shouldIndexPath } = useSEO();
// Will automatically return false for /admin/*
```

---

## Monitoring

### Google Search Console

1. **Submit sitemaps:**
   - `https://zhengrowth.com/sitemap.xml`
   - `https://zhengrowth.com/sitemap-blogs.xml`
   - `https://zhengrowth.com/sitemap-events.xml`

2. **Monitor coverage:**
   - Check for "Noindex" errors on pages that should be indexed
   - Verify admin/api routes are not indexed

3. **Track indexing:**
   - Set up alerts for unexpected deindexing
   - Monitor crawl stats

### Manual Checks

```bash
# Check robots.txt
curl https://zhengrowth.com/robots.txt

# Check specific page meta
curl -s https://zhengrowth.com/about | grep 'name="robots"'

# Check sitemap generation
curl https://zhengrowth.com/sitemap-blogs.xml
```

---

## Migration Guide

### From Static to Dynamic robots.txt

**Before:**
```
User-agent: *
Allow: /
```

**After:**
1. Delete `public/robots.txt`
2. Add API endpoint `api/robots.ts`
3. Add Vercel rewrite
4. Set environment variables

### Adding to Existing Project

1. **Install dependencies:** (already done)
   ```bash
   npm install react-helmet-async
   ```

2. **Add components:**
   - `src/components/Robots.tsx`
   - `src/components/GlobalHead.tsx`
   - `src/lib/seo/indexing.ts`
   - `src/hooks/useSEO.ts`

3. **Add API endpoint:**
   - `api/robots.ts`

4. **Update config:**
   - Add rewrite to `vercel.json`
   - Add env vars to `.env.example`
   - Update `src/vite-env.d.ts`

5. **Update App.tsx:**
   ```tsx
   import { GlobalHead } from '@/components/GlobalHead';
   
   function App() {
     return (
       <>
         <GlobalHead />
         {/* existing content */}
       </>
     );
   }
   ```

---

## Support

For issues:
- Check environment variables
- Verify Vercel rewrites
- Test with curl commands
- Check browser console for warnings
