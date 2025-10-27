import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const userClient = createClient(supabaseUrl, token);
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: { user }, error: userError } = await (userClient.auth as any).getUser();
    
    if (!user || userError) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, tz, preferred_currency, avatar_url, interests } = await req.json();
    
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (tz !== undefined) updates.tz = tz;
    if (preferred_currency !== undefined) updates.preferred_currency = preferred_currency;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (interests !== undefined) updates.interests = interests;
    
    const { data: profile, error } = await serviceClient
      .from('zg_profiles')
      .update(updates)
      .eq('auth_user_id', user.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!profile) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pwa-me-update:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
