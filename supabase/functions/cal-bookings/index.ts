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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    );

    // Check admin
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (action === 'sync') {
      // Fetch bookings from Cal.com API
      const CAL_API_KEY = Deno.env.get('CAL_COM_API_KEY');
      if (!CAL_API_KEY) {
        return new Response(JSON.stringify({ error: 'Cal.com API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const calResponse = await fetch('https://api.cal.com/v1/bookings', {
        headers: {
          'Authorization': `Bearer ${CAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!calResponse.ok) {
        const error = await calResponse.text();
        console.error('Cal.com API error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch from Cal.com' }), {
          status: calResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const calData = await calResponse.json();
      const bookings = calData.bookings || [];

      // Sync to database
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      for (const booking of bookings) {
        const record = {
          cal_booking_id: String(booking.id),
          cal_uid: booking.uid,
          event_type_id: String(booking.eventTypeId),
          event_type_slug: booking.eventType?.slug || null,
          title: booking.title,
          start_time: booking.startTime,
          end_time: booking.endTime,
          attendee_name: booking.attendees?.[0]?.name || 'Unknown',
          attendee_email: booking.attendees?.[0]?.email || '',
          attendee_timezone: booking.attendees?.[0]?.timeZone || null,
          status: booking.status || 'scheduled',
          meeting_url: booking.metadata?.videoCallUrl || null,
          location: booking.location || null,
          metadata: booking,
        };

        await supabaseService.from('cal_bookings').upsert(record, { onConflict: 'cal_booking_id' });
      }

      return new Response(JSON.stringify({ success: true, synced: bookings.length }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default: list bookings from database
    const { data: bookings, error } = await supabase
      .from('cal_bookings')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(100);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ bookings }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
