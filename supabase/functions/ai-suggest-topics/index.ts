import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY not configured');
    }

    // Get past 90 days of metrics
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: metrics, error: metricsError } = await supabase
      .from('social_metrics')
      .select('*')
      .gte('captured_at', ninetyDaysAgo);

    if (metricsError) throw metricsError;

    // Get top performers by platform (top 5 by engagement)
    const engagementScore = (m: any) => (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0);
    
    const topByPlatform = (metrics || []).reduce((acc: any, m: any) => {
      (acc[m.platform] ||= []).push(m);
      return acc;
    }, {});

    for (const p in topByPlatform) {
      topByPlatform[p].sort((a: any, b: any) => engagementScore(b) - engagementScore(a));
      topByPlatform[p] = topByPlatform[p].slice(0, 5);
    }

    // Calculate summary stats
    const summary = (metrics || []).reduce((acc: any, r: any) => {
      acc.impressions = (acc.impressions || 0) + (r.impressions || 0);
      acc.engagements = (acc.engagements || 0) + engagementScore(r);
      acc.posts = (acc.posts || 0) + 1;
      return acc;
    }, { impressions: 0, engagements: 0, posts: 0 });

    const topPerformersContext = JSON.stringify(topByPlatform).slice(0, 4000);

    const prompt = `You are a social strategist for a bilingual life coaching brand (ZhenGrowth).

Past 90-day performance:
- Total Posts: ${summary.posts}
- Total Impressions: ${summary.impressions}
- Total Engagements: ${summary.engagements}

Top performers by platform (top 5 by engagement):
${topPerformersContext}

Based on what's working, generate:

1. **Blog/Article Titles** (8 titles in English + Chinese)
   - Focus on topics similar to top performers
   - Optimized for LinkedIn and Zhihu
   
2. **Short-form Video Hooks** (6 hooks ≤90 chars each)
   - Instagram Reels and YouTube Shorts
   - Attention-grabbing opening lines
   
3. **Tweet/X Thread Starters** (6 starters ≤220 chars)
   - Concise, engaging conversation starters
   
4. **Hashtag Sets**
   - LinkedIn (8 hashtags)
   - Instagram (15 hashtags)
   - Mix of English and Chinese
   
5. **Best Posting Windows**
   - Asia/Shanghai timezone (specific times)
   - America/Vancouver timezone (specific times)

Keep bullets concise. Avoid generic clichés. Focus on what has proven engagement.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a bilingual social media strategist specializing in life coaching and career development content.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const suggestions = aiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No suggestions generated';

    return new Response(JSON.stringify({ ok: true, topics: suggestions, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in ai-suggest-topics:', error);
    return new Response(JSON.stringify({ error: error.message, topics: '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
