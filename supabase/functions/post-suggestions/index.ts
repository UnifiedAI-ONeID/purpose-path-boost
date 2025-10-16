import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: compute trends for AI prompt
function computeTrends(rows: any[]) {
  const byTag: Record<string, any[]> = {};
  for (const r of rows) {
    (byTag[r.tag] ||= []).push(r);
  }
  
  const tagSumm = Object.entries(byTag).map(([tag, arr]) => {
    const posts = arr.reduce((a, b) => a + (b.post_count || 0), 0);
    const imp = arr.reduce((a, b) => a + (b.impressions || 0), 0);
    const eng = arr.reduce((a, b) => a + (b.engagements || 0), 0);
    const er = imp ? (eng * 100) / imp : 0;
    const recent = arr.slice(-2).map((x) => x.er_pct || 0);
    const momentum = recent.length === 2 ? recent[1] - recent[0] : 0;
    return {
      tag,
      posts,
      imp,
      eng,
      er: +er.toFixed(2),
      momentum: +momentum.toFixed(2),
    };
  }).sort((a, b) => b.momentum - a.momentum || b.er - a.er || b.imp - a.imp);

  return tagSumm;
}

// Fallback heuristic suggestions
function heuristic(title: string, tags: string[]) {
  const primaryTag = (tags[0] || 'clarity').toLowerCase();
  return {
    headlines: [
      { en: `${title || 'Clarity to Action'}: 3 steps to your next win`, zh: '從清晰到行動：三步拿下下一個小勝利' },
      { en: 'Break the fog: a 10-minute clarity ritual', zh: '打破迷霧：10分鐘清晰儀式' },
      { en: 'Confidence is a verb: practice, don\'t wait', zh: '自信是動詞：先實踐，再等待' },
    ],
    hooks: [
      'If you had 10 minutes today, do this:',
      'One tiny habit that compounds clarity → confidence → results:',
      'The reason your plan stalls (and how to unstick it):',
    ],
    hashtags: {
      linkedin: ['#LifeCoaching', '#Clarity', '#Confidence', '#WomenInLeadership', '#CareerGrowth', '#ZhenGrowth'],
      instagram: ['#LifeDesign', '#Mindset', '#Clarity', '#Confidence', '#SmallWins', '#ZhenGrowth'],
      x: ['#Clarity', '#Mindset', '#Coaching', '#SmallWins'],
    },
    when: {
      'Asia/Shanghai': ['Tue 12:00-14:00', 'Thu 19:00-21:00', 'Sat 10:00-12:00'],
      'America/Vancouver': ['Tue 08:00-10:00', 'Wed 12:00-14:00', 'Sun 17:00-19:00'],
    },
    channels: ['linkedin', 'instagram', 'facebook', 'x'],
    images: [
      { idea: 'Title big + emoji watermark for tag', size: 'linkedin' },
      { idea: 'Portrait 1080x1350 with 3 bullets', size: 'ig_portrait' },
      { idea: 'Story 1080x1920 with CTA "Free Call"', size: 'story' },
    ],
    cta: ['Book Free Call', 'Take 3-min Clarity Quiz'],
    why: `Boost #${primaryTag}: trending tag shows strong engagement.`,
  };
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

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY');
    const body = await req.json();
    const { slug = '', title = '', excerpt = '', tags = [] } = body;

    console.log('Generating suggestions for:', title);

    // Pull last 90d tag performance
    const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const { data: perf } = await supabase
      .from('v_tag_performance')
      .select('*')
      .gte('week_start', since)
      .limit(2000);

    const trends = computeTrends(perf || []);
    const primaryTag = (tags[0] || '').toLowerCase();

    // If no AI key, return heuristic
    if (!GOOGLE_AI_API_KEY) {
      console.log('No AI key, using heuristic');
      return new Response(
        JSON.stringify({ ok: true, source: 'heuristic', suggestions: heuristic(title, tags) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build AI prompt
    const prompt = `You are a bilingual social strategist for a life coaching brand (ZhenGrowth).

Generate content suggestions for this blog post:
Title: ${title}
Excerpt: ${excerpt}
Tags: ${JSON.stringify(tags)}

Last 90 days tag performance (sorted by momentum then ER%):
${JSON.stringify(trends.slice(0, 15))}

Return STRICT JSON with these keys:
- headlines: Array of 6-8 objects with {en: string, zh: string} (bilingual titles, ≤70 chars each)
- hooks: Array of 6-8 strings (engaging opening lines, ≤120 chars each)
- hashtags: Object with {linkedin: string[], instagram: string[], x: string[]} (LinkedIn≤8, Instagram≤15, X≤6, mix EN/中文)
- when: Object with {"Asia/Shanghai": string[], "America/Vancouver": string[]} (3-5 optimal posting windows per region)
- channels: Array of strings (recommend 3-5 platforms where this would perform best)
- images: Array of 3-5 objects with {idea: string, size: string} (cover image ideas, sizes: linkedin, facebook, x, ig_square, ig_portrait, story)
- cta: Array of 2-3 strings (call-to-action phrases for coaching funnels)
- why: string (brief explanation of why these suggestions based on trends)

Keep tone warm, practical, non-hype. Return ONLY the JSON object, no markdown.`;

    const aiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!aiResp.ok) {
      console.error('AI gateway error:', aiResp.status);
      return new Response(
        JSON.stringify({ ok: true, source: 'heuristic-ai-error', suggestions: heuristic(title, tags) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResp.json();
    const text = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to parse JSON from response
    let suggestions: any = null;
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      return new Response(
        JSON.stringify({ ok: true, source: 'heuristic-parse-error', suggestions: heuristic(title, tags) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, source: 'ai', suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in post-suggestions:', error);
    return new Response(
      JSON.stringify({ ok: true, source: 'heuristic-error', suggestions: heuristic('', []) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
