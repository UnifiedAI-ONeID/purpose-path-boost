export default function AddToCalendar({
  ev
}: {
  ev: { title: string; start_at: string; end_at: string; slug: string; summary?: string };
}) {
  const href = `/api/calendar/ics?title=${encodeURIComponent(ev.title)}&start=${encodeURIComponent(
    ev.start_at
  )}&end=${encodeURIComponent(ev.end_at)}&url=${encodeURIComponent(
    'https://zhengrowth.com/events/' + ev.slug
  )}&description=${encodeURIComponent(ev.summary || '')}`;

  return (
    <a className="btn btn-ghost text-xs" href={href} download={`${ev.slug}.ics`}>
      Add to Calendar
    </a>
  );
}
