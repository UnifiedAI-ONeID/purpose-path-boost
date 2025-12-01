/**
 * @file Admin page for listing and managing all created events.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase/config';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ExternalLink, Edit } from 'lucide-react';
import { toast } from 'sonner';
import AdminShell from '@/components/admin/AdminShell';
import { logger } from '@/lib/log';

// --- Type Definitions ---

interface Event {
  id: string;
  title: string;
  slug: string;
  start_at: Timestamp; // Using Firestore Timestamp for accurate sorting
  status: 'published' | 'draft' | 'closed';
  location: string;
}

// --- Main Component ---

export default function AdminEvents() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'events'), orderBy('start_at', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      setEvents(data);
    } catch (error) {
      logger.error('[AdminEvents] Failed to load events.', { error });
      toast.error('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const filteredEvents = useMemo(() => 
    events.filter(event =>
      event.title?.toLowerCase().includes(search.toLowerCase()) ||
      event.slug?.toLowerCase().includes(search.toLowerCase())
    ), [events, search]);

  return (
    <AdminShell>
      <Header onNewEvent={() => navigate('/admin/events/new')} />
      <Input
        placeholder="Search by title or slug..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6"
      />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <EventsTable events={filteredEvents} navigate={navigate} />
      )}
    </AdminShell>
  );
}

// --- Sub-components ---

const Header = ({ onNewEvent }: { onNewEvent: () => void }) => (
  <header className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-3xl font-bold">Events & Workshops</h1>
      <p className="text-muted-foreground">Manage your events and registrations.</p>
    </div>
    <Button onClick={onNewEvent}>
      <Plus className="h-4 w-4 mr-2" /> New Event
    </Button>
  </header>
);

const EventsTable = ({ events, navigate }: { events: Event[]; navigate: (path: string) => void; }) => (
    <Card>
        <CardContent className="pt-6">
            {events.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No events found.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>When</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map(event => <EventRow key={event.id} event={event} navigate={navigate} />)}
                    </TableBody>
                </Table>
            )}
        </CardContent>
    </Card>
);

const EventRow = ({ event, navigate }: { event: Event; navigate: (path: string) => void; }) => {
    const statusClasses = {
        published: 'bg-green-100 text-green-800',
        draft: 'bg-yellow-100 text-yellow-800',
        closed: 'bg-gray-100 text-gray-800',
    };
    return (
        <TableRow>
            <TableCell>{event.start_at?.toDate().toLocaleDateString() || 'TBD'}</TableCell>
            <TableCell className="font-medium">{event.title}</TableCell>
            <TableCell>
                <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[event.status]}`}>
                    {event.status}
                </span>
            </TableCell>
            <TableCell>{event.location}</TableCell>
            <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/events/${event.slug}`)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" asChild><a href={`/events/${event.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></a></Button>
            </TableCell>
        </TableRow>
    );
};

const LoadingSpinner = () => <div className="text-center py-20">Loading...</div>;
