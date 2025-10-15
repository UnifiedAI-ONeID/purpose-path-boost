import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Video, MessageCircle, Loader2, ArrowLeft } from 'lucide-react';
import { track } from '@/analytics/events';
import { COACHING_PACKAGES, type CoachingPackageId } from '@/lib/airwallex';
import { toast } from 'sonner';

export default function MobileBook() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSession, setSelectedSession] = useState<typeof sessionTypes[0] | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [calReady, setCalReady] = useState(false);

  useEffect(() => {
    track('page_view', { page: 'mobile_book' });
    
    // Initialize Cal.com
    const initializeCal = () => {
      if (typeof window !== 'undefined' && window.Cal) {
        try {
          window.Cal('init', { origin: 'https://cal.com' });
          console.log('[Cal.com] Initialized');
          setCalReady(true);
          return true;
        } catch (error) {
          console.error('[Cal.com] Init error:', error);
          return false;
        }
      }
      return false;
    };

    if (!initializeCal()) {
      const interval = setInterval(() => {
        if (initializeCal()) clearInterval(interval);
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        if (!calReady) toast.error('Booking system failed to load. Please refresh.');
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [calReady]);

  const sessionTypes = [
    {
      icon: Calendar,
      title: 'Discovery Session',
      duration: '30 min',
      price: 'Free',
      priceAmount: 0,
      description: 'Explore if coaching is right for you',
      calLink: 'zhengrowth/discovery',
      eventType: 'discovery-30min',
      packageId: 'discovery' as CoachingPackageId,
    },
    {
      icon: Video,
      title: 'Single Session',
      duration: '60 min',
      price: '$200',
      priceAmount: 200,
      description: 'One-on-one focused coaching',
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
      description: 'Weekly sessions + email support',
      calLink: 'zhengrowth/monthly-package',
      eventType: 'monthly-package',
      packageId: 'monthly' as CoachingPackageId,
    },
  ];

  const handleSelectSession = (session: typeof sessionTypes[0]) => {
    track('booking_initiated', {
      session_type: session.eventType,
      price: session.price,
    });

    if (session.priceAmount === 0) {
      // Free session - open Cal.com immediately
      if (!calReady) {
        toast.error('Booking system is loading. Please wait...');
        return;
      }

      try {
        window.Cal('ui', {
          styles: { branding: { brandColor: '#000000' } },
          hideEventTypeDetails: false,
          layout: 'month_view'
        });

        window.Cal('modal', {
          calLink: session.calLink,
          config: {
            name: customerName || '',
            email: customerEmail || '',
            notes: 'Free discovery session',
            theme: 'light',
          }
        });
      } catch (error) {
        console.error('[Cal.com] Error:', error);
        toast.error('Failed to open calendar. Please try again.');
      }
    } else {
      // Paid session - go to payment details
      setSelectedSession(session);
      setStep(2);
    }
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
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error(error.message || 'Payment failed');
      }

      const paymentLink = await response.json();

      sessionStorage.setItem('booking_customer_name', customerName);
      sessionStorage.setItem('booking_customer_email', customerEmail);
      sessionStorage.setItem('booking_cal_link', selectedSession.calLink);

      track('payment_redirect', { session_type: selectedSession.eventType });
      window.location.href = paymentLink.url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
      track('payment_failed', {
        session_type: selectedSession?.eventType,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle return from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      const name = sessionStorage.getItem('booking_customer_name') || '';
      const email = sessionStorage.getItem('booking_customer_email') || '';
      const calLink = sessionStorage.getItem('booking_cal_link') || '';

      toast.success('Payment successful! Please select your session time.');

      if (window.Cal && calLink) {
        setTimeout(() => {
          window.Cal('modal', {
            calLink,
            config: { name, email, notes: 'Paid session', theme: 'light' }
          });
        }, 500);
      }

      sessionStorage.removeItem('booking_customer_name');
      sessionStorage.removeItem('booking_customer_email');
      sessionStorage.removeItem('booking_cal_link');
      window.history.replaceState({}, '', '/book');
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg pb-20">
      {step === 1 ? (
        <div className="p-4 space-y-4">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-fg mb-2">Book a Session</h1>
            <p className="text-sm text-muted">Choose the format that works for you</p>
          </div>

          <div className="space-y-3">
            {sessionTypes.map((session, index) => {
              const Icon = session.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleSelectSession(session)}
                  disabled={!calReady && session.priceAmount === 0}
                  className="w-full p-4 rounded-2xl border border-border bg-surface text-left hover:shadow-md transition-all disabled:opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-10 w-10 text-accent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-fg">{session.title}</h3>
                      <p className="text-xs text-muted mt-1">{session.duration} · {session.description}</p>
                      <p className="text-lg font-bold text-accent mt-2">{session.price}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-brand/10 border border-accent/30 text-center">
            <p className="text-sm text-muted mb-3">Not sure? Start with a free discovery call.</p>
            <Button 
              onClick={() => handleSelectSession(sessionTypes[0])}
              className="w-full bg-accent text-brand hover:bg-accent/90"
              disabled={!calReady}
            >
              {!calReady ? 'Loading...' : 'Book Free Discovery'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <button 
            onClick={() => { setStep(1); setSelectedSession(null); }}
            className="flex items-center gap-2 text-muted hover:text-fg"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-fg">Payment Details</CardTitle>
              <p className="text-sm text-muted">Complete payment to schedule your session</p>
            </CardHeader>
            <CardContent>
              {selectedSession && (
                <>
                  <div className="p-4 bg-surface rounded-xl border border-border mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-fg">{selectedSession.title}</h3>
                        <p className="text-xs text-muted mt-1">{selectedSession.duration}</p>
                      </div>
                      <p className="text-xl font-bold text-accent">{selectedSession.price}</p>
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

                    <Button
                      type="submit"
                      className="w-full bg-brand text-white hover:bg-brand/90 h-12"
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

                    <p className="text-xs text-muted text-center">
                      Secure payment via Airwallex. You'll schedule after payment.
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
