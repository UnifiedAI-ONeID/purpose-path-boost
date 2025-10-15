import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Video, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Event {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  cover_url?: string;
  start_at: string;
  end_at: string;
  tz: string;
  location?: string;
  meeting_url?: string;
  capacity: number;
  is_paid: boolean;
  status: string;
}

interface Ticket {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  qty: number;
}

export default function EventDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [displayPrice, setDisplayPrice] = useState<{ cents: number; currency: string } | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [userCountry, setUserCountry] = useState('US');

  const paid = searchParams.get('paid') === '1';
  const cancelled = searchParams.get('cancel') === '1';

  useEffect(() => {
    async function load() {
      try {
        const eventData = await fetch(`/api/events/get?slug=${slug}`).then(r => r.json());
        setEvent(eventData);

        if (eventData?.id) {
          const ticketsData = await fetch(`/api/events/tickets?event_id=${eventData.id}`).then(r => r.json());
          setTickets(ticketsData);
          if (ticketsData.length > 0) {
            setSelectedTicket(ticketsData[0].id);
          }
        }

        // Detect user country from browser
        try {
          const geoResponse = await fetch('https://ipapi.co/json/');
          const geoData = await geoResponse.json();
          if (geoData.country_code) {
            setUserCountry(geoData.country_code);
          }
        } catch (e) {
          console.log('Geo detection failed, using default');
        }
      } catch (e) {
        toast.error('Failed to load event details');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Update price when currency or ticket changes
  useEffect(() => {
    async function updatePrice() {
      if (!selectedTicket) return;
      
      try {
        // First, try to get A/B test assignment
        const assignResult = await fetch('/api/pricing/assign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_id: selectedTicket, country: userCountry })
        }).then(r => r.json());

        if (assignResult.ok) {
          // Use A/B test assigned price
          setDisplayPrice({ 
            cents: assignResult.price_cents, 
            currency: assignResult.currency 
          });
          setSelectedCurrency(assignResult.currency);
          return;
        }

        // Fallback to standard price preview
        const result = await fetch('/api/events/price-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket_id: selectedTicket, currency: selectedCurrency })
        }).then(r => r.json());
        
        if (result.ok) {
          setDisplayPrice({ cents: result.display_cents, currency: result.currency });
        }
      } catch (e) {
        console.error('Price preview failed:', e);
      }
    }
    updatePrice();
  }, [selectedTicket, selectedCurrency, userCountry]);

  useEffect(() => {
    if (paid) {
      toast.success('Payment successful! Check your email for confirmation.');
    } else if (cancelled) {
      toast.info('Payment cancelled. You can try again when ready.');
    }
  }, [paid, cancelled]);

  async function handleRegister() {
    if (!name || !email) {
      toast.error('Please fill in your name and email');
      return;
    }

    if (!selectedTicket) {
      toast.error('Please select a ticket');
      return;
    }

    setRegistering(true);
    try {
      const language = navigator.language.startsWith('zh') ? 'zh-CN' : 'en';
      const body = {
        event_id: event!.id,
        ticket_id: selectedTicket,
        name,
        email,
        language,
        currency: selectedCurrency,
        coupon_code: couponCode || undefined
      };

      const result = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(r => r.json());

      if (result.ok) {
        if (result.url) {
          // Paid event - redirect to Airwallex
          window.location.href = result.url;
        } else {
          // Free event - show success
          toast.success('Registration successful! Check your email for details.');
          setName('');
          setEmail('');
        }
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event not found</h1>
          <a href="/events" className="text-brand-accent hover:underline">
            View all events
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="container max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="mb-8">
        {event.cover_url && (
          <img
            src={event.cover_url}
            alt={event.title}
            className="w-full h-64 object-cover rounded-xl mb-6"
          />
        )}
        
        <h1 className="text-4xl font-serif font-bold mb-4">{event.title}</h1>
        
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <time>
              {new Date(event.start_at).toLocaleString('en-US', {
                dateStyle: 'full',
                timeStyle: 'short'
              })}
            </time>
            <span className="text-xs">({event.tz})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span>{event.location || 'Online'}</span>
          </div>
        </div>

        {event.meeting_url && (
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Video className="h-4 w-4" />
            <a href={event.meeting_url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">
              Join meeting
            </a>
          </div>
        )}
      </div>

      {/* Description */}
      {event.description && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: event.description }}
            />
          </CardContent>
        </Card>
      )}

      {/* Registration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Reserve Your Spot
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={registering}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                disabled={registering}
              />
            </div>
          </div>

          {tickets.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ticket Type</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={selectedTicket}
                    onChange={(e) => setSelectedTicket(e.target.value)}
                    disabled={registering}
                  >
                    {tickets.map(ticket => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.name} ({ticket.qty} spots left)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Currency</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    disabled={registering}
                  >
                    {['USD', 'CAD', 'EUR', 'GBP', 'HKD', 'SGD', 'CNY'].map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {displayPrice && (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">Price</div>
                  <div className="text-2xl font-bold">
                    {displayPrice.cents > 0 
                      ? `${displayPrice.currency} ${(displayPrice.cents / 100).toFixed(2)}`
                      : 'FREE'}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Coupon Code (optional)</label>
                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    disabled={registering}
                  />
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (!couponCode || !email || !selectedTicket) {
                        toast.error('Please enter email and select a ticket first');
                        return;
                      }

                      try {
                        const resp = await fetch('/api/events/coupon-preview', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            event_id: event!.id,
                            ticket_id: selectedTicket,
                            email,
                            code: couponCode
                          })
                        });
                        
                        const result = await resp.json();
                        
                        if (result.ok) {
                          toast.success(`Coupon applied! New price: ${result.currency} ${(result.total_cents / 100).toFixed(2)}`);
                        } else {
                          toast.error(result.reason || 'Invalid coupon code');
                        }
                      } catch (e) {
                        toast.error('Failed to validate coupon');
                      }
                    }}
                    disabled={registering}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleRegister}
              disabled={registering || tickets.length === 0}
              className="flex-1"
            >
              {registering ? 'Processing...' : 'Register Now'}
            </Button>
            
            <Button
              variant="outline"
              asChild
            >
              <a href={`/api/events/ics?slug=${event.slug}`} download>
                <Download className="h-4 w-4 mr-2" />
                Add to Calendar
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
