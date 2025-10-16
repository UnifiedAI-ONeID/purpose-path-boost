import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-language, x-zg-device',
};

type Lang = 'en' | 'zh-CN' | 'zh-TW';

function getLang(req: Request): Lang {
  const url = new URL(req.url);
  const langParam = url.searchParams.get('lang');
  if (langParam === 'zh-CN' || langParam === 'zh-TW' || langParam === 'en') return langParam;
  
  const al = (req.headers.get('accept-language') || '').toLowerCase();
  if (al.startsWith('zh-tw') || al.includes('zh-hk')) return 'zh-TW';
  if (al.startsWith('zh')) return 'zh-CN';
  
  return 'en';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const lang = getLang(req);
    const url = new URL(req.url);
    const device = url.searchParams.get('device') || req.headers.get('x-zg-device') || '';

    let profile: any = null;
    if (device) {
      const { data } = await supabase
        .from('zg_profiles')
        .select('*')
        .eq('device_id', device)
        .maybeSingle();
        
      if (!data) {
        const { data: ins } = await supabase
          .from('zg_profiles')
          .insert({ device_id: device, locale: lang })
          .select()
          .single();
        profile = ins;
      } else {
        profile = data;
      }
    }

    const { data: questions } = await supabase
      .from('zg_quiz_questions')
      .select('key, order_no, title_en, title_zh_cn, title_zh_tw, choices:zg_quiz_choices(value, label_en, label_zh_cn, label_zh_tw, tag)')
      .eq('active', true)
      .order('order_no');

    return new Response(
      JSON.stringify({
        ok: true,
        lang,
        profile: profile ? {
          id: profile.id,
          locale: profile.locale,
          email: profile.email,
          name: profile.name
        } : null,
        quiz: questions || [],
        hero: {
          title_en: 'Grow with Clarity',
          title_zh_cn: '清晰成长',
          title_zh_tw: '清晰成長'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in pwa-boot:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
