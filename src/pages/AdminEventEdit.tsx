
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase/config';
import { collection, doc, getDocs, getDoc, query, where, orderBy, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, ExternalLink, Save, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import FxOverridesEditor from '@/components/admin/FxOverridesEditor';
import FxAuditTicket from '@/components/admin/FxAuditTicket';
import PriceTesting from '@/components/admin/PriceTesting';
import AdminShell from '@/components/admin/AdminShell';

interface Event {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  cover_url: string;
  start_at: string;
  end_at: string;
  tz: string;
  location: string;
  meeting_url: string;
  capacity: number;
  is_paid: boolean;
  status: string;
}

interface Ticket {
  id?: string;
  event_id?: string;
  name: string;
  price_cents: number;
  currency: string;
  qty: number;
  base_currency: string;
  base_price_cents: number;
}

interface Registration {
  id: string;
  created_at: string;
  name: string;
  email: string;
  status: string;
  amount_cents: number;
  currency: string;
  checked_in_at: string | null;
  ticket_name: string;
}

export default function AdminEventEdit() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = slug === 'new';
  
  const [event, setEvent] = useState<Event>({
    title: '',
    slug: '',
    summary: '',
    description: '',
    cover_url: '',
    start_at: '',
    end_at: '',
    tz: 'America/Vancouver',
    location: 'Online',
    meeting_url: '',
    capacity: 200,
    is_paid: false,
    status: 'draft'
  });
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      loadEvent();
    } else {
      setLoading(false);
    }
  }, [slug]);

  async function loadEvent() {
    try {
      const q = query(collection(db, 'events'), where('slug', '==', slug), where('status', '!=', 'deleted'));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        toast.error('Event not found');
        navigate('/admin/events');
        return;
      }

      const eventDoc = snapshot.docs[0];
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;

      setEvent({
        id: eventId,
        ...eventData,
        start_at: eventData.start_at ? new Date(eventData.start_at).toISOString().slice(0, 16) : '',
        end_at: eventData.end_at ? new Date(eventData.end_at).toISOString().slice(0, 16) : ''
      } as Event);

      // Load tickets
      const ticketsQ = query(collection(db, 'event_tickets'), where('event_id', '==', eventId), orderBy('price_cents'));
      const ticketsSnap = await getDocs(ticketsQ);
      const ticketsData = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Ticket[];
      setTickets(ticketsData);

      // Map tickets for lookup
      const ticketMap = new Map(ticketsData.map(t => [t.id, t.name]));

      // Load registrations
      const regsQ = query(collection(db, 'event_regs'), where('event_id', '==', eventId), orderBy('created_at', 'desc'));
      const regsSnap = await getDocs(regsQ);
      
      const regsData = regsSnap.docs.map(d => {
        const data = d.data();
        const ticketId = data.ticket_id;
        return {
            id: d.id,
            ...data,
            ticket_name: ticketMap.get(ticketId) || 'N/A',
            created_at: data.created_at?.seconds ? new Date(data.created_at.seconds * 1000).toISOString() : data.created_at
        };
      }) as Registration[];

      setRegistrations(regsData);
      
    } catch (e: any) {
      console.error("Failed to load event:", e);
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!event.title || !event.slug || !event.start_at || !event.end_at) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        ...event,
        start_at: new Date(event.start_at).toISOString(),
        end_at: new Date(event.end_at).toISOString()
      };
      // Remove ID from data payload
      delete (eventData as any).id;

      if (isNew) {
        const docRef = await addDoc(collection(db, 'events'), {
            ...eventData,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
        });
        
        toast.success('Event created successfully');
        // Since we use slug in URL, navigate to it. Ideally we should check slug uniqueness first.
        navigate(`/admin/events/${eventData.slug}`);
      } else {
        if (!event.id) throw new Error("Missing event ID");
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
            ...eventData,
            updated_at: serverTimestamp()
        });
        
        toast.success('Event updated successfully');
        await loadEvent();
      }
    } catch (e: any) {
      console.error("Failed to save event:", e);
      toast.error(e.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddTicket() {
    if (!event.id) {
      toast.error('Please save the event first');
      return;
    }

    const newTicket = {
      event_id: event.id,
      name: 'General Admission',
      price_cents: 0,
      currency: 'USD',
      base_currency: 'USD',
      base_price_cents: 0,
      qty: 100,
      created_at: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'event_tickets'), newTicket);
      
      toast.success('Ticket added');
      await loadEvent();
    } catch (e: any) {
      console.error("Failed to add ticket:", e);
      toast.error('Failed to add ticket');
    }
  }

  async function handleCheckIn(regId: string) {
    try {
      const regRef = doc(db, 'event_regs', regId);
      await updateDoc(regRef, { checked_in_at: new Date().toISOString() });
      
      toast.success('Checked in successfully');
      await loadEvent();
    } catch (e: any) {
      console.error("Failed to check in:", e);
      toast.error('Failed to check in');
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div>
      <header className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/events')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
          
          {!isNew && (
            <Button variant="outline" asChild>
              <a href={`/events/${event.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </a>
            </Button>
          )}
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Event Details */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title *</label>
              <Input
                value={event.title}
                onChange={(e) => setEvent({ ...event, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Slug *</label>
              <Input
                value={event.slug}
                onChange={(e) => setEvent({ ...event, slug: e.target.value })}
                placeholder="event-slug"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Summary</label>
              <Textarea
                value={event.summary}
                onChange={(e) => setEvent({ ...event, summary: e.target.value })}
                placeholder="Brief summary"
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Time *</label>
              <Input
                type="datetime-local"
                value={event.start_at}
                onChange={(e) => setEvent({ ...event, start_at: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Time *</label>
              <Input
                type="datetime-local"
                value={event.end_at}
                onChange={(e) => setEvent({ ...event, end_at: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Timezone</label>
              <Input
                value={event.tz}
                onChange={(e) => setEvent({ ...event, tz: e.target.value })}
                placeholder="America/Vancouver"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Input
                value={event.location}
                onChange={(e) => setEvent({ ...event, location: e.target.value })}
                placeholder="Online or physical address"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Meeting URL</label>
              <Input
                value={event.meeting_url}
                onChange={(e) => setEvent({ ...event, meeting_url: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={event.status}
                onChange={(e) => setEvent({ ...event, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Tickets</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddTicket} disabled={isNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Ticket
            </Button>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {isNew ? 'Save the event first to add tickets' : 'No tickets yet'}
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="space-y-3 pb-4 border-b last:border-0">
                    <div className="border border-border rounded-lg p-3">
                      <div className="font-medium">{ticket.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Base: {ticket.base_price_cents > 0 
                          ? `${ticket.base_currency || ticket.currency} ${((ticket.base_price_cents || ticket.price_cents) / 100).toFixed(2)}`
                          : 'FREE'}
                        {' • '}
                        {ticket.qty} spots
                      </div>
                    </div>
                    {ticket.id && event.id && (
                      <>
                        <FxOverridesEditor ticketId={ticket.id} />
                        <FxAuditTicket ticketId={ticket.id} />
                        <PriceTesting 
                          eventId={event.id}
                          ticketId={ticket.id} 
                          basePrice={ticket.base_price_cents || ticket.price_cents}
                          baseCurrency={ticket.base_currency || ticket.currency}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Registrations */}
      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Registrations ({registrations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No registrations yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>When</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Check-in</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(reg.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{reg.name}</TableCell>
                        <TableCell>{reg.email}</TableCell>
                        <TableCell>{reg.ticket_name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            reg.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {reg.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {reg.checked_in_at ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <Check className="h-4 w-4" />
                              <span className="text-xs">Checked in</span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCheckIn(reg.id)}
                            >
                              Check in
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </AdminShell>
  );
}
