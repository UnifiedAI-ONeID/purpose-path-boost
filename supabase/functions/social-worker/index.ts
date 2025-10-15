import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decrypt secret using master key
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
    .single();
  
  if (error || !data) throw new Error(`Secret ${key} not found`);
  return await decryptSecret({ iv: data.iv, value: data.value });
}

async function postToLinkedIn(supabase: any, job: any) {
  const token = await getSecret(supabase, 'LINKEDIN_ACCESS_TOKEN');
  
  // Get user info
  const meResp = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const me = await meResp.json();
  const author = `urn:li:person:${me.sub}`;

  const body = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: job.message },
        shareMediaCategory: 'ARTICLE',
        media: [{
          status: 'READY',
          originalUrl: `https://zhengrowth.com/blog/${job.blog_slug}`,
          title: { text: job.message.split('\n')[0] }
        }]
      }
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
  };

  const resp = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`LinkedIn error: ${text}`);
  }

  const data = await resp.json();
  return { id: data.id };
}

async function postToFacebook(supabase: any, job: any) {
  const pageId = await getSecret(supabase, 'FACEBOOK_PAGE_ID');
  const token = await getSecret(supabase, 'FACEBOOK_PAGE_ACCESS_TOKEN');

  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/feed`;
  const params = new URLSearchParams({
    link: `https://zhengrowth.com/blog/${job.blog_slug}`,
    message: job.message,
    access_token: token
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error?.message || 'FB post failed');
  return { id: data.id };
}

async function postToInstagram(supabase: any, job: any) {
  const igId = await getSecret(supabase, 'INSTAGRAM_BUSINESS_ID');
  const token = await getSecret(supabase, 'INSTAGRAM_GRAPH_TOKEN');
  const mediaUrl = job.media?.[0]?.url || 'https://zhengrowth.com/og-default.jpg';

  // Create container
  const createUrl = new URL(`https://graph.facebook.com/v19.0/${igId}/media`);
  createUrl.searchParams.set('image_url', mediaUrl);
  createUrl.searchParams.set('caption', job.message.slice(0, 2200));
  createUrl.searchParams.set('access_token', token);

  const createResp = await fetch(createUrl, { method: 'POST' });
  const created = await createResp.json();
  if (!created.id) throw new Error(created.error?.message || 'IG create failed');

  // Publish
  const pubUrl = new URL(`https://graph.facebook.com/v19.0/${igId}/media_publish`);
  pubUrl.searchParams.set('creation_id', created.id);
  pubUrl.searchParams.set('access_token', token);

  const pubResp = await fetch(pubUrl, { method: 'POST' });
  const published = await pubResp.json();
  if (!published.id) throw new Error(published.error?.message || 'IG publish failed');
  
  return { id: published.id };
}

async function postToX(supabase: any, job: any) {
  const token = await getSecret(supabase, 'X_BEARER_TOKEN');
  const text = job.message.slice(0, 260) + `\n\nhttps://zhengrowth.com/blog/${job.blog_slug}`;

  const resp = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || JSON.stringify(data));
  return { id: data.data?.id };
}

async function makeExportZip(job: any): Promise<string> {
  // For Chinese platforms, create a download package
  // This would contain formatted text, images, etc for manual upload
  // For now, return a placeholder
  return `export-${job.platform}-${job.blog_slug}.zip`;
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

    // Get queued posts
    const { data: jobs, error: fetchError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('status', 'queued')
      .order('created_at')
      .limit(10);

    if (fetchError) throw fetchError;

    const results: any[] = [];

    for (const job of (jobs || [])) {
      try {
        let result: any = null;

        if (job.platform === 'linkedin') {
          result = await postToLinkedIn(supabase, job);
        } else if (job.platform === 'facebook') {
          result = await postToFacebook(supabase, job);
        } else if (job.platform === 'instagram') {
          result = await postToInstagram(supabase, job);
        } else if (job.platform === 'x') {
          result = await postToX(supabase, job);
        } else if (['wechat', 'red', 'zhihu', 'douyin'].includes(job.platform)) {
          result = { id: await makeExportZip(job) };
        }

        await supabase
          .from('social_posts')
          .update({
            status: 'posted',
            platform_post_id: result?.id,
            posted_at: new Date().toISOString()
          })
          .eq('id', job.id);

        results.push({ id: job.id, ok: true });
      } catch (e: any) {
        console.error(`Error posting to ${job.platform}:`, e);
        await supabase
          .from('social_posts')
          .update({ status: 'failed', error: e.message })
          .eq('id', job.id);
        
        results.push({ id: job.id, ok: false, error: e.message });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in social-worker:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
