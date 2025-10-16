import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function formatDateForICS(date: string): string {
  return new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response('Slug is required', { 
        status: 400,
        headers: corsHeaders
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !event) {
      return new Response('Event not found', { 
        status: 404,
        headers: corsHeaders
      });
    }

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ZhenGrowth//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}
DTSTAMP:${formatDateForICS(new Date().toISOString())}
DTSTART:${formatDateForICS(event.start_at)}
DTEND:${formatDateForICS(event.end_at)}
SUMMARY:${event.title}
DESCRIPTION:${(event.summary || '').replace(/\n/g, '\\n')}
LOCATION:${event.location || 'Online'}
${event.meeting_url ? `URL:${event.meeting_url}` : ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return new Response(ics, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${event.slug}.ics"`
      }
    });
  } catch (e: any) {
    console.error('ICS generation error:', e);
    return new Response('Failed to generate calendar file', { 
      status: 500,
      headers: corsHeaders
    });
  }
});
