/**
 * @file Renders a list of upcoming events.
 */

import { useEffect, useState, useCallback } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import EventsMobile from '@/components/mobile/EventsMobile';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { toast } from 'sonner';
import { SEOHelmet } from '@/components/SEOHelmet';
import { trackEvent } from '@/lib/trackEvent';
import { eventService, Event } from '@/services/events';
import { logger } from '@/lib/log';

// --- Main Component ---

export default function EventsList() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    try {
      const data = await eventService.getUpcomingEvents();
      setEvents(data || []);
    } catch (error) {
      logger.error('[EventsList] Failed to load events.', { error });
      toast.error('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    trackEvent('events_list_view');
    loadEvents();
  }, [loadEvents]);

  if (isMobile) return <EventsMobile />;
  if (loading) return <LoadingState />;

  return (
    <>
      <SEOHelmet
        title="Events & Workshops | ZhenGrowth"
        description="Join expert-led sessions for personal and professional development."
        path="/events"
      />
      <Header />
      {events.length === 0 ? <EmptyState /> : <EventsGrid events={events} />}
    </>
  );
}

// --- Sub-components ---

const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
);

const Header = () => (
    <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-4xl font-bold mb-3">Events & Workshops</h1>
        <p className="text-lg text-muted-foreground">
            Join our sessions for personal growth and professional development.
        </p>
    </motion.header>
);

const EmptyState = () => (
    <ScrollReveal>
        <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
                No upcoming events at the moment. Check back soon!
            </CardContent>
        </Card>
    </ScrollReveal>
);

const EventsGrid = ({ events }: { events: Event[] }) => (
    <div className="grid gap-6 md:grid-cols-2">
        {events.map((event, index) => (
            <ScrollReveal key={event.id} delay={index * 0.1}>
                <EventCard event={event} />
            </ScrollReveal>
        ))}
    </div>
);

const EventCard = ({ event }: { event: Event }) => (
    <a href={`/events/${event.slug}`} className="group block rounded-xl bg-card border overflow-hidden hover:shadow-lg transition-shadow">
        <div className="aspect-video overflow-hidden">
            <img src={event.cover_url || '/placeholder.svg'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        </div>
        <div className="p-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Calendar size={16} /> {new Date(event.start_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><MapPin size={16} /> {event.location || 'Online'}</span>
            </div>
            <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{event.title}</h2>
            {event.summary && <p className="text-sm text-muted-foreground line-clamp-2">{event.summary}</p>}
        </div>
    </a>
);
