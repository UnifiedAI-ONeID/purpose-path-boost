import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse({ ok: false, error: 'Invalid token' }, 401);
    }

    const { subscription, device_id } = await req.json();
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return jsonResponse({ ok: false, error: 'Invalid subscription data' }, 400);
    }

    // Get profile
    const { data: profile } = await supabase
      .from('zg_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return jsonResponse({ ok: false, error: 'Profile not found' }, 404);
    }

    // Upsert subscription
    const { error: upsertError } = await supabase
      .from('push_subscriptions')
      .upsert({
        profile_id: profile.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        device_id: device_id || null,
        user_agent: req.headers.get('user-agent') || null,
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'profile_id,endpoint'
      });

    if (upsertError) {
      console.error('[pwa-push-subscribe] Upsert error:', upsertError);
      return jsonResponse({ ok: false, error: 'Failed to save subscription' }, 500);
    }

    return jsonResponse({ ok: true });
  } catch (error) {
    console.error('[pwa-push-subscribe] Error:', error);
    return jsonResponse({ ok: false, error: 'Internal server error' }, 500);
  }
});
