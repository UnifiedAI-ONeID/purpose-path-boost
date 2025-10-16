import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type Lang = 'en' | 'zh-CN' | 'zh-TW';

function getLang(req: any): Lang {
  const q = (req.query?.lang || req.body?.lang || '').toString();
  if (q === 'zh-CN' || q === 'zh-TW' || q === 'en') return q as Lang;
  
  const al = (req.headers['accept-language'] || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const lang = getLang(req);
  const device = String(req.query.device || req.headers['x-zg-device'] || '');

  let profile: any = null;
  if (device) {
    const { data } = await s
      .from('zg_profiles')
      .select('*')
      .eq('device_id', device)
      .maybeSingle();
      
    if (!data) {
      const { data: ins } = await s
        .from('zg_profiles')
        .insert({ device_id: device, locale: lang })
        .select()
        .single();
      profile = ins;
    } else {
      profile = data;
    }
  }

  const { data: q } = await s
    .from('zg_quiz_questions')
    .select('key, order_no, title_en, title_zh_cn, title_zh_tw, choices:zg_quiz_choices(value, label_en, label_zh_cn, label_zh_tw, tag)')
    .eq('active', true)
    .order('order_no');

  res.status(200).json({
    ok: true,
    lang,
    profile: profile ? {
      id: profile.id,
      locale: profile.locale,
      email: profile.email,
      name: profile.name
    } : null,
    quiz: q || [],
    hero: {
      title_en: 'Grow with Clarity',
      title_zh_cn: '清晰成长',
      title_zh_tw: '清晰成長'
    }
  });
};
