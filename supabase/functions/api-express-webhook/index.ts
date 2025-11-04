import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { verifyAirwallexSignature } from '../_shared/webhook-security.ts';
import { isValidUUID } from '../_shared/validators.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-awx-signature',
};

const VALID_STATUSES = ['pending', 'paid', 'failed', 'refunded', 'cancelled'] as const;

function validateWebhookPayload(data: any): { valid: boolean; error?: string; validated?: any } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid payload format' };
  }

  const { order_id, payment_intent_id, status } = data;

  if (!order_id || typeof order_id !== 'string') {
    return { valid: false, error: 'order_id is required and must be a string' };
  }

  if (!isValidUUID(order_id)) {
    return { valid: false, error: 'order_id must be a valid UUID' };
  }

  if (payment_intent_id && typeof payment_intent_id !== 'string') {
    return { valid: false, error: 'payment_intent_id must be a string' };
  }

  if (payment_intent_id && payment_intent_id.length > 255) {
    return { valid: false, error: 'payment_intent_id exceeds maximum length of 255' };
  }

  const finalStatus = status || 'paid';
  if (!VALID_STATUSES.includes(finalStatus)) {
    return { valid: false, error: `status must be one of: ${VALID_STATUSES.join(', ')}` };
  }

  return {
    valid: true,
    validated: {
      order_id,
      payment_intent_id: payment_intent_id || null,
      status: finalStatus
    }
  };
}

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
    let bodyData;
    try {
      bodyData = JSON.parse(rawBody);
    } catch {
      console.error('[Express Webhook] Invalid JSON');
      return new Response(
        JSON.stringify({ ok: false, error: 'Invalid JSON payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validation = validateWebhookPayload(bodyData);
    if (!validation.valid) {
      console.error('[Express Webhook] Validation error:', validation.error);
      return new Response(
        JSON.stringify({ ok: false, error: validation.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const validated = validation.validated!;

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
