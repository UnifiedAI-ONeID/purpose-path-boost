import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-language',
};

type Lang = 'en' | 'zh-CN' | 'zh-TW';

function getLang(req: Request): Lang {
  const al = req.headers.get('accept-language') || '';
  if (al.includes('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.includes('zh')) return 'zh-CN';
  return 'en';
}

function detectCN(req: Request): boolean {
  const country = req.headers.get('cf-ipcountry') || req.headers.get('x-geo-country') || '';
  return ['CN', 'HK', 'MO', 'TW'].includes(country.toUpperCase());
}

async function fetchContext(supabase: any, profile_id: string) {
  const [{ data: goals }, { data: offers }] = await Promise.all([
    supabase.from('me_goals').select('title,status,progress,due_date').eq('profile_id', profile_id).order('updated_at', { ascending: false }).limit(5),
    supabase.from('coaching_offers').select('slug,title_en,tags,active,cal_event_type_slug,billing_type,base_price_cents,base_currency').eq('active', true)
  ]);
  
  return { goals: goals || [], offers: offers || [] };
}

function buildPrompt(ctx: any, lang: Lang): string {
  const goalLine = (ctx.goals || []).slice(0, 3).map((g: any) => `- ${g.title} (${g.status}, ${g.progress}%)`).join('\n') || '• (none)';
  const offerLine = (ctx.offers || []).map((o: any) => `${o.slug} :: ${o.title_en} :: [${(o.tags || []).join(',')}]`).join('\n');
  
  const locale = lang === 'zh-CN' ? '简体中文' : lang === 'zh-TW' ? '繁體中文' : 'English';
  
  return `You are ZhenGrowth's coaching concierge. Read the client context and return ONE specific next step that best advances their progress. Respond in ${locale}. Output only valid JSON with keys: "headline", "markdown", "action_url", "score".

Context:
- Top goals:
${goalLine}

- Available offers (slug :: title :: [tags]):
${offerLine}

Guidelines:
- If a paid offer matches goals, recommend booking that (link: /coaching/[slug]).
- If not ready for paid, recommend a discovery call (link: /coaching).
- Keep "headline" under 60 chars. "markdown" max 140 words, actionable steps (1–3 bullets).
- "score" 0..1 approximates fit.
- The "action_url" must be a relative link within our site (e.g., "/coaching/clarity-90").

Return ONLY the JSON object, no additional text.`;
}

async function lovableAISuggest(prompt: string): Promise<any> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  const txt = data.choices?.[0]?.message?.content || '';
  
  // Extract JSON from response
  const match = txt.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : JSON.parse(txt);
}

function cnHeuristic(ctx: any, lang: Lang) {
  const offers = ctx.offers || [];
  const goals = ctx.goals || [];
  
  // Simple scoring: match first active offer
  let best: any = offers[0];
  let bestScore = 0.5;
  
  if (best) {
    const headline = lang === 'en' ? `Book ${best.title_en}`
      : lang === 'zh-CN' ? `预约 ${best.title_en}`
      : `預約 ${best.title_en}`;
    
    const markdown = lang === 'en'
      ? `**Why this?** It matches your current focus.\n\n- Book a session this week\n- Add one note about what "success" looks like`
      : lang === 'zh-CN'
      ? `**为什么推荐？** 与你当前重点相符。\n\n- 本周预约一次会谈\n- 写下你对"成功"的一句话定义`
      : `**為什麼推薦？** 與你當前重點相符。\n\n- 本週預約一次會談\n- 寫下一句你對「成功」的定義`;
    
    return { headline, markdown, action_url: `/coaching/${best.slug}`, score: bestScore };
  }
  
  // Fallback to discovery call
  const headline = lang === 'en' ? 'Book a Discovery Call' : lang === 'zh-CN' ? '预约探索咨询' : '預約探索諮詢';
  const markdown = lang === 'en'
    ? `Not sure where to start? A 20-min discovery call helps map your next 4 weeks.`
    : lang === 'zh-CN'
    ? `不确定从哪里开始？20 分钟探索咨询帮你规划接下来的 4 周。`
    : `不確定從哪開始？20 分鐘探索諮詢幫你規劃接下來的 4 週。`;
  
  return { headline, markdown, action_url: '/coaching', score: 0.45 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { profile_id } = await req.json();
    if (!profile_id) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing profile_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lang = getLang(req);

    // Check flag & TTL
    const { data: flag } = await supabase
      .from('remote_flags')
      .select('value')
      .eq('key', 'ai_suggest')
      .maybeSingle();
    
    const enabled = !!flag?.value?.enabled;
    const ttlMin = Number(flag?.value?.ttl_minutes ?? 240);

    // Check cache
    const since = new Date(Date.now() - ttlMin * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('ai_suggestions_cache')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('suggestion_lang', lang)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);

    if (cached && cached[0]) {
      return new Response(
        JSON.stringify({ ok: true, cached: true, headline: 'Your next step', ...cached[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch context
    const ctx = await fetchContext(supabase, profile_id);

    // Generate suggestion
    let result: any;
    if (enabled && !detectCN(req)) {
      try {
        const prompt = buildPrompt(ctx, lang);
        result = await lovableAISuggest(prompt);
        console.log('AI suggestion generated:', result);
      } catch (err) {
        console.error('AI suggestion error:', err);
        result = cnHeuristic(ctx, lang);
      }
    } else {
      result = cnHeuristic(ctx, lang);
    }

    // Save to cache
    const { data: saved, error: saveErr } = await supabase
      .from('ai_suggestions_cache')
      .insert([{
        profile_id,
        suggestion_lang: lang,
        suggestion_md: result.markdown,
        action_url: result.action_url,
        score: result.score
      }])
      .select()
      .maybeSingle();

    if (saveErr) {
      console.error('[pwa-ai-suggest] Cache save error:', saveErr);
    }

    return new Response(
      JSON.stringify({ ok: true, cached: false, ...saved, headline: result.headline }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pwa-ai-suggest:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
