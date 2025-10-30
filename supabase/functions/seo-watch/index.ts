import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Source = { 
  key: string; 
  label: string; 
  enabled: boolean; 
  extra: any; 
};

async function fetchRSSBrief(url: string) {
  try {
    const r = await fetch(url, { 
      headers: { 
        'Accept': 'application/rss+xml, application/atom+xml, text/xml',
        'User-Agent': 'ZhenGrowth-SEO-Monitor/1.0'
      }
    });
    const xml = await r.text();
    
    // Light parse: pick first <item><title>,<link>,<pubDate>
    const t = (m: RegExp) => (xml.match(m)?.[1] || '').trim();
    return {
      title: t(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || t(/<item>[\s\S]*?<title>(.*?)<\/title>/i),
      link: t(/<item>[\s\S]*?<link>(.*?)<\/link>/i),
      date: t(/<item>[\s\S]*?<pubDate>(.*?)<\/pubDate>/i)
    };
  } catch (err) {
    console.error(`Failed to fetch RSS from ${url}:`, err);
    return null;
  }
}

const CHECKLIST_PAGES = ['/', '/home', '/coaching', '/events'];

async function runLocalChecks(base: string) {
  const out: any = { 
    robots: false, 
    sitemap: false, 
    pages: [] 
  };
  
  // Check robots.txt
  try {
    const r = await fetch(new URL('/robots.txt', base).toString(), { method: 'GET' });
    out.robots = r.ok;
  } catch (err) {
    console.error('Failed to check robots.txt:', err);
  }
  
  // Check sitemap.xml
  try {
    const r = await fetch(new URL('/sitemap.xml', base).toString(), { method: 'GET' });
    out.sitemap = r.ok;
  } catch (err) {
    console.error('Failed to check sitemap.xml:', err);
  }

  // Check key pages
  for (const p of CHECKLIST_PAGES) {
    const u = new URL(p, base).toString();
    let ok = false, hasOG = false, hasLD = false, hasLang = false;
    
    try {
      const r = await fetch(u, { method: 'GET' });
      ok = r.ok;
      
      if (ok) {
        const html = await r.text();
        hasOG = /<meta[^>]+property=["']og:/i.test(html);
        hasLD = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
        hasLang = /<html[^>]+lang=/i.test(html);
      }
    } catch (err) {
      console.error(`Failed to check page ${p}:`, err);
    }
    
    out.pages.push({ path: p, ok, hasOG, hasLD, hasLang });
  }
  
  return out;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, { global: { fetch } });
    
    const url = new URL(req.url);
    const base = Deno.env.get('PUBLIC_BASE_URL') || 'https://zhengrowth.com';

    console.log('Starting SEO watch scan...');

    // Get enabled sources
    const { data: sources, error: sourcesError } = await supabase
      .from('seo_watch_sources')
      .select('*')
      .eq('enabled', true);

    if (sourcesError) {
      console.error('Failed to fetch sources:', sourcesError);
      throw sourcesError;
    }

    console.log(`Found ${sources?.length || 0} enabled sources`);

    // 1) External news monitoring
    for (const s of (sources || [])) {
      if (s.key === 'google_search_central' && s.extra?.feed) {
        console.log('Checking Google Search Central feed...');
        const item = await fetchRSSBrief(s.extra.feed);
        
        if (item?.title) {
          // Check if alert already exists for this title in last 30 days
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: existing } = await supabase
            .from('seo_alerts')
            .select('id')
            .eq('title', `SEO update: ${item.title}`)
            .eq('source_key', s.key)
            .gte('created_at', thirtyDaysAgo)
            .maybeSingle();

          if (!existing) {
            console.log('Creating new alert for:', item.title);
            await supabase.from('seo_alerts').insert({
              severity: 'info',
              title: `SEO update: ${item.title}`,
              message: 'Review the change and adjust settings if needed.',
              source_key: s.key,
              action_url: item.link
            });
          }
        }
      }
      
      if (s.key === 'schema_dot_org' && s.extra?.feed) {
        console.log('Checking Schema.org changelog...');
        const item = await fetchRSSBrief(s.extra.feed);
        
        if (item?.title) {
          const { data: existing } = await supabase
            .from('seo_alerts')
            .select('id')
            .eq('title', `Schema.org: ${item.title}`)
            .eq('source_key', s.key)
            .maybeSingle();

          if (!existing) {
            console.log('Creating new schema alert for:', item.title);
            await supabase.from('seo_alerts').insert({
              severity: 'info',
              title: `Schema.org: ${item.title}`,
              message: 'Structured data types changed. Verify your JSON-LD.',
              source_key: s.key,
              action_url: item.link
            });
          }
        }
      }
      
      // Update last checked timestamp
      await supabase
        .from('seo_watch_sources')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('key', s.key);
    }

    // 2) Local site checks
    console.log('Running local site checks...');
    const chk = await runLocalChecks(base);
    
    // Save snapshot
    await supabase.from('seo_site_snapshots').insert({ checklist: chk });
    console.log('Saved snapshot');

    // Create alerts for issues found
    if (!chk.robots) {
      const { data: existing } = await supabase
        .from('seo_alerts')
        .select('id')
        .eq('title', 'robots.txt missing')
        .is('resolved_at', null)
        .maybeSingle();
        
      if (!existing) {
        await supabase.from('seo_alerts').insert({
          severity: 'critical',
          title: 'robots.txt missing',
          message: 'Search engines may not crawl correctly. Add /robots.txt.',
          source_key: 'local_check',
          action_url: '/admin/seo'
        });
      }
    }
    
    if (!chk.sitemap) {
      const { data: existing } = await supabase
        .from('seo_alerts')
        .select('id')
        .eq('title', 'sitemap.xml not reachable')
        .is('resolved_at', null)
        .maybeSingle();
        
      if (!existing) {
        await supabase.from('seo_alerts').insert({
          severity: 'warn',
          title: 'sitemap.xml not reachable',
          message: 'Submit sitemap to Search Console and ensure it\'s live.',
          source_key: 'local_check',
          action_url: '/admin/seo'
        });
      }
    }
    
    // Check each page
    for (const p of chk.pages) {
      if (!p.hasOG) {
        const title = `Missing OpenGraph on ${p.path}`;
        const { data: existing } = await supabase
          .from('seo_alerts')
          .select('id')
          .eq('title', title)
          .is('resolved_at', null)
          .maybeSingle();
          
        if (!existing) {
          await supabase.from('seo_alerts').insert({
            severity: 'warn',
            title,
            message: 'Add OG tags for better sharing/preview on social media.',
            source_key: 'local_check',
            action_url: '/admin/seo'
          });
        }
      }
      
      if (!p.hasLD) {
        const title = `Missing JSON-LD on ${p.path}`;
        const { data: existing } = await supabase
          .from('seo_alerts')
          .select('id')
          .eq('title', title)
          .is('resolved_at', null)
          .maybeSingle();
          
        if (!existing) {
          await supabase.from('seo_alerts').insert({
            severity: 'warn',
            title,
            message: 'Add structured data (Organization/Article/WebPage).',
            source_key: 'local_check',
            action_url: '/admin/seo'
          });
        }
      }
      
      if (!p.hasLang) {
        const title = `<html lang> missing on ${p.path}`;
        const { data: existing } = await supabase
          .from('seo_alerts')
          .select('id')
          .eq('title', title)
          .is('resolved_at', null)
          .maybeSingle();
          
        if (!existing) {
          await supabase.from('seo_alerts').insert({
            severity: 'warn',
            title,
            message: 'Set lang attribute for proper international SEO.',
            source_key: 'local_check',
            action_url: '/admin/seo'
          });
        }
      }
    }

    console.log('SEO watch scan completed successfully');

    return new Response(
      JSON.stringify({ ok: true, checklist: chk }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('SEO watch error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});