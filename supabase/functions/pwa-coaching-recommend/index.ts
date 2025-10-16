import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-language',
};

type Lang = 'en' | 'zh-CN' | 'zh-TW';

function getLang(req: Request): Lang {
  const url = new URL(req.url);
  const langParam = url.searchParams.get('lang');
  if (langParam === 'zh-CN' || langParam === 'zh-TW' || langParam === 'en') return langParam;
  
  const al = (req.headers.get('accept-language') || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}

function pickFields(row: any, lang: Lang) {
  const title = lang === 'zh-CN' 
    ? (row.title_zh_cn ?? row.title_en)
    : lang === 'zh-TW' 
    ? (row.title_zh_tw ?? row.title_en)
    : row.title_en;

  const summary = lang === 'zh-CN'
    ? (row.summary_zh_cn ?? row.summary_en)
    : lang === 'zh-TW'
    ? (row.summary_zh_tw ?? row.summary_en)
    : row.summary_en;

  return { title, summary };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const lang = getLang(req);
    const url = new URL(req.url);
    const tagsParam = url.searchParams.get('tags') || '';
    const tags = tagsParam ? tagsParam.split(',').filter(Boolean) : [];

    const { data: offers } = await supabase
      .from('coaching_offers')
      .select('*')
      .eq('active', true);

    // Score offers based on tag matching
    const scored = (offers || []).map(o => {
      const offerTags = o.tags || [];
      const score = offerTags.reduce((sum: number, t: string) => {
        if (tags.includes(t)) return sum + 2; // Exact match
        if (tags.some(x => t.includes(x) || x.includes(t))) return sum + 1; // Partial match
        return sum;
      }, 0);
      
      const localized = pickFields(o, lang);
      return { ...o, score, ...localized };
    }).sort((a, b) => b.score - a.score || a.sort - b.sort);

    return new Response(
      JSON.stringify({
        ok: true,
        rows: scored.slice(0, 6),
        lang,
        tags
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in pwa-coaching-recommend:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
