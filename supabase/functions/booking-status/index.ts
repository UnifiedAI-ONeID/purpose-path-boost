import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bookingToken = url.searchParams.get('token');

    if (!bookingToken) {
      return new Response(JSON.stringify({ error: 'Booking token required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_token', bookingToken)
      .maybeSingle();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return booking status (excluding sensitive payment details)
    return new Response(JSON.stringify({
      id: booking.id,
      status: booking.status,
      paymentStatus: booking.payment_status,
      packageId: booking.package_id,
      amountCents: booking.amount_cents,
      currency: booking.currency,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      scheduledStart: booking.scheduled_start,
      scheduledEnd: booking.scheduled_end,
      meetingUrl: booking.meeting_url,
      calBookingId: booking.cal_booking_id,
      expiresAt: booking.expires_at,
      createdAt: booking.created_at,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Booking Status] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
