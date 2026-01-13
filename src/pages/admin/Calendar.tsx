import { useEffect, useState } from 'react';
import { invokeApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/trackEvent';
import { Loader2, Calendar, CheckCircle2, Clock, User, Mail, Phone, Trash2, RefreshCw } from 'lucide-react';

interface CalBooking {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: Array<{
    name: string;
    email: string;
    phone?: string;
  }>;
  eventType: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  organizer: string;
  location?: string;
  notes?: string;
}

interface CalendarStats {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  eventTypes: Record<string, number>;
  upcomingCount: number;
}

export default function AdminCalendar() {
  const [bookings, setBookings] = useState<CalBooking[]>([]);
  const [stats, setStats] = useState<CalendarStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    trackEvent('admin_calendar_view');
    try {
      const response = await invokeApi<{ data: CalBooking[]; stats: CalendarStats }>(
        '/api/admin/calendar/bookings'
      );
      if (response.data?.data) {
        setBookings(response.data.data);
        setStats(response.data.stats);
      } else {
        // Fallback: show empty state with Cal.com configuration prompt
        toast.info('No bookings synced yet. Configure Cal.com in Integrations.');
        setBookings([]);
        setStats({
          totalBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          pendingBookings: 0,
          eventTypes: {},
          upcomingCount: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      toast.error('Failed to load calendar bookings. Ensure Cal.com is configured.');
      // Set empty state instead of failing
      setBookings([]);
      setStats({
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        pendingBookings: 0,
        eventTypes: {},
        upcomingCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    trackEvent('admin_calendar_sync');
    try {
      await invokeApi('/api/admin/calendar/sync', { method: 'POST' });
      toast.success('Calendar synced successfully');
      await loadBookings();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync calendar');
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    
    trackEvent('admin_delete', { resource: 'booking', id: bookingId });
    try {
      await invokeApi(`/api/admin/calendar/bookings/${bookingId}`, { method: 'DELETE' });
      toast.success('Booking cancelled');
      await loadBookings();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesStatus = filter === 'all' || b.status === filter;
    const matchesSearch = searchQuery === '' || 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.attendees.some(a => a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Calendar Management</h1>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Sync with Cal.com
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">Total Bookings</div>
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
          </Card>
          <Card className="p-4 border-green-200 bg-green-50 dark:bg-green-950">
            <div className="text-sm text-green-700 dark:text-green-300">Confirmed</div>
            <div className="text-3xl font-bold text-green-700">{stats.confirmedBookings}</div>
          </Card>
          <Card className="p-4 border-orange-200 bg-orange-50 dark:bg-orange-950">
            <div className="text-sm text-orange-700 dark:text-orange-300">Pending</div>
            <div className="text-3xl font-bold text-orange-700">{stats.pendingBookings}</div>
          </Card>
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950">
            <div className="text-sm text-red-700 dark:text-red-300">Cancelled</div>
            <div className="text-3xl font-bold text-red-700">{stats.cancelledBookings}</div>
          </Card>
          <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-950">
            <div className="text-sm text-blue-700 dark:text-blue-300">Upcoming</div>
            <div className="text-3xl font-bold text-blue-700">{stats.upcomingCount}</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or event title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'confirmed', 'pending', 'cancelled'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <Card className="p-6">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No bookings found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(booking => (
              <div key={booking.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    {/* Title and Status */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{booking.title}</h3>
                      <div className="flex items-center gap-1">
                        {booking.status === 'confirmed' && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {booking.status === 'pending' && (
                          <Clock className="h-4 w-4 text-orange-600" />
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                          booking.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    {/* Event Details */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Event Type:</span> {booking.eventType}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleTimeString()}
                      </div>
                      {booking.location && (
                        <div>
                          <span className="font-medium">Location:</span> {booking.location}
                        </div>
                      )}
                    </div>

                    {/* Attendees */}
                    <div className="space-y-1 mt-3">
                      {booking.attendees.map((attendee, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{attendee.name}</span>
                          <a href={`mailto:${attendee.email}`} className="text-primary hover:underline">
                            {attendee.email}
                          </a>
                          {attendee.phone && (
                            <>
                              <Phone className="h-3 w-3 text-muted-foreground ml-2" />
                              <a href={`tel:${attendee.phone}`} className="text-primary hover:underline">
                                {attendee.phone}
                              </a>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {booking.notes && (
                      <div className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(booking.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Event Types Summary */}
      {stats && Object.keys(stats.eventTypes).length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Bookings by Event Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.eventTypes).map(([eventType, count]) => (
              <div key={eventType} className="p-4 border border-border rounded-lg">
                <div className="text-sm font-medium capitalize">{eventType}</div>
                <div className="text-2xl font-bold text-primary">{count}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
