import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const { 
      slug, 
      title, 
      excerpt = '', 
      tags = [], 
      platforms = ['linkedin', 'facebook', 'instagram', 'x'], 
      lang = 'en', 
      theme = 'light' 
    } = await req.json();

    if (!slug || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing slug/title' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Simple scheduling: next few days at optimal times
    const now = new Date();
    const schedules: Record<string, Date | null> = {};
    platforms.forEach((p: string, i: number) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(p === 'x' ? 12 : p === 'linkedin' ? 9 : 14);
      date.setMinutes(0);
      schedules[p] = date;
    });

    // Generate social media URLs
    const baseUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/social-images/${slug}`;
    function imgFor(p: string) {
      if (p === 'instagram') return `${baseUrl}/ig_portrait.png`;
      if (p === 'x') return `${baseUrl}/x.png`;
      if (p === 'facebook') return `${baseUrl}/facebook.png`;
      return `${baseUrl}/linkedin.png`;
    }

    // Insert queued social_posts with scheduled_at
    const rows = platforms.map((p: string) => {
      const scheduledDate = schedules[p];
      
      return {
        blog_slug: slug,
        platform: p,
        status: 'queued',
        message: `${title}\n\n${excerpt}\n\n#${tags.join(' #')}`,
        media: [{ type: 'image', url: imgFor(p) }],
        tags,
        primary_tag: tags[0] || null,
        scheduled_at: scheduledDate ? scheduledDate.toISOString() : null
      };
    });

    const { error } = await supabase.from('social_posts').insert(rows);
    if (error) throw error;

    return new Response(
      JSON.stringify({
        ok: true,
        headline: title,
        schedules: Object.fromEntries(
          Object.entries(schedules).map(([k, v]) => [k, v ? v.toISOString() : null])
        ),
        source: 'heuristic'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('Plan error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
