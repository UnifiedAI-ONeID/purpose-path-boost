import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const userClient = createClient(
      supabaseUrl, 
      supabaseAnonKey,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey, { global: { fetch } });
    
    const { data: { user }, error: userError } = await (userClient.auth as any).getUser();
    
    if (!user || userError) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid auth token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile
    const { data: profile } = await serviceClient
      .from('zg_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch analytics data in parallel
    const [sessionsRes, receiptsRes, goalsRes] = await Promise.all([
      serviceClient.from('me_sessions').select('id,start_at,end_at').eq('profile_id', profile.id),
      serviceClient.from('me_receipts').select('amount_cents,currency,created_at').eq('profile_id', profile.id),
      serviceClient.from('me_goals').select('status,progress').eq('profile_id', profile.id)
    ]);

    const sessions = sessionsRes.data || [];
    const receipts = receiptsRes.data || [];
    const goals = goalsRes.data || [];

    // Calculate metrics
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, session) => {
      if (!session.start_at || !session.end_at) return sum;
      const diff = new Date(session.end_at).getTime() - new Date(session.start_at).getTime();
      return sum + Math.max(0, diff / 60000);
    }, 0);

    const totalSpendUsd = receipts.reduce((sum, receipt) => {
      if (receipt.currency === 'USD') {
        return sum + (receipt.amount_cents / 100);
      }
      return sum;
    }, 0);

    const goalsCompleted = goals.filter(g => g.status === 'done').length;
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;

    return new Response(
      JSON.stringify({
        ok: true,
        tiles: {
          total_sessions: totalSessions,
          total_minutes: Math.round(totalMinutes),
          total_spend_usd: totalSpendUsd,
          goals_completed: goalsCompleted,
          avg_progress: avgProgress
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in pwa-me-analytics:', error);
    return new Response(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
