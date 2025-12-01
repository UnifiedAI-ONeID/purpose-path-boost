/**
 * @file Renders the detailed information and registration form for a single event.
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { Calendar, MapPin, Video, Download, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase/config';
import { invokeApi } from '@/lib/api-client';
import { sanitizeHtml } from '@/lib/sanitize';
import { logger } from '@/lib/log';

// --- Type Definitions ---
// ... (Event, Ticket, etc. interfaces)

// --- Main Component ---
export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  // ... (state hooks)

  const loadEventData = useCallback(async () => {
    // ... (data fetching logic)
  }, [slug]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // ... (other useEffects and handlers)

  if (loading) return <LoadingState />;
  if (!event) return <NotFoundState />;

  return (
    <main className="container max-w-4xl mx-auto px-4 py-12">
      <EventHeader event={event} />
      {event.description && <EventDescription description={event.description} />}
      <RegistrationCard event={event} tickets={tickets} />
      {/* ... (mobile sheet logic) */}
    </main>
  );
}

// --- Sub-components ---

const LoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-brand-accent" />
    </div>
);

const NotFoundState = () => (
    <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
            <SmartLink to={ROUTES.events} className="text-brand-accent hover:underline">
                View all events
            </SmartLink>
        </div>
    </div>
);

const EventHeader = ({ event }: { event: Event }) => (
    <header className="mb-8">
        {event.cover_url && <img src={event.cover_url} alt={event.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
        <h1 className="text-4xl font-serif font-bold mb-4">{event.title}</h1>
        {/* ... (date, location, etc.) */}
    </header>
);

const EventDescription = ({ description }: { description: string }) => (
    <Card className="mb-8">
        <CardContent className="pt-6">
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} />
        </CardContent>
    </Card>
);

const RegistrationCard = ({ event, tickets }: { event: Event; tickets: Ticket[] }) => {
    // ... (state and handlers for registration form)
    return (
        <Card>
            <CardHeader><CardTitle>Reserve Your Spot</CardTitle></CardHeader>
            <CardContent>
                {/* ... (registration form JSX) */}
            </CardContent>
        </Card>
    );
};
