import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { verifyAirwallexSignature } from '../_shared/webhook-security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-awx-signature',
};

// Validation schema for webhook payload
const WebhookSchema = z.object({
  order_id: z.string().uuid({ message: 'Invalid order ID format' }),
  payment_intent_id: z.string().max(255).optional(),
  status: z.enum(['pending', 'paid', 'failed', 'refunded', 'cancelled']).default('paid')
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    );
  }

  try {
    const s = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature if secret is configured
    const webhookSecret = Deno.env.get('AIRWALLEX_WEBHOOK_SECRET');
    if (webhookSecret) {
      const isValid = await verifyAirwallexSignature(req, rawBody, webhookSecret);
      if (!isValid) {
        console.error('[Express Webhook] Signature verification failed');
        return new Response(
          JSON.stringify({ ok: false, error: 'Invalid webhook signature' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }
    } else {
      console.warn('[Express Webhook] No webhook secret configured - signature verification skipped');
    }
    
    // Parse and validate input
    let validated;
    try {
      const bodyData = JSON.parse(rawBody);
      validated = WebhookSchema.parse(bodyData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('[Express Webhook] Validation error:', error.errors);
        return new Response(
          JSON.stringify({ 
            ok: false, 
            error: 'Invalid input', 
            details: error.errors 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      throw error;
    }

    // Update order with validated data
    const { error: updateError } = await s
      .from('express_orders')
      .update({ 
        status: validated.status,
        airwallex_id: validated.payment_intent_id || null
      })
      .eq('id', validated.order_id);

    if (updateError) {
      console.error('[Express Webhook] Database error:', updateError);
      return new Response(
        JSON.stringify({ ok: false, error: 'Failed to update order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    console.log(`[Express Webhook] Order ${validated.order_id} updated to status: ${validated.status}`);
    
    return new Response(
      JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    console.error('[Express Webhook] Unexpected error:', e);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
