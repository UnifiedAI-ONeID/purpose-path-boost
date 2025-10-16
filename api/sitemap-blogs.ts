import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async (req:VercelRequest, res:VercelResponse)=>{
  try {
    const base = 'https://zhengrowth.com';
    const s = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
    
    const { data } = await s.from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('updated_at',{ascending:false})
      .limit(2000);
    
    const items = (data||[]).flatMap((p:any)=>{
      const urls = [
        `${base}/blog/${p.slug}`,
        `${base}/zh-CN/blog/${p.slug}`,
        `${base}/zh-TW/blog/${p.slug}`
      ];
      return urls.map(u => 
        `<url><loc>${u}</loc><lastmod>${new Date(p.updated_at||Date.now()).toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
      );
    });

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
