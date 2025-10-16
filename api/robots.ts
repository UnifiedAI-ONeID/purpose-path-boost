import type { VercelRequest, VercelResponse } from '@vercel/node';

const CN_DOMAINS = (process.env.CN_DOMAINS || 'zhengrowth.cn,cn.zhengrowth.com')
  .split(',').map(s=>s.trim()).filter(Boolean);

export default async function handler(req: VercelRequest, res: VercelResponse){
  const host = (req.headers.host || '').toLowerCase();
  const base = (CN_DOMAINS.some(d => host.endsWith(d)) ? `https://${host}` : 'https://zhengrowth.com');

  // Block private/admin surfaces everywhere; allow public.
  // Disallow noisy params that create dupes.
  const lines = [
    'User-agent: *',
    'Disallow: /admin',
    'Disallow: /api',
    'Disallow: /_vercel',
    'Disallow: /*?preview=',
    'Disallow: /*?draft=',
    'Disallow: /*&preview=',
    'Disallow: /*&draft=',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    `Sitemap: ${base}/sitemap-blogs.xml`,
    `Sitemap: ${base}/sitemap-events.xml`,
    '',
    'Crawl-delay: 1',
  ];

  // Staging/preview safety: if VERCEL_ENV=preview or SEO_INDEX=false → noindex sitewide.
  const noindex = (process.env.SEO_INDEX || 'true') !== 'true' || (process.env.VERCEL_ENV === 'preview');
  if (noindex){
    lines.unshift('# Indexing disabled for preview/staging');
    lines.unshift('User-agent: *');
    lines.unshift('Disallow: /');
  }

  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(lines.join('\n'));
}
