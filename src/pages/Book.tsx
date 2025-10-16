import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Video, MessageCircle, Loader2 } from 'lucide-react';
import { track } from '@/analytics/events';
import { COACHING_PACKAGES, type CoachingPackageId } from '@/lib/airwallex';
import { toast } from 'sonner';
import BookCTA from '@/components/BookCTA';
import Robots from '@/components/Robots';

const Book = () => {
  const { t } = useTranslation('common');
  const [selectedSession, setSelectedSession] = useState<typeof sessionTypes[0] | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [calReady, setCalReady] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    track('page_view', { page: 'book' });
    
    // Check for direct slug redirect
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || params.get('type');
    
    if (slug) {
      fetch('/api/coaching/book-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok && data.url) {
            window.location.href = data.url;
          }
        })
        .catch(() => setLoading(false));
      return;
    }

    // Load coaching offers
    fetch('/api/coaching/list')
      .then(r => r.json())
      .then(data => {
        setOffers(data.rows || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    // Initialize and check if Cal.com is ready
    const initializeCal = () => {
      if (typeof window !== 'undefined' && window.Cal) {
        console.log('[Cal.com] Initializing...');
        
        // Initialize Cal.com
        try {
          window.Cal('init', { origin: 'https://cal.com' });
          console.log('[Cal.com] Initialized and ready');
          setCalReady(true);
          return true;
        } catch (error) {
          console.error('[Cal.com] Initialization error:', error);
          return false;
        }
      }
      return false;
    };

    // Check immediately
    if (!initializeCal()) {
      // If not ready, check periodically
      const interval = setInterval(() => {
        if (initializeCal()) {
          clearInterval(interval);
        }
      }, 500);

      // Stop checking after 10 seconds
      setTimeout(() => {
        clearInterval(interval);
        if (!calReady) {
          console.error('[Cal.com] Failed to load after 10 seconds');
          toast.error('Booking system failed to load. Please refresh the page.');
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [calReady]);

  const sessionTypes = [
    {
      icon: Calendar,
      title: 'Discovery Session',
      duration: '30 minutes',
      price: 'Free',
      priceAmount: 0,
      description: 'Get to know each other and explore if coaching is right for you',
      calLink: 'zhengrowth/discovery',
      eventType: 'discovery-30min',
      packageId: 'discovery' as CoachingPackageId,
    },
    {
      icon: Video,
      title: 'Single Session',
      duration: '60 minutes',
      price: '$200',
      priceAmount: 200,
      description: 'One-on-one coaching focused on your specific challenge',
      calLink: 'zhengrowth/single-session',
      eventType: 'single-60min',
      packageId: 'single' as CoachingPackageId,
    },
    {
      icon: MessageCircle,
      title: 'Monthly Package',
      duration: '4 sessions',
      price: '$800',
      priceAmount: 800,
      description: 'Ongoing support with weekly sessions and email check-ins',
      calLink: 'zhengrowth/monthly-package',
      eventType: 'monthly-package',
      packageId: 'monthly' as CoachingPackageId,
    },
  ];

  const handleBooking = async (session: typeof sessionTypes[0]) => {
    console.log('[Booking] Session selected:', session.title, 'Price:', session.priceAmount);
    
    track('booking_initiated', {
      session_type: session.eventType,
      price: session.price,
      duration: session.duration,
    });

    // Free session - go straight to Cal.com
    if (session.priceAmount === 0) {
      console.log('[Booking] Free session - opening Cal.com modal');
      
      if (!calReady || typeof window === 'undefined' || !window.Cal) {
        console.error('[Cal.com] Not ready. calReady:', calReady);
        toast.error('Booking system is still loading. Please wait a moment and try again.');
        return;
      }
      
      try {
        console.log('[Cal.com] Opening modal for:', session.calLink);
        
        // Use the inline Cal.com modal
        window.Cal('ui', {
          styles: { branding: { brandColor: '#1a4d3e' } },
          hideEventTypeDetails: false,
          layout: 'month_view'
        });
        
        window.Cal('modal', {
          calLink: session.calLink,
          config: {
            name: customerName || '',
            email: customerEmail || '',
            notes: 'Free discovery session booked via web',
            theme: 'light',
          }
        });
        
        console.log('[Cal.com] Modal opened successfully');
        
        // Add a small delay to check if modal appeared
        setTimeout(() => {
          console.log('[Cal.com] Modal should be visible now');
        }, 500);
        
      } catch (error) {
        console.error('[Cal.com] Error opening modal:', error);
        toast.error('Failed to open booking calendar. Please refresh the page and try again.');
      }
      return;
    }

    // Paid session - show payment form
    console.log('[Booking] Paid session - showing payment form');
    setSelectedSession(session);
    
    // Scroll to payment form
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSession || !customerName || !customerEmail) {
      toast.error('Please provide your name and email');
      return;
    }

    setIsProcessing(true);

    try {
      const packageData = COACHING_PACKAGES[selectedSession.packageId];
      
      track('payment_initiated', {
        session_type: selectedSession.eventType,
        amount: packageData.price,
      });

      const response = await fetch('/api/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: selectedSession.packageId,
          customerEmail,
          customerName,
          currency: packageData.currency,
          metadata: {
            sessionType: selectedSession.eventType,
            calLink: selectedSession.calLink,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment link');
      }

      const paymentLink = await response.json();

      // Store customer info for Cal.com after payment
      sessionStorage.setItem('booking_customer_name', customerName);
      sessionStorage.setItem('booking_customer_email', customerEmail);
      sessionStorage.setItem('booking_cal_link', selectedSession.calLink);

      track('payment_redirect', {
        session_type: selectedSession.eventType,
      });

      // Redirect to payment
      window.location.href = paymentLink.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
      track('payment_failed', {
        session_type: selectedSession?.eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    setSelectedSession(null);
    setCustomerName('');
    setCustomerEmail('');
  };

  // Check if returning from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      const name = sessionStorage.getItem('booking_customer_name') || '';
      const email = sessionStorage.getItem('booking_customer_email') || '';
      const calLink = sessionStorage.getItem('booking_cal_link') || '';

      toast.success('Payment successful! Please select your session time.');

      if (typeof window !== 'undefined' && window.Cal && calLink) {
        setTimeout(() => {
          window.Cal('modal', {
            calLink,
            config: {
              name,
              email,
              notes: 'Paid session',
              guests: [],
              theme: 'light',
            },
          });
        }, 500);
      }

      // Clean up
      sessionStorage.removeItem('booking_customer_name');
      sessionStorage.removeItem('booking_customer_email');
      sessionStorage.removeItem('booking_cal_link');
      
      // Clean URL
      window.history.replaceState({}, '', '/book');
    }
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 bg-bg">
      <Robots content="noindex,follow" />
      <div className="container max-w-5xl">
        {/* Show coaching offers if available */}
        {offers.length > 0 && !selectedSession && (
          <div className="mb-12">
            <div className="text-center mb-8">
              <p className="text-sm text-muted">Choose a coaching session to continue:</p>
            </div>
            <div className="grid gap-4">
              {offers.map(offer => (
                <Card key={offer.slug} className="border-border">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-2 text-fg">{offer.title_en}</h2>
                    {offer.summary_en && (
                      <p className="text-muted mb-4">{offer.summary_en}</p>
                    )}
                    <div className="flex gap-3">
                      <a
                        href={`/coaching/${offer.slug}`}
                        className="px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                      >
                        Learn more
                      </a>
                      <BookCTA slug={offer.slug} campaign="book-index" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!selectedSession ? (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl font-serif font-bold mb-4 text-fg">Book a Session</h1>
              <p className="text-xl text-muted">
                Choose the coaching format that works best for you
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {sessionTypes.map((session, index) => {
                const Icon = session.icon;
                return (
                  <Card key={index} className="hover:shadow-lg hover:scale-105 transition-all duration-300 border-border">
                    <CardHeader>
                      <Icon className="h-12 w-12 text-accent mb-4" />
                      <CardTitle className="text-fg">{session.title}</CardTitle>
                      <p className="text-sm text-muted">{session.duration}</p>
                      <p className="text-2xl font-bold text-accent mt-2">{session.price}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted mb-6">{session.description}</p>
                      <Button 
                        onClick={() => handleBooking(session)}
                        className="w-full bg-brand text-white hover:bg-brand/90 hover:scale-105 transition-all shadow-md"
                        disabled={!calReady && session.priceAmount === 0}
                      >
                        {!calReady && session.priceAmount === 0 
                          ? 'Loading...' 
                          : session.priceAmount === 0 
                            ? 'Schedule Now' 
                            : 'Pay & Schedule'
                        }
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-gradient-to-br from-accent/10 to-brand/10 border-accent/30 shadow-xl">
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-muted mb-4">
                  Not sure which option is right for you? Start with a free discovery session.
                </p>
                <Button 
                  onClick={() => handleBooking(sessionTypes[0])}
                  className="bg-accent text-brand hover:bg-accent/90 hover:scale-105 transition-all shadow-lg"
                  size="lg"
                  disabled={!calReady}
                >
                  {!calReady ? 'Loading...' : 'Book Free Discovery Call'}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-fg">Payment Details</CardTitle>
                <p className="text-sm text-muted">
                  Complete payment to schedule your {selectedSession.title}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-surface rounded-lg border border-border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-fg">{selectedSession.title}</span>
                      <span className="text-2xl font-bold text-accent">{selectedSession.price}</span>
                    </div>
                    <p className="text-sm text-muted">{selectedSession.duration} • {selectedSession.description}</p>
                  </div>
                </div>

                <form onSubmit={handlePayment} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-fg">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="bg-bg border-border text-fg"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-fg">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="bg-bg border-border text-fg"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelPayment}
                      className="flex-1 border-2 border-border text-fg hover:bg-surface"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-brand text-white hover:bg-brand/90 shadow-lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Pay ${selectedSession.price}`
                      )}
                    </Button>
                  </div>
                </form>

                <p className="text-xs text-muted text-center mt-4">
                  Secure payment powered by Airwallex. After payment, you'll schedule your session via Cal.com.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Book;
