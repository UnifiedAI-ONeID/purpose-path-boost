const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const country = req.headers.get('x-vercel-ip-country') || '';
    const host = req.headers.get('host') || '';
    
    // Check if CN mode based on domain or country
    const cn = host.includes('.cn') || country === 'CN';
    const hasKey = !!Deno.env.get('GOOGLE_AI_API_KEY');
    
    return new Response(
      JSON.stringify({ 
        ok: true, 
        ai_enabled: true,
        has_key: hasKey, 
        cn_mode: cn, 
        timeout_ms: 15000, 
        cache_ttl_s: 3600 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('AI status error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
