import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateProfileRequest {
  userId: string;
  email: string;
  name?: string;
  locale?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, name, locale = 'en' }: CreateProfileRequest = await req.json();

    console.log('[api-auth-create-profile] Creating profile for user:', userId);

    // Use service role to bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if profile already exists (idempotency)
    const { data: existing } = await supabase
      .from('zg_profiles')
      .select('id')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (existing) {
      console.log('[api-auth-create-profile] Profile already exists:', userId);
      return new Response(
        JSON.stringify({ ok: true, profile: existing, message: 'Profile already exists' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Create profile
    const { data: profile, error } = await supabase
      .from('zg_profiles')
      .insert({
        auth_user_id: userId,
        locale,
        name: name || email,
        email
      })
      .select()
      .single();

    if (error) {
      console.error('[api-auth-create-profile] Profile creation error:', error);
      throw error;
    }

    console.log('[api-auth-create-profile] Profile created successfully:', profile.id);

    return new Response(
      JSON.stringify({ ok: true, profile }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('[api-auth-create-profile] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ ok: false, error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
