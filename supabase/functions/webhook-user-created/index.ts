import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { type, record } = payload;
    
    console.log('[webhook-user-created] Received event:', { type, userId: record?.id });

    // Only handle INSERT events
    if (type !== 'INSERT') {
      return new Response(
        JSON.stringify({ ok: true, message: 'Not an INSERT event' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if profile already exists (idempotency)
    const { data: existing } = await supabase
      .from('zg_profiles')
      .select('id')
      .eq('auth_user_id', record.id)
      .maybeSingle();

    if (existing) {
      console.log('[webhook-user-created] Profile already exists:', record.id);
      return new Response(
        JSON.stringify({ ok: true, message: 'Profile already exists' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from('zg_profiles')
      .insert({
        auth_user_id: record.id,
        locale: 'en',
        name: record.raw_user_meta_data?.full_name || record.email,
        email: record.email
      })
      .select()
      .single();

    if (error) {
      console.error('[webhook-user-created] Profile creation error:', error);
      throw error;
    }

    console.log('[webhook-user-created] Profile created successfully:', profile.id);

    return new Response(
      JSON.stringify({ ok: true, profile }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[webhook-user-created] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
