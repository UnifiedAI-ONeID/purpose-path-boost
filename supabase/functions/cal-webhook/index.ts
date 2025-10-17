import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifyCalcomSignature } from '../_shared/webhook-security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cal-signature-256',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('CAL_COM_WEBHOOK_SECRET');
    if (webhookSecret) {
      const isValid = await verifyCalcomSignature(req, rawBody, webhookSecret);
      if (!isValid) {
        console.error('[Cal Webhook] Invalid signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('[Cal Webhook] No webhook secret configured - signature verification skipped');
    }

    const payload = JSON.parse(rawBody);
    console.log('Cal.com webhook received:', payload);

    // Handle different webhook events
    const { triggerEvent, payload: bookingData } = payload;

    if (!bookingData) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract booking details
    const booking = {
      cal_booking_id: String(bookingData.id || bookingData.uid),
      cal_uid: bookingData.uid,
      event_type_id: String(bookingData.eventTypeId),
      event_type_slug: bookingData.eventType?.slug || null,
      title: bookingData.title || bookingData.eventType?.title,
      start_time: bookingData.startTime,
      end_time: bookingData.endTime,
      attendee_name: bookingData.attendees?.[0]?.name || bookingData.responses?.name || 'Unknown',
      attendee_email: bookingData.attendees?.[0]?.email || bookingData.responses?.email || '',
      attendee_timezone: bookingData.attendees?.[0]?.timeZone || null,
      status: triggerEvent === 'BOOKING_CANCELLED' ? 'cancelled' : 
              triggerEvent === 'BOOKING_RESCHEDULED' ? 'rescheduled' : 'scheduled',
      meeting_url: bookingData.metadata?.videoCallUrl || null,
      location: bookingData.location || null,
      metadata: bookingData,
    };

    // Upsert booking (insert or update if exists)
    const { error: upsertError } = await supabase
      .from('cal_bookings')
      .upsert(booking, { onConflict: 'cal_booking_id' });

    if (upsertError) {
      console.error('[Cal Webhook] Error upserting booking:', upsertError);
      return new Response(JSON.stringify({ error: 'Unable to process booking' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, event: triggerEvent }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Cal Webhook] Error:', error);
    return new Response(JSON.stringify({ error: 'Unable to process webhook' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
