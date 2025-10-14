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

const Book = () => {
  const { t } = useTranslation('common');
  const [selectedSession, setSelectedSession] = useState<typeof sessionTypes[0] | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    track('page_view', { page: 'book' });
  }, []);

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
    track('booking_initiated', {
      session_type: session.eventType,
      price: session.price,
      duration: session.duration,
    });

    // Free session - go straight to Cal.com
    if (session.priceAmount === 0) {
      if (typeof window !== 'undefined' && window.Cal) {
        window.Cal('modal', {
          calLink: session.calLink,
          config: {
            name: customerName || '',
            email: customerEmail || '',
            notes: '',
            guests: [],
            theme: 'light',
          },
        });
      }
      return;
    }

    // Paid session - show payment form
    setSelectedSession(session);
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

  return (
    <div className="min-h-screen py-20 bg-bg">
      <div className="container max-w-5xl">
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
                  <Card key={index} className="hover:shadow-soft transition-smooth border-border">
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
                        className="w-full bg-cta text-white hover:opacity-90"
                      >
                        {session.priceAmount === 0 ? 'Schedule Now' : 'Pay & Schedule'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-surface border-border">
              <CardContent className="pt-6 text-center">
                <p className="text-muted mb-4">
                  Not sure which option is right for you? Start with a free discovery session.
                </p>
                <Button 
                  onClick={() => handleBooking(sessionTypes[0])}
                  className="bg-brand text-white hover:opacity-90"
                  size="lg"
                >
                  Book Free Discovery Call
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
                      className="flex-1 border-border text-fg"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-cta text-white hover:opacity-90"
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
