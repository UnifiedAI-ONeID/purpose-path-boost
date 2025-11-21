import { useEffect, useState } from 'react';
import { supabase } from '@/db'; import { dbClient as supabase } from '@/db';
import { Calendar, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import EventsMobile from '@/components/mobile/EventsMobile';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/motion/ScrollReveal';
import { toast } from 'sonner';
import { SEOHelmet } from '@/components/SEOHelmet';
import { trackEvent } from '@/lib/trackEvent';

export default function EventsList() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('events_list_view');
    
    async function load() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'published')
          .gte('end_at', new Date().toISOString())
          .order('start_at', { ascending: true });
        
        if (error) throw error;
        
        setEvents(data || []);
      } catch (error) {
        console.error('Failed to load events:', error);
        toast.error('Failed to load events. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Use mobile version on mobile devices (after all hooks)
  if (isMobile) {
    return <EventsMobile />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  return (
    <>
      <SEOHelmet
        title="Events & Workshops | ZhenGrowth"
        description="Join our upcoming sessions for personal growth and professional development. Expert-led workshops and events for Chinese-speaking professionals worldwide."
        path="/events"
        lang="en"
        image="https://zhengrowth.com/app-icon.png"
      />
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-serif font-bold mb-3">Events & Workshops</h1>
        <p className="text-lg text-muted-foreground">
          Join our upcoming sessions for personal growth and professional development
        </p>
      </motion.header>

      {events.length === 0 ? (
        <ScrollReveal>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No upcoming events at the moment. Check back soon!
            </CardContent>
          </Card>
        </ScrollReveal>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event, index) => (
            <ScrollReveal key={event.id} delay={index * 0.1}>
              <a
                href={`/events/${event.slug}`}
                className="group block rounded-xl bg-card border border-border overflow-hidden hover:shadow-lg transition-smooth"
              >
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={event.cover_url || '/placeholder.svg'}
                    alt={event.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <time>
                        {new Date(event.start_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </time>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location || 'Online'}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold mb-2 group-hover:text-brand-accent transition-colors">
                    {event.title}
                  </h2>
                  
                  {event.summary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.summary}
                    </p>
                  )}
                  
                  {event.is_paid && (
                    <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-accent/10 text-brand-accent">
                      Paid Event
                    </div>
                  )}
                </div>
              </a>
            </ScrollReveal>
          ))}
        </div>
      )}
    </>
  );
}
