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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get past 90 days of metrics
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: metrics, error: metricsError } = await supabase
      .from('social_metrics')
      .select('*')
      .gte('captured_at', ninetyDaysAgo);

    if (metricsError) throw metricsError;

    // Summarize metrics
    const summary = (metrics || []).reduce((acc: any, r: any) => {
      acc.impressions = (acc.impressions || 0) + (r.impressions || 0);
      acc.engagements = (acc.engagements || 0) + ((r.likes || 0) + (r.comments || 0) + (r.shares || 0) + (r.saves || 0));
      acc.posts = (acc.posts || 0) + 1;
      return acc;
    }, { impressions: 0, engagements: 0, posts: 0 });

    const prompt = `You are a social strategist for a bilingual life coaching brand (ZhenGrowth).

Given past 90-day metrics:
- Total Posts: ${summary.posts}
- Total Impressions: ${summary.impressions}
- Total Engagements: ${summary.engagements}

Please suggest content ideas optimized for both English and Chinese audiences across LinkedIn, Instagram, and Chinese platforms (Zhihu, RED, WeChat):

1. **Blog/Article Titles** (8 titles in English + Chinese)
   - Topics that resonate with career development and life clarity
   
2. **Short-form Video Hooks** (6 hooks for Instagram Reels & YouTube Shorts)
   - Attention-grabbing opening lines
   
3. **Hashtags** (10 for LinkedIn, 10 for Instagram)
   - Mix of English and Chinese hashtags
   
4. **Best Posting Times**
   - Optimal times for Asia/Shanghai timezone
   - Optimal times for America/Vancouver timezone

Keep answers concise and actionable in bullet format.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a bilingual social media strategist specializing in life coaching and career development content.' },
          { role: 'user', content: prompt }
        ],
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
    const suggestions = aiData.choices?.[0]?.message?.content || 'No suggestions generated';

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
