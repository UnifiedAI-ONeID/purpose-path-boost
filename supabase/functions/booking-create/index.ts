import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const bookingSchema = z.object({
  packageId: z.enum(['discovery', 'single', 'monthly', 'quarterly']),
  customerName: z.string().trim().min(2).max(100),
  customerEmail: z.string().email().max(255),
  customerPhone: z.string().optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Package configurations with Cal.com event type IDs
const PACKAGES: Record<string, { 
  price: number; 
  currency: string; 
  description: string;
  calEventTypeId: string;
  duration: number; // minutes
}> = {
  discovery: { 
    price: 0, 
    currency: 'USD', 
    description: 'Free Discovery Session (30 min)',
    calEventTypeId: Deno.env.get('CAL_DISCOVERY_EVENT_TYPE_ID') || 'discovery',
    duration: 30
  },
  single: { 
    price: 200, 
    currency: 'USD', 
    description: 'Single Coaching Session (60 min)',
    calEventTypeId: Deno.env.get('CAL_SINGLE_EVENT_TYPE_ID') || 'single-session',
    duration: 60
  },
  monthly: { 
    price: 800, 
    currency: 'USD', 
    description: 'Monthly Package (4 sessions)',
    calEventTypeId: Deno.env.get('CAL_MONTHLY_EVENT_TYPE_ID') || 'monthly-package',
    duration: 60
  },
  quarterly: { 
    price: 2100, 
    currency: 'USD', 
    description: 'Quarterly Package (12 sessions)',
    calEventTypeId: Deno.env.get('CAL_QUARTERLY_EVENT_TYPE_ID') || 'quarterly-package',
    duration: 60
  }
};

function generateBookingToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

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
    const validated = bookingSchema.parse(body);

    const pkg = PACKAGES[validated.packageId];
    if (!pkg) {
      return new Response(JSON.stringify({ error: 'Invalid package' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate secure booking token
    const bookingToken = generateBookingToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        booking_token: bookingToken,
        customer_name: validated.customerName,
        customer_email: validated.customerEmail,
        customer_phone: validated.customerPhone || null,
        package_id: validated.packageId,
        amount_cents: pkg.price,
        currency: pkg.currency,
        cal_event_type_id: pkg.calEventTypeId,
        booking_notes: validated.notes || null,
        booking_metadata: validated.metadata || {},
        status: pkg.price === 0 ? 'paid' : 'pending',
        payment_status: pkg.price === 0 ? 'paid' : 'pending',
        paid_at: pkg.price === 0 ? new Date().toISOString() : null,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(JSON.stringify({ error: 'Failed to create booking' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[Booking Create] Created booking:', booking.id);

    // For free sessions, return booking token immediately
    if (pkg.price === 0) {
      return new Response(JSON.stringify({
        bookingToken,
        bookingId: booking.id,
        requiresPayment: false,
        message: 'Free session booking created. Proceed to schedule.',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For paid sessions, create payment link
    const AIRWALLEX_API_KEY = Deno.env.get('AIRWALLEX_API_KEY');
    const AIRWALLEX_CLIENT_ID = Deno.env.get('AIRWALLEX_CLIENT_ID');

    if (!AIRWALLEX_API_KEY || !AIRWALLEX_CLIENT_ID) {
      console.log('[Booking Create] Airwallex not configured, returning mock');
      return new Response(JSON.stringify({
        bookingToken,
        bookingId: booking.id,
        requiresPayment: true,
        paymentUrl: `https://checkout-mock.airwallex.com?amount=${pkg.price}&token=${bookingToken}`,
        message: 'Development mode: Mock payment link',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authenticate with Airwallex
    const authResponse = await fetch('https://api.airwallex.com/api/v1/authentication/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': AIRWALLEX_CLIENT_ID,
        'x-api-key': AIRWALLEX_API_KEY,
      },
    });

    if (!authResponse.ok) {
      throw new Error('Airwallex authentication failed');
    }

    const { token } = await authResponse.json();

    // Create payment link
    const [firstName, ...lastNameParts] = validated.customerName.split(' ');
    const lastName = lastNameParts.join(' ') || firstName;

    const paymentLinkResponse = await fetch('https://api.airwallex.com/api/v1/pa/payment_links/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: pkg.price,
        currency: pkg.currency,
        merchant_order_id: booking.id,
        customer: {
          email: validated.customerEmail,
          first_name: firstName,
          last_name: lastName,
        },
        reference_id: bookingToken,
        description: pkg.description,
        metadata: {
          booking_id: booking.id,
          booking_token: bookingToken,
          package_id: validated.packageId,
        },
        return_url: `${Deno.env.get('VITE_SITE_URL')}/book?token=${bookingToken}&payment=success`,
      }),
    });

    if (!paymentLinkResponse.ok) {
      const error = await paymentLinkResponse.json();
      console.error('Payment link creation failed:', error);
      throw new Error('Failed to create payment link');
    }

    const paymentLink = await paymentLinkResponse.json();

    // Update booking with payment ID
    await supabase
      .from('bookings')
      .update({ payment_id: paymentLink.id })
      .eq('id', booking.id);

    console.log('[Booking Create] Payment link created:', paymentLink.id);

    return new Response(JSON.stringify({
      bookingToken,
      bookingId: booking.id,
      requiresPayment: true,
      paymentUrl: paymentLink.url,
      expiresAt: expiresAt.toISOString(),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Booking Create] Error:', error);
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input', 
        details: error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
