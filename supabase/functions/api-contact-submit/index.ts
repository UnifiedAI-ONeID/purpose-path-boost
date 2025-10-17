import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders, jsonResponse } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 200);
  }

  try {
    const body = await req.json();
    const { name, email, subject, message, phone, company } = body;

    if (!name || !email || !message) {
      return jsonResponse({ ok: false, error: 'Missing required fields' }, 200);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    // Store contact form submission
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert([{
        name,
        email,
        subject: subject || 'Contact Form',
        message,
        phone: phone || null,
        company: company || null,
        submitted_at: new Date().toISOString()
      }]);

    if (insertError) {
      console.error('[api-contact-submit] Insert error:', insertError);
      return jsonResponse({ ok: false, error: 'Failed to submit contact form' }, 200);
    }

    // TODO: Send email notification via Resend if configured
    // const resendKey = Deno.env.get('RESEND_API_KEY');
    // if (resendKey) { ... }

    return jsonResponse({ ok: true, message: 'Contact form submitted successfully' }, 200);
  } catch (error) {
    console.error('[api-contact-submit] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return jsonResponse({ ok: false, error: message }, 200);
  }
});
