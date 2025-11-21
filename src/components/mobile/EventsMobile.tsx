import { useEffect, useRef, useState } from "react";
import MobileShell, { Section, MobileCard, Skeleton } from "./MobileShell";
import { Calendar, MapPin } from "lucide-react";
import { eventService, Event } from "@/services/events";

export default function EventsMobile() {
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const sentryRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    // Initial Load
    async function load() {
      setLoading(true);
      try {
        const data = await eventService.getUpcomingEvents();
        setAllEvents(data || []);
        // Trigger initial pagination
        setPage(1);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    // Filter and Paginate
    if (loading && page === 1) return; // Don't filter while initial loading

    let filtered = allEvents;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = allEvents.filter(e => {
        const title = typeof e.title === 'string' ? e.title : (e.title?.en || '');
        return title.toLowerCase().includes(q);
      });
    }

    const slice = filtered.slice(0, page * PAGE_SIZE);
    setEvents(slice);
    setHasMore(slice.length < filtered.length);

  }, [page, searchQuery, allEvents]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (sentryRef.current) {
      observer.observe(sentryRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore]);

  return (
    <MobileShell>
      <div className="pt-3 px-4">
        {/* Search */}
        <input 
          className="w-full px-3 py-2 rounded-xl border border-border bg-background"
          placeholder="Search events..." 
          value={searchQuery} 
          onChange={e => {
            setSearchQuery(e.target.value);
            setPage(1); // Reset pagination
          }}
        />

        {/* Filter Tags */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {['All', 'Webinar', 'Workshop', 'Group Coaching'].map(tag => (
            <button 
              key={tag} 
              className="px-3 py-1.5 rounded-xl border border-border text-xs whitespace-nowrap hover:bg-accent transition"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <Section title="Upcoming Events">
        <div className="grid gap-3">
          {events.map(event => (
            <EventCard key={event.id} event={event} />
          ))}

          {loading && (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          )}

          <div ref={sentryRef} className="h-4" />

          {!loading && !hasMore && events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events found</p>
            </div>
          )}

          {!loading && !hasMore && events.length > 0 && (
            <p className="text-xs text-center text-muted-foreground py-4">
              No more events
            </p>
          )}
        </div>
      </Section>
    </MobileShell>
  );
}

function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.start_at);
  const month = startDate.toLocaleString(undefined, { month: 'short' }).toUpperCase();
  const day = startDate.getDate();
  const title = typeof event.title === 'string' ? event.title : (event.title?.en || 'Untitled');
  const summary = typeof event.summary === 'string' ? event.summary : (event.summary?.en || '');

  return (
    <MobileCard href={`/events/${event.slug}`}>
      <div className="flex gap-3">
        {/* Date Badge */}
        <div className="flex flex-col items-center justify-center w-14 h-14 shrink-0 rounded-xl border border-border bg-muted/50">
          <div className="text-[10px] text-muted-foreground">{month}</div>
          <div className="text-xl font-semibold leading-none">{day}</div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="font-medium line-clamp-2 mb-1">{title}</div>
          {summary && (
            <div className="text-sm text-muted-foreground line-clamp-2 mb-1">
              {summary}
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <time>
              {startDate.toLocaleString(undefined, { 
                weekday: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </time>
          </div>
        </div>

        {/* Thumbnail */}
        {event.cover_url && (
          <img 
            src={event.cover_url} 
            alt=""
            width={96} 
            height={72}
            className="w-24 h-18 object-cover rounded-lg border border-border shrink-0" 
            loading="lazy" 
            decoding="async"
          />
        )}
      </div>
    </MobileCard>
  );
}
