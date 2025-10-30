import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt secret
async function decryptSecret(encrypted: { iv: ArrayBuffer; value: ArrayBuffer }): Promise<string> {
  const masterKey = Deno.env.get('MASTER_KEY');
  if (!masterKey) throw new Error('MASTER_KEY not configured');

  const keyData = Uint8Array.from(atob(masterKey), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', keyData, 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(encrypted.iv) },
    key,
    encrypted.value
  );
  return new TextDecoder().decode(decrypted);
}

async function getSecret(supabase: any, key: string): Promise<string> {
  const { data, error } = await supabase
    .from('secrets')
    .select('value, iv')
    .eq('key', key)
    .maybeSingle();
  
  if (error) {
    console.error(`[getSecret] Error fetching ${key}:`, error);
    throw new Error(`Secret ${key} query failed`);
  }
  if (!data) throw new Error(`Secret ${key} not found`);
  return await decryptSecret({ iv: data.iv, value: data.value });
}

async function fetchLinkedInMetrics(supabase: any, urn: string) {
  const token = await getSecret(supabase, 'LINKEDIN_ACCESS_TOKEN');
  // LinkedIn analytics API - simplified version
  // Real implementation would use specific analytics endpoints
  return { impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0, saves: 0, video_views: 0, followers: null };
}

async function fetchFacebookMetrics(supabase: any, postId: string) {
  const token = await getSecret(supabase, 'FACEBOOK_PAGE_ACCESS_TOKEN');
  
  try {
    const metricsUrl = `https://graph.facebook.com/v19.0/${postId}?fields=insights.metric(post_impressions,post_clicks,post_reactions_like_total,post_engaged_users),likes.summary(true),comments.summary(true),shares`;
    const resp = await fetch(`${metricsUrl}&access_token=${token}`);
    const data = await resp.json();
    
    return {
      impressions: data.insights?.data?.find((i: any) => i.name === 'post_impressions')?.values?.[0]?.value || 0,
      clicks: data.insights?.data?.find((i: any) => i.name === 'post_clicks')?.values?.[0]?.value || 0,
      likes: data.likes?.summary?.total_count || 0,
      comments: data.comments?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      saves: null,
      video_views: 0,
      followers: null
    };
  } catch (e) {
    console.error('FB metrics error:', e);
    return { impressions: 0, clicks: 0, likes: 0, comments: 0, shares: 0, saves: 0, video_views: 0, followers: null };
  }
}

async function fetchInstagramMetrics(supabase: any, mediaId: string) {
  const token = await getSecret(supabase, 'INSTAGRAM_GRAPH_TOKEN');
  
  try {
    const insightsUrl = `https://graph.facebook.com/v19.0/${mediaId}/insights?metric=impressions,reach,saved,likes,comments&access_token=${token}`;
    const resp = await fetch(insightsUrl);
    const data = await resp.json();
    
    const getValue = (name: string) => data.data?.find((i: any) => i.name === name)?.values?.[0]?.value || 0;
    
    return {
      impressions: getValue('impressions'),
      clicks: null,
      likes: getValue('likes'),
      comments: getValue('comments'),
      shares: null,
      saves: getValue('saved'),
      video_views: 0,
      followers: null
    };
  } catch (e) {
    console.error('IG metrics error:', e);
    return { impressions: 0, clicks: null, likes: 0, comments: 0, shares: null, saves: 0, video_views: 0, followers: null };
  }
}

async function fetchXMetrics(supabase: any, tweetId: string) {
  const token = await getSecret(supabase, 'X_BEARER_TOKEN');
  
  try {
    const metricsUrl = `https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics`;
    const resp = await fetch(metricsUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    const metrics = data.data?.public_metrics || {};
    
    return {
      impressions: metrics.impression_count || 0,
      clicks: null,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      saves: null,
      video_views: 0,
      followers: null
    };
  } catch (e) {
    console.error('X metrics error:', e);
    return { impressions: 0, clicks: null, likes: 0, comments: 0, shares: 0, saves: null, video_views: 0, followers: null };
  }
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

    // Get recently posted items
    const { data: posted, error: fetchError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'posted')
      .order('posted_at', { ascending: false })
      .limit(200);

    if (fetchError) throw fetchError;

    const results: any[] = [];

    for (const post of (posted || [])) {
      try {
        let metrics: any = null;

        if (post.platform === 'linkedin') {
          metrics = await fetchLinkedInMetrics(supabase, post.platform_post_id);
        } else if (post.platform === 'facebook') {
          metrics = await fetchFacebookMetrics(supabase, post.platform_post_id);
        } else if (post.platform === 'instagram') {
          metrics = await fetchInstagramMetrics(supabase, post.platform_post_id);
        } else if (post.platform === 'x') {
          metrics = await fetchXMetrics(supabase, post.platform_post_id);
        }

        if (metrics) {
          await supabase.from('social_metrics').insert({
            platform: post.platform,
            platform_post_id: post.platform_post_id,
            ...metrics
          });
          results.push({ id: post.id, ok: true });
        }
      } catch (e: any) {
        console.error(`Error collecting metrics for ${post.id}:`, e);
        results.push({ id: post.id, ok: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ ok: true, count: results.length, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in social-metrics-collect:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
