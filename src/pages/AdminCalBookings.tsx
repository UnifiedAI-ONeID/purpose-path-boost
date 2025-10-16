import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, Mail, MapPin, RefreshCw, Video, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Booking = {
  id: string;
  cal_booking_id: string;
  cal_uid: string;
  event_type_slug: string | null;
  title: string;
  start_time: string;
  end_time: string;
  attendee_name: string;
  attendee_email: string;
  attendee_timezone: string | null;
  status: string;
  meeting_url: string | null;
  location: string | null;
  created_at: string;
};

type EventType = {
  id: string;
  cal_event_type_id: string;
  slug: string;
  title: string;
  description: string | null;
  length: number;
  price: number;
  currency: string;
  active: boolean;
  last_synced_at: string;
};

export default function AdminCalBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadBookings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cal-bookings');
      
      if (error) throw error;
      
      setBookings(data.bookings || []);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    }
  };

  const loadEventTypes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cal-event-types');
      
      if (error) throw error;
      
      setEventTypes(data.event_types || []);
    } catch (error: any) {
      console.error('Error loading event types:', error);
      toast.error('Failed to load event types');
    }
  };

  const syncBookings = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cal-bookings', {
        body: { action: 'sync' },
      });
      
      if (error) throw error;
      
      toast.success(`Synced ${data.synced} bookings from Cal.com`);
      await loadBookings();
    } catch (error: any) {
      console.error('Error syncing bookings:', error);
      toast.error('Failed to sync bookings');
    } finally {
      setSyncing(false);
    }
  };

  const syncEventTypes = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('cal-event-types', {
        body: { action: 'sync' },
      });
      
      if (error) throw error;
      
      toast.success(`Synced ${data.synced} event types from Cal.com`);
      await loadEventTypes();
    } catch (error: any) {
      console.error('Error syncing event types:', error);
      toast.error('Failed to sync event types');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadBookings(), loadEventTypes()]);
      setLoading(false);
    };
    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      case 'rescheduled': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cal.com Integration</h1>
          <p className="text-muted-foreground">Manage bookings and event types</p>
        </div>
        <Button onClick={syncing ? undefined : syncBookings} disabled={syncing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
          Sync All
        </Button>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">
            <Calendar className="w-4 h-4 mr-2" />
            Bookings ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="event-types">
            <Users className="w-4 h-4 mr-2" />
            Event Types ({eventTypes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={syncBookings} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Bookings
            </Button>
          </div>

          {bookings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No bookings found. Sync from Cal.com to get started.
            </Card>
          ) : (
            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{booking.title}</h3>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{booking.attendee_name}</span>
                          <span className="text-xs">({booking.attendee_email})</span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatDate(booking.start_time)}
                        </div>

                        {booking.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {booking.location}
                          </div>
                        )}

                        {booking.meeting_url && (
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            <a
                              href={booking.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              Join Meeting
                            </a>
                          </div>
                        )}
                      </div>

                      {booking.event_type_slug && (
                        <div className="text-xs text-muted-foreground">
                          Event: {booking.event_type_slug}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="event-types" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={syncEventTypes} disabled={syncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync Event Types
            </Button>
          </div>

          {eventTypes.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No event types found. Sync from Cal.com to get started.
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventTypes.map((eventType) => (
                <Card key={eventType.id} className="p-6 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{eventType.title}</h3>
                    <Badge variant={eventType.active ? 'default' : 'secondary'}>
                      {eventType.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  {eventType.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {eventType.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {eventType.length} min
                    </div>
                    {eventType.price > 0 && (
                      <div className="font-semibold">
                        {(eventType.price / 100).toFixed(2)} {eventType.currency}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Slug: {eventType.slug}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Last synced: {formatDate(eventType.last_synced_at)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
