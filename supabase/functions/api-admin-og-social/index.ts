import { corsHeaders, json } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const title = url.searchParams.get('title') || 'ZhenGrowth';
    const excerpt = url.searchParams.get('excerpt') || 'Grow with Clarity';
    const ratio = url.searchParams.get('ratio') || '1200x628';
    const wm = url.searchParams.get('wm') || 'ZhenGrowth';

    const [W, H] = ratio.split('x').map(Number);

    // Generate SVG
    const svg = `
      <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0e7c6b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0b5f54;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#grad)"/>
        <text x="56" y="${H / 2 - 40}" font-family="Arial, sans-serif" font-size="54" font-weight="800" fill="#E8D18A">
          ${escapeXml(title)}
        </text>
        <text x="56" y="${H / 2 + 20}" font-family="Arial, sans-serif" font-size="28" fill="rgba(255,255,255,0.92)">
          ${escapeXml(excerpt)}
        </text>
        <text x="${W - 28}" y="${H - 22}" text-anchor="end" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.85)">
          © ${escapeXml(wm)}
        </text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=604800, immutable'
      }
    });

  } catch (error: any) {
    console.error('[OG Social] Error:', error);
    return json({ ok: false, error: error.message }, 500);
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
