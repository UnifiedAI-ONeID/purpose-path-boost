# Complete System Architecture Guide

## System Overview

ZhenGrowth platform with three integrated systems:
1. **AI System**: Google Gemini-powered pricing optimization
2. **SEO System**: Dynamic robots control and structured data
3. **Multi-region**: CN-safe architecture with localized content

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    ZhenGrowth Platform                   │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ AI System   │  │  SEO System  │  │ Region System  │ │
│  ├─────────────┤  ├──────────────┤  ├────────────────┤ │
│  │ • Gemini AI │  │ • robots.txt │  │ • CN domains   │ │
│  │ • Pricing   │  │ • Meta tags  │  │ • Global cdn   │ │
│  │ • Cache     │  │ • JSON-LD    │  │ • Localization │ │
│  │ • Logging   │  │ • Sitemaps   │  │ • Analytics    │ │
│  └─────────────┘  └──────────────┘  └────────────────┘ │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                    Shared Services                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐│
│  │ Supabase Backend │  │ Vercel Edge Network          ││
│  ├──────────────────┤  ├──────────────────────────────┤│
│  │ • Database       │  │ • CDN caching                ││
│  │ • Auth           │  │ • Edge functions             ││
│  │ • Storage        │  │ • Geographic routing         ││
│  │ • Functions      │  │ • Header injection           ││
│  └──────────────────┘  └──────────────────────────────┘│
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## 1. AI System

### Configuration

**Master Config:** `src/lib/ai-config.ts`

```typescript
export const AI = {
  ENABLE: true,           // Global kill switch
  TIMEOUT: 6000,          // 6 second timeout
  CACHE_TTL: 900,         // 15 minute cache
  STRICT: true,           // JSON validation
  CN_DOMAINS: [...],      // CN domain list
  isCN: (host, country) => {...}  // CN detection
};
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| AI Config | Central configuration | `src/lib/ai-config.ts` |
| Strict Fetch | Timeout protection | `api/_util/strictFetch.ts` |
| Cache | In-memory LRU | `api/_util/cache.ts` |
| Schema Validation | JSON validation | `api/_util/schema.ts` |
| Status API | Health check | `api/ai/status.ts` |
| Logs API | Usage metrics | `api/ai/logs.ts` |
| Clear Cache API | Admin control | `api/ai/clear-cache.ts` |
| Pricing AI | Market optimization | `api/admin/pricing/suggest.ts` |
| Admin Dashboard | Monitoring UI | `src/pages/AdminAI.tsx` |

### Data Flow

```
┌──────────────┐
│ Admin Dashboard│
│ /admin/ai    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│ API: /api/admin/pricing/suggest              │
├──────────────────────────────────────────────┤
│ 1. Check cache (15min TTL)                   │
│ 2. Detect CN domain → use heuristic          │
│ 3. Call Gemini API (6s timeout)              │
│ 4. Validate JSON response                    │
│ 5. Log to ai_logs table                      │
│ 6. Cache result                               │
│ 7. Return pricing suggestion                 │
└──────────────────────────────────────────────┘
       │
       ▼
┌─────────────────┐
│ Database: ai_logs│
├─────────────────┤
│ • route         │
│ • mode          │  (google | heuristic | cache)
│ • request       │
│ • error         │
│ • duration_ms   │
└─────────────────┘
```

### Environment Variables

```bash
# Required
GOOGLE_AI_API_KEY=xxx

# Optional (with defaults)
AI_ENABLE=true
AI_TIMEOUT_MS=6000
AI_CACHE_TTL_S=900
AI_STRICT_JSON=true
EDGE_COUNTRY_HEADER=x-edge-country
CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com
```

---

## 2. SEO System

### Configuration

**Master Control:** Environment variables + URL detection

```bash
VITE_SEO_INDEX=true              # Global indexing flag
CN_DOMAINS=zhengrowth.cn,...     # CN domains
VERCEL_ENV=production            # Auto-set by Vercel
```

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| Dynamic robots.txt | Crawler control | `api/robots.ts` |
| Robots Meta | Per-page control | `src/components/Robots.tsx` |
| GlobalHead | Site-wide SEO | `src/components/GlobalHead.tsx` |
| PageHead | Page-specific SEO | `src/components/GlobalHead.tsx` |
| SEOHelmet | Enhanced meta | `src/components/SEOHelmet.tsx` |
| JSON-LD | Structured data | `src/components/JsonLD.tsx` |
| SEO Utils | Helper functions | `src/lib/seo/indexing.ts` |
| useSEO Hook | Route updates | `src/hooks/useSEO.ts` |
| Blog Sitemap | Dynamic sitemap | `api/sitemap-blogs.ts` |
| Events Sitemap | Dynamic sitemap | `api/sitemap-events.ts` |

### Data Flow

```
┌──────────────────┐
│ User visits page │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ GlobalHead Component                       │
├────────────────────────────────────────────┤
│ 1. Check VITE_SEO_INDEX env var            │
│ 2. Check VERCEL_ENV (preview?)             │
│ 3. Check hostname (lovableproject.com?)    │
│ 4. Determine: index or noindex             │
└────────┬───────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ PageHead Component                         │
├────────────────────────────────────────────┤
│ 1. Get path from route                     │
│ 2. Check shouldIndexPath()                 │
│ 3. Generate canonical URL                  │
│ 4. Generate hreflang tags                  │
│ 5. Add JSON-LD structured data             │
│ 6. Set robots meta tag                     │
└────────┬───────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│ HTML Output                                │
├────────────────────────────────────────────┤
│ <meta name="robots" content="index,follow">│
│ <link rel="canonical" href="...">          │
│ <link rel="alternate" hreflang="en">       │
│ <script type="application/ld+json">        │
└────────────────────────────────────────────┘
```

### Crawler Flow

```
┌───────────────┐
│ Google Bot    │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────┐
│ GET /robots.txt                   │
└───────┬───────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ api/robots.ts                     │
├───────────────────────────────────┤
│ 1. Check VERCEL_ENV               │
│ 2. Check SEO_INDEX env var        │
│ 3. Detect host (CN or global)     │
│ 4. Generate rules:                │
│    • Disallow: /admin, /api       │
│    • Sitemap: (localized URL)     │
│ 5. Return text/plain              │
└───────┬───────────────────────────┘
        │
        ▼
┌───────────────────────────────────┐
│ Crawl allowed pages               │
│ • Follow sitemaps                 │
│ • Respect robots meta tags        │
│ • Index structured data           │
└───────────────────────────────────┘
```

---

## 3. Region System

### CN Domain Detection

**Utility:** `src/lib/seo/indexing.ts`

```typescript
export function isCNDomain(): boolean {
  const cnDomains = ['zhengrowth.cn', 'cn.zhengrowth.com'];
  return cnDomains.some(d => window.location.hostname.endsWith(d));
}

export function getBaseURL(): string {
  if (isCNDomain()) return `https://${window.location.hostname}`;
  return 'https://zhengrowth.com';
}
```

### Region-Specific Behavior

| Feature | Global | CN |
|---------|--------|-----|
| AI Calls | ✅ Gemini | ❌ Heuristic only |
| Analytics | Umami + PostHog | Baidu Tongji |
| CDN | Vercel Global | Vercel Edge (CN) |
| Payment | Airwallex (all) | Airwallex (CN) |
| Sitemaps | zhengrowth.com | zhengrowth.cn |

---

## Integration Points

### 1. AI + SEO

**Use Case:** Dynamic pricing metadata

```tsx
// Event page with AI-optimized pricing
import { PageHead } from '@/components/GlobalHead';
import { EventJsonLD } from '@/components/JsonLD';

export default function EventPage({ event, pricing }) {
  return (
    <>
      <PageHead
        title={event.title}
        description={event.summary}
        path={`/events/${event.slug}`}
      />
      
      <EventJsonLD 
        ev={event} 
        tickets={[{
          price_cents: pricing.suggest_cents,  // AI-optimized
          currency: pricing.currency            // Localized
        }]} 
      />
    </>
  );
}
```

### 2. AI + Region

**Use Case:** CN-aware pricing

```typescript
// api/admin/pricing/suggest.ts
const isCN = AI.isCN(req.headers.host, req.headers[EDGE_COUNTRY_HEADER]);

if (isCN) {
  // Use heuristic (no external API calls in China)
  return heuristicPricing(baseCents, country);
}

// Global: use AI
const aiSuggestion = await callGemini(prompt);
```

### 3. SEO + Region

**Use Case:** Localized sitemaps

```typescript
// api/robots.ts
const host = req.headers.host || '';
const base = CN_DOMAINS.some(d => host.endsWith(d)) 
  ? `https://${host}`
  : 'https://zhengrowth.com';

const lines = [
  'User-agent: *',
  'Disallow: /admin',
  '',
  `Sitemap: ${base}/sitemap.xml`,           // Localized
  `Sitemap: ${base}/sitemap-blogs.xml`,
  `Sitemap: ${base}/sitemap-events.xml`,
];
```

---

## Deployment Strategy

### Environment Matrix

| Environment | SEO_INDEX | VERCEL_ENV | AI | Indexing | Analytics |
|-------------|-----------|------------|-----|----------|-----------|
| Production | true | production | ✅ | ✅ | Full |
| Staging | false | production | ✅ | ❌ | Full |
| Preview | - | preview | ✅ | ❌ (auto) | Limited |
| Development | false | - | ✅ | ❌ | None |

### Deployment Checklist

**Production:**
```bash
# 1. Set environment variables
VITE_SEO_INDEX=true
GOOGLE_AI_API_KEY=xxx
CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com

# 2. Deploy
npm run build
vercel --prod

# 3. Verify
curl https://zhengrowth.com/robots.txt          # Should allow
curl https://zhengrowth.com/sitemap-blogs.xml   # Should list posts
curl https://zhengrowth.com/api/ai/status       # Should be healthy

# 4. Submit to search engines
# Google Search Console: Submit sitemaps
# Bing Webmaster: Submit sitemaps
```

**Preview:**
```bash
# 1. Vercel auto-sets
VERCEL_ENV=preview

# 2. Deploy
vercel

# 3. Verify
curl https://preview.vercel.app/robots.txt  # Should disallow all
# Check meta: <meta name="robots" content="noindex,nofollow">
```

---

## Monitoring & Analytics

### AI System Monitoring

**Dashboard:** `/admin/ai`

**Metrics:**
- Total requests
- Mode distribution (google, heuristic, cache)
- Error rate
- Average response time
- Cache hit ratio

**Alerts:**
- Error rate > 5%
- Response time > 3s
- Cache hit ratio < 40%

### SEO Monitoring

**Tools:**
- Google Search Console
- Bing Webmaster
- Ahrefs / SEMrush

**Metrics:**
- Indexed pages
- Crawl errors
- Rich results
- Organic traffic
- Click-through rate

**Alerts:**
- Unexpected deindexing
- Crawl errors spike
- Rich results drop
- Manual actions

### Region Monitoring

**Tools:**
- Vercel Analytics
- Cloudflare Analytics (if used)

**Metrics:**
- Traffic by region
- Latency by region
- CDN cache hit ratio
- Error rate by region

---

## Testing Guide

### AI System Tests

```bash
# 1. Test AI status endpoint
curl https://zhengrowth.com/api/ai/status
# Expected: { ok: true, ai_enabled: true, has_key: true, ... }

# 2. Test pricing suggestion (requires admin auth)
curl -X POST https://zhengrowth.com/api/admin/pricing/suggest \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"country":"CN","base_price_cents":9900,"base_currency":"USD","ticket_id":"xxx"}'
# Expected: { ok: true, heur: { suggest_cents: 6999, currency: "CNY", ... } }

# 3. Test caching (call same endpoint twice, 2nd should be cached)

# 4. Test CN fallback (from CN IP or with header)
curl -H "x-edge-country: CN" https://zhengrowth.com/api/admin/pricing/suggest ...
# Expected: mode: "heuristic"
```

### SEO System Tests

```bash
# 1. Test robots.txt
curl https://zhengrowth.com/robots.txt
# Expected: Disallow: /admin, Sitemap: ...

# 2. Test robots.txt on preview
curl https://preview-abc.vercel.app/robots.txt
# Expected: Disallow: /

# 3. Test sitemaps
curl https://zhengrowth.com/sitemap-blogs.xml | head -n 20
# Expected: Valid XML with blog URLs

# 4. Test meta tags
curl -s https://zhengrowth.com/about | grep 'name="robots"'
# Expected: <meta name="robots" content="index,follow">

# 5. Test structured data
curl -s https://zhengrowth.com/blog/sample | grep 'application/ld+json'
# Expected: JSON-LD script with Article schema
```

### Region System Tests

```bash
# 1. Test CN domain detection
curl -H "Host: zhengrowth.cn" https://zhengrowth.com/robots.txt
# Expected: Sitemap: https://zhengrowth.cn/sitemap.xml

# 2. Test global domain
curl -H "Host: zhengrowth.com" https://zhengrowth.com/robots.txt
# Expected: Sitemap: https://zhengrowth.com/sitemap.xml

# 3. Test edge country header
curl -H "x-edge-country: CN" https://zhengrowth.com/api/ai/status
# Expected: cn_mode: true
```

---

## Troubleshooting

### AI Issues

**Problem:** AI suggestions not working

**Debug:**
1. Check `/admin/ai` for errors
2. Verify `GOOGLE_AI_API_KEY` is set
3. Check API logs: `curl /api/ai/logs?range=1h`
4. Test status: `curl /api/ai/status`

**Problem:** High error rate

**Debug:**
1. Check ai_logs table for error patterns
2. Verify Gemini API quota
3. Check timeout settings (6s may be too short)
4. Review error messages in logs

### SEO Issues

**Problem:** Preview site indexed

**Debug:**
1. Check `VITE_SEO_INDEX` in Vercel dashboard
2. Verify `VERCEL_ENV=preview` is set
3. Test robots.txt on preview domain
4. Check meta tags in page source

**Problem:** Wrong sitemap URLs

**Debug:**
1. Check `CN_DOMAINS` environment variable
2. Test with different Host headers
3. Verify domain detection logic
4. Check DNS/CDN configuration

### Region Issues

**Problem:** CN users getting global content

**Debug:**
1. Check edge headers: `curl -I https://zhengrowth.cn/`
2. Verify CN domain DNS
3. Test with CN IP or header
4. Check CDN routing rules

---

## Performance Optimization

### AI System

1. **Caching**
   - In-memory LRU (15 min TTL)
   - Consider Redis for multi-instance
   - Cache warming for popular queries

2. **Timeouts**
   - Current: 6s (good balance)
   - Consider: 4s for faster UX
   - Fallback always ready

3. **Rate Limiting**
   - Implement per-user rate limits
   - Cache shared across users
   - Prioritize admin requests

### SEO System

1. **Meta Tags**
   - Minimal essential tags only
   - Lazy load JSON-LD scripts
   - Preconnect to CDN

2. **Sitemaps**
   - CDN cache: 1 hour
   - Gzip compression
   - Pagination for large sitemaps

3. **Robots.txt**
   - CDN cache: 1 hour
   - Small file size (<2KB)
   - Fast edge response

### Region System

1. **CDN**
   - Vercel Edge Network
   - Geographic routing
   - Cache at edge

2. **DNS**
   - Cloudflare (if using)
   - GeoDNS for CN
   - Low TTL for flexibility

---

## Security Considerations

### AI System

1. **API Key Protection**
   - Never expose in client code
   - Use Vercel env vars
   - Rotate periodically

2. **Rate Limiting**
   - Prevent abuse
   - Per-user quotas
   - Admin authentication

3. **Input Validation**
   - Sanitize all inputs
   - Validate JSON responses
   - Limit request size

### SEO System

1. **robots.txt**
   - Block sensitive routes
   - Prevent parameter pollution
   - Block admin/API routes

2. **Meta Tags**
   - Escape user content
   - Validate URLs
   - Sanitize descriptions

3. **Structured Data**
   - Validate JSON-LD
   - Escape special chars
   - Follow schema.org

---

## Future Enhancements

### AI System

- [ ] Add OpenAI GPT-4 fallback
- [ ] Implement Redis cache
- [ ] A/B test AI vs heuristic conversion
- [ ] Add sentiment analysis
- [ ] Multi-model ensemble

### SEO System

- [ ] Auto-generate OG images
- [ ] Breadcrumb structured data
- [ ] Video schema for YouTube
- [ ] Review schema
- [ ] Image sitemap

### Region System

- [ ] Add more regions (EU, APAC)
- [ ] GDPR compliance
- [ ] Multi-CDN strategy
- [ ] Edge compute for personalization

---

## Documentation Links

- **AI Implementation:** `AI_IMPLEMENTATION.md`
- **SEO Guide:** `ROBOTS_SEO_GUIDE.md`
- **AI + SEO Combined:** `AI_SEO_IMPLEMENTATION.md`
- **Implementation Summary:** `SEO_IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `COMPLETE_SYSTEM_GUIDE.md`

---

## Support

For questions or issues:
- **Email:** dev@zhengrowth.com
- **GitHub:** [repo link]
- **Docs:** https://docs.zhengrowth.com

---

Last Updated: 2025-01-15
Version: 1.0.0
