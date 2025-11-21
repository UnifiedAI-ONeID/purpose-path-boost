import { useEffect, useRef, useState } from "react";
import MobileShell, { Section, MobileCard, Skeleton } from "./MobileShell";
import { supabase } from "@/db'; import { dbClient as supabase } from '@/db";
import { Calendar, MapPin } from "lucide-react";

type Event = {
  id: string;
  slug: string;
  title: string;
  start_at: string;
  end_at: string;
  cover_url?: string;
  summary?: string;
  tz?: string;
};

export default function EventsMobile() {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const sentryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadEvents(1, true);
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadEvents(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (sentryRef.current) {
      observer.observe(sentryRef.current);
    }

    return () => observer.disconnect();
  }, [page, loading, hasMore]);

  async function loadEvents(pageNum = 1, reset = false) {
    if (loading) return;
    
    setLoading(true);

    try {
      let query = supabase
        .from('events')
        .select('id, slug, title, start_at, end_at, cover_url, summary, tz')
        .eq('status', 'published')
        .gte('end_at', new Date(Date.now() - 24 * 3600000).toISOString())
        .order('start_at', { ascending: true })
        .range((pageNum - 1) * 10, pageNum * 10 - 1);

      if (searchQuery.trim()) {
        query = query.ilike('title', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const newEvents = data || [];
      
      if (reset) {
        setEvents(newEvents);
        setPage(1);
      } else {
        setEvents(prev => [...prev, ...newEvents]);
        setPage(pageNum);
      }

      setHasMore(newEvents.length === 10);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }

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
            setHasMore(true);
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

function EventCard({ event }: { event: Event }) {
  const startDate = new Date(event.start_at);
  const month = startDate.toLocaleString(undefined, { month: 'short' }).toUpperCase();
  const day = startDate.getDate();

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
          <div className="font-medium line-clamp-2 mb-1">{event.title}</div>
          {event.summary && (
            <div className="text-sm text-muted-foreground line-clamp-2 mb-1">
              {event.summary}
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