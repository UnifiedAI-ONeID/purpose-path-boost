import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

function formatDateForICS(date: string): string {
  return new Date(date)
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).send('Slug is required');
    }

    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !event) {
      return res.status(404).send('Event not found');
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

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.slug}.ics"`);
    res.send(ics);
  } catch (e: any) {
    res.status(500).send('Failed to generate calendar file');
  }
}
