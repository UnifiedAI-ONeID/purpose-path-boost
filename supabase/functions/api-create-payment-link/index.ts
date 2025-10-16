const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Package pricing (server-side source of truth)
const PACKAGE_PRICING: Record<string, { price: number; description: string }> = {
  discovery: { price: 0, description: 'Free Discovery Session' },
  single: { price: 200, description: 'Single Coaching Session' },
  monthly: { price: 800, description: 'Monthly Coaching Package (4 sessions)' },
  quarterly: { price: 2100, description: 'Quarterly Coaching Package (12 sessions)' }
};

// Rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxRequests) {
    return false;
  }
  
  limit.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    const { packageId, customerEmail, customerName, currency = 'USD', metadata } = await req.json();

    // Get server-side pricing (never trust client)
    const pkg = PACKAGE_PRICING[packageId];
    if (!pkg) {
      return new Response(
        JSON.stringify({ error: 'Invalid package' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const amount = pkg.price;

    // Return mock URL for development
    console.log('[DEV MODE] Returning mock payment URL');
    return new Response(
      JSON.stringify({
        id: 'mock_payment_link_' + Date.now(),
        url: `https://checkout.airwallex.com/drop-in.html?mock=true&amount=${amount}&currency=${currency}`,
        message: 'Development mode: Configure AIRWALLEX_API_KEY to use real payments',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Payment link creation error:', error.message || 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'Failed to create payment link' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
