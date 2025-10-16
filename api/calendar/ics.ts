import type { VercelRequest, VercelResponse } from '@vercel/node';

function esc(s: string) {
  return (s || '').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n');
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    title = 'ZhenGrowth Event',
    start,
    end,
    tz = 'America/Vancouver',
    url = 'https://zhengrowth.com/events',
    description = '',
    location = 'Online'
  } = (req.method === 'POST' ? req.body : req.query) as any;

  if (!start || !end) {
    return res.status(400).send('start & end required (ISO)');
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
    `DESCRIPTION:${esc(description)}\\n${url}`,
    `URL:${esc(url)}`,
    `LOCATION:${esc(location)}`,
    `TZID:${tz}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="zg-event.ics"`);
  res.status(200).send(ics);
};
