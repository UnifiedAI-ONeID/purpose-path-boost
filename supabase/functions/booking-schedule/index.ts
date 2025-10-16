import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

const scheduleSchema = z.object({
  bookingToken: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  timezone: z.string().optional(),
  additionalNotes: z.string().max(500).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate input
    const body = await req.json();
    const validated = scheduleSchema.parse(body);

    console.log('[Booking Schedule] Processing token:', validated.bookingToken);

    // Get booking by token
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_token', validated.bookingToken)
      .maybeSingle();

    if (fetchError || !booking) {
      console.error('[Booking Schedule] Booking not found:', fetchError);
      return jsonResponse({ ok: false, error: 'Booking not found' }, 200);
    }

    // Verify booking is paid (or free)
    if (booking.payment_status !== 'paid') {
      return jsonResponse({ 
        ok: false,
        error: 'Payment required', 
        paymentStatus: booking.payment_status 
      }, 200);
    }

    // Check if already scheduled
    if (booking.cal_booking_id) {
      return jsonResponse({
        ok: false,
        error: 'Already scheduled',
        calBookingId: booking.cal_booking_id,
        meetingUrl: booking.meeting_url,
      }, 200);
    }

    // Create Cal.com booking via API
    const CAL_API_KEY = Deno.env.get('CAL_COM_API_KEY');
    if (!CAL_API_KEY) {
      console.error('[Booking Schedule] Cal.com API key not configured');
      return jsonResponse({ 
        ok: false,
        error: 'Scheduling service not configured' 
      }, 200);
    }

    // Call Cal.com API to create booking
    const calResponse = await fetch('https://api.cal.com/v1/bookings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventTypeId: parseInt(booking.cal_event_type_id) || booking.cal_event_type_id,
        start: validated.startTime,
        end: validated.endTime,
        timeZone: validated.timezone || 'America/Vancouver',
        responses: {
          name: booking.customer_name,
          email: booking.customer_email,
          notes: `${booking.booking_notes || ''}\n${validated.additionalNotes || ''}`.trim(),
          phone: booking.customer_phone || '',
        },
        metadata: {
          booking_id: booking.id,
          package_id: booking.package_id,
          ...(booking.booking_metadata as Record<string, unknown>),
        },
      }),
    });

    if (!calResponse.ok) {
      const error = await calResponse.text();
      console.error('[Booking Schedule] Cal.com API error:', error);
      return jsonResponse({ 
        ok: false,
        error: 'Failed to create booking', 
        details: error 
      }, 200);
    }

    const calBooking = await calResponse.json();
    console.log('[Booking Schedule] Cal.com booking created:', calBooking.id);

    // Update our booking record
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        cal_booking_id: String(calBooking.id),
        cal_uid: calBooking.uid,
        meeting_url: calBooking.metadata?.videoCallUrl || null,
        scheduled_start: validated.startTime,
        scheduled_end: validated.endTime,
        status: 'scheduled',
      })
      .eq('id', booking.id);

    if (updateError) {
      console.error('[Booking Schedule] Failed to update booking:', updateError);
      // Cal.com booking created but our DB update failed - log for manual resolution
    }

    return jsonResponse({
      ok: true,
      calBookingId: calBooking.id,
      calUid: calBooking.uid,
      meetingUrl: calBooking.metadata?.videoCallUrl || null,
      scheduledStart: validated.startTime,
      scheduledEnd: validated.endTime,
      message: 'Booking scheduled successfully',
    }, 200);

  } catch (error) {
    console.error('[Booking Schedule] Error:', error);

    if (error instanceof z.ZodError) {
      return jsonResponse({ 
        ok: false,
        error: 'Invalid input', 
        details: error.errors 
      }, 200);
    }

    return jsonResponse({ 
      ok: false,
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, 200);
  }
});
