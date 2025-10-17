import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyAirwallexSignature } from '../_shared/webhook-security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-airwallex-signature, x-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('AIRWALLEX_WEBHOOK_SECRET');
    if (webhookSecret) {
      const isValid = await verifyAirwallexSignature(req, rawBody, webhookSecret);
      if (!isValid) {
        console.error('[Payment Webhook] Invalid signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('[Payment Webhook] No webhook secret configured - signature verification skipped');
    }

    const payload = JSON.parse(rawBody);
    console.log('[Payment Webhook] Received:', payload);

    // Handle different payment events
    const { name: eventName, data } = payload;

    if (!data || !data.object) {
      console.error('[Payment Webhook] Invalid payload structure');
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentData = data.object;
    const bookingToken = paymentData.metadata?.booking_token || paymentData.reference_id;
    const paymentId = paymentData.id;

    if (!bookingToken) {
      console.error('[Payment Webhook] No booking token in payment metadata');
      return new Response(JSON.stringify({ error: 'Missing booking token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[Payment Webhook] Processing for booking token:', bookingToken);

    // Get booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_token', bookingToken)
      .maybeSingle();

    if (fetchError || !booking) {
      console.error('[Payment Webhook] Booking not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update booking based on payment event
    let updateData: Record<string, unknown> = {};

    switch (eventName) {
      case 'payment_intent.succeeded':
      case 'payment.succeeded':
        updateData = {
          payment_status: 'paid',
          payment_id: paymentId,
          paid_at: new Date().toISOString(),
          status: 'paid',
        };
        console.log('[Payment Webhook] Payment succeeded for booking:', booking.id);
        break;

      case 'payment_intent.payment_failed':
      case 'payment.failed':
        updateData = {
          payment_status: 'failed',
          payment_id: paymentId,
        };
        console.log('[Payment Webhook] Payment failed for booking:', booking.id);
        break;

      case 'refund.received':
        updateData = {
          payment_status: 'refunded',
          status: 'cancelled',
        };
        console.log('[Payment Webhook] Refund received for booking:', booking.id);
        break;

      default:
        console.log('[Payment Webhook] Unhandled event:', eventName);
        return new Response(JSON.stringify({ 
          received: true, 
          message: 'Event not processed' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', booking.id);

    if (updateError) {
      console.error('[Payment Webhook] Failed to update booking:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update booking' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[Payment Webhook] Booking updated successfully');

    return new Response(JSON.stringify({ 
      received: true,
      bookingId: booking.id,
      newStatus: updateData.status || booking.status,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Payment Webhook] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Unable to process webhook' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
