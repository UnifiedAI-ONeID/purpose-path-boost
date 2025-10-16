const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function esc(s: string) {
  return (s || '').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const {
    title = 'ZhenGrowth Event',
    start,
    end,
    tz = 'America/Vancouver',
    event_url = 'https://zhengrowth.com/events',
    description = '',
    location = 'Online'
  } = req.method === 'POST' 
    ? await req.json() 
    : Object.fromEntries(url.searchParams);

  if (!start || !end) {
    return new Response('start & end required (ISO)', { 
      status: 400,
      headers: corsHeaders
    });
  }

  const uid = `zg-${Date.now()}@zhengrowth.com`;
  const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const fmt = (iso: string) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZhenGrowth//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}\\n${event_url}`,
    `URL:${esc(event_url)}`,
    `LOCATION:${esc(location)}`,
    `TZID:${tz}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return new Response(ics, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="zg-event.ics"`
    }
  });
});
