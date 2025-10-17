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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const lang = getLang(req);
    const url = new URL(req.url);
    const device = url.searchParams.get('device') || req.headers.get('x-zg-device') || '';
    const authHeader = req.headers.get('authorization');

    // Check if user is authenticated
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const userClient = createClient(supabaseUrl, token);
      
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      
      if (user && !userError) {
        // Get authenticated profile
        const { data: profile } = await serviceClient
          .from('zg_profiles')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        // Merge anonymous profile if device ID provided
        if (device && profile) {
          const { data: anonProfile } = await serviceClient
            .from('zg_profiles')
            .select('*')
            .eq('device_id', device)
            .is('auth_user_id', null)
            .maybeSingle();
          
          if (anonProfile && anonProfile.id !== profile.id) {
            // Merge data from anonymous profile to authenticated profile
            await Promise.allSettled([
              serviceClient.from('me_goals').update({ profile_id: profile.id }).eq('profile_id', anonProfile.id),
              serviceClient.from('me_notes').update({ profile_id: profile.id }).eq('profile_id', anonProfile.id),
              serviceClient.from('me_sessions').update({ profile_id: profile.id }).eq('profile_id', anonProfile.id),
              serviceClient.from('me_receipts').update({ profile_id: profile.id }).eq('profile_id', anonProfile.id)
            ]);
            
            // Delete anonymous profile
            await serviceClient.from('zg_profiles').delete().eq('id', anonProfile.id);
            
            // Update authenticated profile with device ID
            await serviceClient.from('zg_profiles').update({ device_id: device }).eq('id', profile.id);
          }
        }
        
        // Fetch quiz questions
        const { data: questions } = await anonClient
          .from('zg_quiz_questions')
          .select('key, order_no, title_en, title_zh_cn, title_zh_tw, choices:zg_quiz_choices(value, label_en, label_zh_cn, label_zh_tw, tag)')
          .eq('active', true)
          .order('order_no');
        
        return new Response(
          JSON.stringify({
            ok: true,
            lang,
            authed: true,
            profile: {
              id: profile?.id,
              email: user.email,
              name: profile?.name,
              locale: profile?.locale,
              tz: profile?.tz,
              preferred_currency: profile?.preferred_currency,
              avatar_url: profile?.avatar_url
            },
            quiz: questions || [],
            hero: {
              title_en: 'Grow with Clarity',
              title_zh_cn: '清晰成长',
              title_zh_tw: '清晰成長'
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Anonymous user
    let profile: any = null;
    if (device) {
      const { data } = await anonClient
        .from('zg_profiles')
        .select('*')
        .eq('device_id', device)
        .is('auth_user_id', null)
        .maybeSingle();
        
      if (!data) {
        const { data: ins } = await serviceClient
          .from('zg_profiles')
          .insert({ device_id: device, locale: lang })
          .select()
          .single();
        profile = ins;
      } else {
        profile = data;
      }
    }

    const { data: questions } = await anonClient
      .from('zg_quiz_questions')
      .select('key, order_no, title_en, title_zh_cn, title_zh_tw, choices:zg_quiz_choices(value, label_en, label_zh_cn, label_zh_tw, tag)')
      .eq('active', true)
      .order('order_no');

    return new Response(
      JSON.stringify({
        ok: true,
        lang,
        authed: false,
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
