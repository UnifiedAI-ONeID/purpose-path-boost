import { createClient } from 'npm:@supabase/supabase-js@2';
import satori from 'https://esm.sh/satori@0.10.14';
import { initWasm, Resvg } from 'https://esm.sh/@resvg/resvg-wasm@2.6.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAT_SIZES = {
  linkedin:    { w: 1200, h: 627 },
  facebook:    { w: 1200, h: 630 },
  x:           { w: 1200, h: 675 },
  ig_square:   { w: 1080, h: 1080 },
  ig_portrait: { w: 1080, h: 1350 },
  story:       { w: 1080, h: 1920 },
};

type PlatKey = keyof typeof PLAT_SIZES;

type Accent = { start: string; end: string };

const TAG_PALETTE: Record<string, Accent> = {
  mindset:     { start: '#0B3D3C', end: '#15706A' },
  confidence:  { start: '#004E92', end: '#000428' },
  clarity:     { start: '#2E3192', end: '#1BFFFF' },
  consistency: { start: '#0F2027', end: '#203A43' },
  habits:      { start: '#4CA1AF', end: '#2C3E50' },
  leadership:  { start: '#8E2DE2', end: '#4A00E0' },
  career:      { start: '#11998E', end: '#38EF7D' },
  relationships:{ start: '#FF512F', end: '#DD2476' },
  wellness:    { start: '#F7971E', end: '#FFD200' },
  spirituality:{ start: '#5A3F37', end: '#2C7744' },
  money:       { start: '#56ab2f', end: '#a8e063' },
  productivity:{ start: '#1D2B64', end: '#F8CDDA' },
  '自信':      { start: '#004E92', end: '#000428' },
  '清晰':      { start: '#2E3192', end: '#1BFFFF' },
  '一致性':    { start: '#0F2027', end: '#203A43' },
  '職涯':      { start: '#11998E', end: '#38EF7D' },
  '關係':      { start: '#FF512F', end: '#DD2476' },
};

const DEFAULT_ACCENT: Accent = { start: '#0B3D3C', end: '#15706A' };

function pickAccent(tag?: string): Accent {
  if (!tag) return DEFAULT_ACCENT;
  const key = tag.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '');
  return TAG_PALETTE[tag.toLowerCase()] || TAG_PALETTE[key] || DEFAULT_ACCENT;
}

function bgGradient(theme: 'light' | 'dark', accent?: Accent) {
  if (accent) {
    return `linear-gradient(135deg, ${accent.start} 0%, ${accent.end} 100%)`;
  }
  return theme === 'dark'
    ? 'linear-gradient(135deg, #0b0c0d 0%, #161a1d 100%)'
    : 'linear-gradient(135deg, #0b3d3c 0%, #15706a 100%)';
}

function card(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'rgba(255,255,255,0.06)'
    : 'rgba(255,255,255,0.16)';
}

async function renderSVG({
  title,
  subtitle,
  w,
  h,
  theme,
  lang,
  accent,
}: {
  title: string;
  subtitle?: string;
  w: number;
  h: number;
  theme: 'light' | 'dark';
  lang: 'en' | 'zh-CN' | 'zh-TW';
  accent?: Accent;
}) {
  const brandText = 
    lang === 'zh-TW' ? 'ZhenGrowth 真成長' :
    lang === 'zh-CN' ? 'ZhenGrowth 真成长' :
    'ZhenGrowth — Grow with Clarity';

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: w,
          height: h,
          display: 'flex',
          background: bgGradient(theme, accent),
          color: '#fff',
          padding: w * 0.08,
          fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans CJK TC", Arial, sans-serif',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: w * 0.02,
                width: '100%',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: w * 0.08,
                      lineHeight: 1.05,
                      fontWeight: 800,
                      letterSpacing: '-0.5px',
                    },
                    children: title,
                  },
                },
                subtitle
                  ? {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: w * 0.032,
                          opacity: 0.95,
                          marginTop: w * 0.01,
                        },
                        children: subtitle,
                      },
                    }
                  : null,
                {
                  type: 'div',
                  props: {
                    style: {
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: w * 0.02,
                      background: card(theme),
                      borderRadius: w * 0.02,
                      padding: w * 0.02,
                      border: `1px solid ${
                        theme === 'dark'
                          ? 'rgba(255,255,255,.18)'
                          : 'rgba(255,255,255,.25)'
                      }`,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: w * 0.06 },
                          children: '🍃',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: { fontSize: w * 0.028, fontWeight: 700 },
                          children: brandText,
                        },
                      },
                    ],
                  },
                },
              ].filter(Boolean),
            },
          },
        ],
      },
    } as any,
    {
      width: w,
      height: h,
      fonts: [],
    }
  );

  return svg as string;
}

let wasmInitialized = false;

async function svgToPng(svg: string, w: number, h: number) {
  if (!wasmInitialized) {
    await initWasm(fetch('https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm'));
    wasmInitialized = true;
  }
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: w } });
  const png = resvg.render();
  return png.asPng();
}

async function uploadPNG(supabase: any, path: string, bytes: Uint8Array) {
  const { error } = await supabase.storage
    .from('social-images')
    .upload(path, bytes, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage.from('social-images').getPublicUrl(path);
  return data.publicUrl;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json();
    const {
      title = '',
      subtitle = '',
      slug = '',
      theme = 'light',
      lang = 'en',
      size = 'linkedin',
      tag = '',
    } = body;

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'missing title/slug' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const key = (size as PlatKey) || 'linkedin';
    const { w, h } = PLAT_SIZES[key];
    const accent = tag ? pickAccent(tag) : undefined;

    console.log(`Rendering ${key} image for: ${title}${tag ? ` (tag: ${tag})` : ''}`);

    const svg = await renderSVG({ title, subtitle, w, h, theme, lang, accent });
    const png = await svgToPng(svg, w, h);

    const path = `${slug}/${key}.png`;
    const url = await uploadPNG(supabase, path, png);

    console.log(`Image uploaded: ${url}`);

    return new Response(JSON.stringify({ ok: true, url, path, w, h }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in og-render:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
