import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bookingToken = url.searchParams.get('token');

    if (!bookingToken) {
      return jsonResponse({ ok: false, error: 'Booking token required' }, 200);
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
      return jsonResponse({ ok: false, error: 'Booking not found' }, 200);
    }

    // Return booking status (excluding sensitive payment details)
    return jsonResponse({
      ok: true,
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
    }, 200);

  } catch (error) {
    console.error('[Booking Status] Error:', error);
    return jsonResponse({ 
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 200);
  }
});
