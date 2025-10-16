# AI & SEO Implementation Guide

## Overview

This document covers the complete AI infrastructure and SEO implementation for ZhenGrowth, including:
- AI-powered pricing suggestions with Google Gemini
- Comprehensive AI monitoring and logging
- Advanced SEO with hreflang and canonical tags
- Structured data (JSON-LD) for rich snippets
- Dynamic XML sitemaps

---

## AI System

### Configuration

**File: `src/lib/ai-config.ts`**

```typescript
export const AI = {
  ENABLE: true,
  TIMEOUT: 6000,        // ms
  CACHE_TTL: 900,       // seconds (15 min)
  STRICT: true,         // JSON schema validation
  CN_DOMAINS: ['zhengrowth.cn', 'cn.zhengrowth.com'],
  isCN: (host, country) => /* detection logic */
};
```

### Features

1. **Smart Fallback**: Automatically switches to heuristic pricing in China or when API key is unavailable
2. **In-Memory Caching**: 15-minute cache for identical requests
3. **Timeout Protection**: 6-second timeout prevents UI blocking
4. **Comprehensive Logging**: All AI calls logged to `ai_logs` table

### API Endpoints

#### `/api/ai/status`
Returns AI system health status.

**Response:**
```json
{
  "ok": true,
  "ai_enabled": true,
  "has_key": true,
  "cn_mode": false,
  "timeout_ms": 6000,
  "cache_ttl_s": 900
}
```

#### `/api/ai/logs?range=24h`
Fetches AI usage logs for monitoring.

**Query Params:**
- `range`: `1h` | `24h` | `7d`

**Response:**
```json
{
  "ok": true,
  "rows": [
    {
      "id": 123,
      "at": "2025-01-15T10:30:00Z",
      "route": "/api/admin/pricing/suggest",
      "mode": "google",
      "error": null,
      "duration_ms": 1234,
      "request": { "country": "CN", "base_price_cents": 9900 }
    }
  ]
}
```

#### `/api/ai/clear-cache`
Admin-only endpoint to clear AI cache.

**Auth:** Requires valid JWT with admin role.

### Admin Dashboard

**Route:** `/admin/ai`

Features:
- Real-time AI health monitoring
- Usage statistics (Google AI, heuristic, cache hits, errors)
- Detailed activity logs with filtering (1h/24h/7d)
- Average response time tracking

### Pricing AI Integration

**File: `api/admin/pricing/suggest.ts`**

The pricing suggestion endpoint uses AI to provide market-optimized pricing:

```typescript
const prompt = `Suggest optimal local price for a life coaching session 
priced at ${base_currency} ${(base_price_cents / 100).toFixed(2)} in ${country}.
Return JSON with:
- suggest_cents (number)
- currency (string)
- reasoning (string)
- tiers (array): low/sweet/premium options

Consider local purchasing power, market positioning, and psychological pricing.`;
```

**Modes:**
- `google`: AI-powered suggestions via Gemini
- `heuristic`: PPP-adjusted algorithmic pricing
- `cache`: Served from in-memory cache

---

## SEO Implementation

### SEO Helmet Component

**File: `src/components/SEOHelmet.tsx`**

Comprehensive meta tags with multi-language support:

```tsx
<SEOHelmet
  title="ZhenGrowth - Life Coaching"
  description="Transform your life with professional coaching"
  path="/about"
  lang="en"
  image="https://zhengrowth.com/og/about.png"
  alternates={{
    'en': 'https://zhengrowth.com/about',
    'zh-CN': 'https://zhengrowth.com/zh-CN/about',
    'zh-TW': 'https://zhengrowth.com/zh-TW/about'
  }}
/>
```

**Features:**
- Canonical URLs
- Hreflang tags (en, zh-CN, zh-TW, x-default)
- Open Graph (Facebook, LinkedIn)
- Twitter Cards
- Content-Language meta tag
- Custom OG images per page

### Structured Data (JSON-LD)

**File: `src/components/JsonLD.tsx`**

Pre-built schemas for rich search results:

#### Organization
```tsx
<OrgJsonLD />
```

#### Website with Search
```tsx
<WebsiteJsonLD />
```

#### Blog Article
```tsx
<ArticleJsonLD post={{ title, published_at, tags, slug, ... }} />
```

#### Event
```tsx
<EventJsonLD 
  ev={{ title, start_at, end_at, ... }} 
  tickets={[{ price_cents, currency }]} 
/>
```

#### Product (Express Offer)
```tsx
<ProductJsonLD priceCents={9900} currency="USD" />
```

#### FAQ
```tsx
<FAQJsonLD qa={[
  { q: "What is life coaching?", a: "..." },
  { q: "How much does it cost?", a: "..." }
]} />
```

### Dynamic Sitemaps

#### Static Sitemap
**File: `public/sitemap.xml`**

Contains main static pages:
- Home, About, Contact, Blog, Events, Book, Quiz
- Includes hreflang attributes
- Priority and changefreq optimization

#### Blog Sitemap
**Endpoint:** `/sitemap-blogs.xml`  
**API:** `api/sitemap-blogs.ts`

Dynamically generates sitemap from `blog_posts` table:
- All published blog posts
- Multi-language versions (en, zh-CN, zh-TW)
- Last modified timestamps
- Priority: 0.7

#### Events Sitemap
**Endpoint:** `/sitemap-events.xml`  
**API:** `api/sitemap-events.ts`

Dynamically generates sitemap from `events` table:
- All published events
- Last modified timestamps
- Priority: 0.9 (high priority for time-sensitive content)

### robots.txt

**File: `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://zhengrowth.com/sitemap.xml
Sitemap: https://zhengrowth.com/sitemap-blogs.xml
Sitemap: https://zhengrowth.com/sitemap-events.xml

Disallow: /admin
Disallow: /api/
Disallow: /auth
Disallow: /pay

Crawl-delay: 1
```

---

## Database Schema

### ai_logs Table

```sql
CREATE TABLE ai_logs (
  id BIGSERIAL PRIMARY KEY,
  at TIMESTAMPTZ DEFAULT NOW(),
  route TEXT NOT NULL,
  mode TEXT NOT NULL,  -- 'google' | 'heuristic' | 'cache' | 'error'
  request JSONB,
  error TEXT,
  duration_ms INT
);

-- RLS Policies
-- INSERT: Anyone can log (true)
-- SELECT: Admins only (is_admin())
```

**Indexes:**
- `(at)` for time-range queries
- `(mode)` for filtering by AI mode

---

## Deployment Configuration

### Environment Variables

```bash
# Required
GOOGLE_AI_API_KEY=xxx  # Google Gemini API key

# Optional (defaults)
AI_ENABLE=true
AI_TIMEOUT_MS=6000
AI_CACHE_TTL_S=900
AI_STRICT_JSON=true
EDGE_COUNTRY_HEADER=x-edge-country
CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com
```

### Vercel Configuration

**File: `vercel.json`**

```json
{
  "rewrites": [
    {
      "source": "/sitemap-blogs.xml",
      "destination": "/api/sitemap-blogs.ts"
    },
    {
      "source": "/sitemap-events.xml",
      "destination": "/api/sitemap-events.ts"
    }
  ]
}
```

---

## Best Practices

### AI Usage

1. **Always log**: Every AI call should be logged to `ai_logs`
2. **Cache aggressively**: Use 15-min cache for identical requests
3. **Timeout protection**: Never exceed 6-second timeout
4. **Graceful degradation**: Always have heuristic fallback
5. **China compliance**: Detect CN region and skip AI calls

### SEO

1. **Canonical URLs**: Always set canonical to prevent duplicate content
2. **Hreflang**: Include all language variants (en, zh-CN, zh-TW, x-default)
3. **Structured data**: Add JSON-LD for rich snippets
4. **Image optimization**: Use descriptive alt text, compress images
5. **Mobile-first**: Ensure responsive design
6. **Page speed**: Lazy load images, defer non-critical scripts

### Monitoring

1. **Check AI logs daily**: Monitor error rates and response times
2. **Track cache hit ratio**: Should be >40% for cost efficiency
3. **Monitor Google Search Console**: Watch for crawl errors
4. **Validate structured data**: Use Google's Rich Results Test
5. **Test mobile usability**: Use Google's Mobile-Friendly Test

---

## Troubleshooting

### AI Not Working

1. Check `GOOGLE_AI_API_KEY` is set correctly
2. Verify `AI.ENABLE` is true
3. Check if request is from CN (AI disabled in China)
4. Review logs at `/admin/ai` for errors
5. Test with `/api/ai/status` endpoint

### SEO Issues

1. Validate sitemaps: `/sitemap.xml`, `/sitemap-blogs.xml`, `/sitemap-events.xml`
2. Check `robots.txt` is accessible
3. Verify canonical URLs are absolute (not relative)
4. Test structured data with schema.org validator
5. Check hreflang tags match actual language variants

### Performance

1. Enable CDN caching for sitemaps (1 hour)
2. Use `stale-while-revalidate` for AI cache
3. Implement Redis for shared cache across instances
4. Monitor AI timeout rate (should be <1%)
5. Optimize database queries with indexes

---

## Future Enhancements

### AI System
- [ ] Add OpenAI GPT-4 as fallback model
- [ ] Implement Redis cache for distributed systems
- [ ] Add A/B testing for AI vs heuristic pricing
- [ ] Track conversion rates per pricing mode
- [ ] Add sentiment analysis for blog content

### SEO
- [ ] Auto-generate OG images with satori
- [ ] Add breadcrumb structured data
- [ ] Implement video schema for YouTube content
- [ ] Add organization reviews schema
- [ ] Create XML sitemap for images

---

## Support

For issues or questions:
- GitHub: [repo link]
- Email: dev@zhengrowth.com
- Docs: https://docs.zhengrowth.com
