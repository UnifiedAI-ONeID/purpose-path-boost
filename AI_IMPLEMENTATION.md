# AI System Implementation Guide

## Overview

This document describes the complete AI infrastructure implementation for ZhenGrowth, including Google AI integration, region detection, caching, and monitoring.

## Architecture

### Core Components

1. **AI Configuration** (`src/lib/ai-config.ts`)
   - Master enable/disable switch
   - Timeout and cache TTL settings
   - CN domain detection
   - Region-based feature toggling

2. **Utility Functions**
   - `strictFetch`: HTTP requests with timeout and abort control
   - `cache`: In-memory LRU caching with TTL
   - `schema`: JSON validation for AI responses

3. **API Endpoints**
   - `/api/ai/status`: System status and configuration
   - `/api/ai/clear-cache`: Admin-only cache clearing
   - `/api/admin/pricing/suggest`: AI-powered pricing suggestions

4. **Monitoring** (`src/pages/AdminAI.tsx`)
   - Real-time AI usage statistics
   - Request mode distribution (Google/Heuristic/Cache)
   - Error tracking and performance metrics

## Configuration

### Environment Variables

```bash
# Google AI
GOOGLE_AI_API_KEY=your_api_key_here

# Region Detection
EDGE_COUNTRY_HEADER=x-edge-country

# AI Settings (optional, defaults provided)
AI_ENABLE=true
AI_TIMEOUT_MS=6000
AI_CACHE_TTL_S=900
AI_STRICT_JSON=true
CN_DOMAINS=zhengrowth.cn,cn.zhengrowth.com
```

### Constants

```typescript
export const AI = {
  ENABLE: true,              // Master kill switch
  TIMEOUT: 6000,             // 6 seconds max per request
  CACHE_TTL: 900,            // 15 minutes cache
  STRICT: true,              // Validate JSON responses
  CN_DOMAINS: [...],         // CN-specific domains
  isCN: (host, country) => {...}
};
```

## Usage Pattern

### 1. Check Cache

```typescript
const cacheKey = `pricing:${ticket_id}:${country}:${base_price_cents}`;
const cached = getCache(cacheKey, AI_CACHE_TTL);
if (cached) {
  return res.status(200).json({ ok: true, source: 'cache', data: cached });
}
```

### 2. Detect Region

```typescript
const host = req.headers.host || '';
const edgeCountry = (req.headers['x-edge-country'] || '').toString().toUpperCase();
const isCN = edgeCountry === 'CN' || host.endsWith('.cn');
```

### 3. Fallback Heuristic

```typescript
const heuristic = {
  suggest_cents: Math.round(localPrice / 100) * 100 - 1,
  currency: targetCurrency,
  reasoning: 'PPP and FX adjustment'
};
```

### 4. Try AI (if not CN and enabled)

```typescript
if (!isCN && AI_ENABLE && process.env.GOOGLE_AI_API_KEY) {
  try {
    const r = await strictFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      },
      AI_TIMEOUT
    ).then(r => r.json());
    
    // Parse and validate response
    const text = r?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (validateResponse(parsed)) {
        heuristic = { ...parsed, source: 'google' };
      }
    }
  } catch (error) {
    // Log error, continue with heuristic
  }
}
```

### 5. Log Usage

```typescript
await supabase.from('ai_logs').insert([{
  route: '/api/admin/pricing/suggest',
  mode: 'google', // or 'heuristic'
  request: { country, base_price_cents },
  duration_ms: Date.now() - startTime,
  error: errorMessage || null
}]);
```

### 6. Cache & Return

```typescript
setCache(cacheKey, heuristic);
res.status(200).json({ 
  ok: true, 
  source: heuristic.source || 'heuristic', 
  data: heuristic 
});
```

## Safety Features

### 1. Timeout Protection

All AI requests have a 6-second timeout with abort control:

```typescript
const ctrl = new AbortController();
const t = setTimeout(() => ctrl.abort(), timeoutMs);
try {
  return await fetch(url, { ...opts, signal: ctrl.signal });
} finally {
  clearTimeout(t);
}
```

### 2. Schema Validation

Strict JSON validation before using AI responses:

```typescript
export function validateSuggestions(json: any) {
  const ok = json && 
    json.headlines && Array.isArray(json.headlines) && 
    json.hooks && Array.isArray(json.hooks);
  return ok ? json : null;
}
```

### 3. Graceful Degradation

- **No API key?** → Heuristic fallback
- **CN region?** → Heuristic fallback
- **AI timeout?** → Heuristic fallback
- **Invalid JSON?** → Heuristic fallback

### 4. Cache Layer

15-minute TTL cache reduces API calls and improves response time:

```typescript
if (cached && (Date.now() - cached.t) < AI_CACHE_TTL * 1000) {
  return cached.v;
}
```

## Monitoring

### Admin Dashboard (`/admin/ai`)

**Configuration Panel:**
- AI Enabled status
- API Key presence
- CN Mode detection
- Cache TTL settings

**Usage Statistics:**
- Total requests
- Google AI calls
- Heuristic fallbacks
- Cache hits
- Error count
- Average duration

**Activity Log:**
- Recent requests
- Mode (google/heuristic/cache)
- Duration in ms
- Error messages

### Database Schema

```sql
create table ai_logs (
  id bigserial primary key,
  at timestamptz default now(),
  route text not null,
  mode text not null,
  request jsonb,
  error text,
  duration_ms int
);

create index ai_logs_at_idx on ai_logs(at desc);
create index ai_logs_route_idx on ai_logs(route);
create index ai_logs_mode_idx on ai_logs(mode);
```

## SEO Integration

### Meta Tags & Structured Data

All pages include:
- Canonical URLs
- hreflang alternates (en, zh-CN, zh-TW)
- Open Graph tags
- Twitter Card meta
- JSON-LD structured data

### Sitemaps

- `sitemap.xml`: Main pages
- `sitemap-blogs.xml`: Blog posts
- `sitemap-events.xml`: Events

### Robots.txt

```
User-agent: *
Allow: /

Sitemap: https://zhengrowth.com/sitemap.xml
Sitemap: https://zhengrowth.com/sitemap-blogs.xml
Sitemap: https://zhengrowth.com/sitemap-events.xml

Disallow: /admin
Disallow: /api/
Disallow: /auth
```

## Performance Considerations

1. **Cache First:** Always check cache before external calls
2. **Parallel Processing:** Don't block on AI, return heuristic if needed
3. **Timeouts:** Strict 6-second limit prevents hanging requests
4. **Region Detection:** Skip AI for CN to reduce latency
5. **Monitoring:** Track all requests for optimization opportunities

## Error Handling

```typescript
try {
  // AI call
} catch (aiError) {
  console.error('AI error:', aiError);
  await logError(aiError);
  // Continue with heuristic
}
```

## Future Enhancements

1. **Model Selection:** Support multiple AI models
2. **Streaming:** Real-time token streaming for chat features
3. **A/B Testing:** Compare AI vs heuristic effectiveness
4. **Cost Tracking:** Monitor API usage and costs
5. **Rate Limiting:** Protect against abuse

## Troubleshooting

### AI Not Working?

1. Check `/api/ai/status` for configuration
2. Verify `GOOGLE_AI_API_KEY` is set
3. Check region detection (CN vs non-CN)
4. Review logs in `/admin/ai`
5. Clear cache via `/api/ai/clear-cache`

### High Error Rate?

1. Check timeout settings (may need increase)
2. Verify API key validity
3. Review error messages in logs
4. Check network connectivity
5. Verify JSON parsing logic

### Poor Performance?

1. Increase cache TTL
2. Review heuristic logic
3. Consider pre-computing common scenarios
4. Monitor API latency
5. Optimize prompt length

## Security Notes

- API keys stored as Supabase secrets
- Admin-only access for sensitive endpoints
- Rate limiting recommended for production
- Cache clearing requires admin authentication
- All logs use RLS policies for access control
