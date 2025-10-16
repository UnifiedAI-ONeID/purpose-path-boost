import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async (req:VercelRequest, res:VercelResponse)=>{
  try {
    const base = 'https://zhengrowth.com';
    const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
    
    const { data } = await s.from('events')
      .select('slug, created_at')
      .eq('status','published')
      .order('created_at',{ascending:false})
      .limit(2000);
    
    const items = (data||[]).map((e:any)=> 
      `<url><loc>${base}/events/${e.slug}</loc><lastmod>${new Date(e.created_at||Date.now()).toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</urlset>`;
    
    res.setHeader('Content-Type','application/xml');
    res.status(200).send(xml);
  } catch(e:any) {
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
  }
};
