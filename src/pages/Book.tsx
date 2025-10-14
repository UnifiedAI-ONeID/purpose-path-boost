import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, MessageCircle } from 'lucide-react';
import { track } from '@/analytics/events';

const Book = () => {
  const { t } = useTranslation('common');

  useEffect(() => {
    track('page_view', { page: 'book' });
  }, []);

  const sessionTypes = [
    {
      icon: Calendar,
      title: 'Discovery Session',
      duration: '30 minutes',
      price: 'Free',
      description: 'Get to know each other and explore if coaching is right for you',
      calLink: 'zhengrowth/discovery',
      eventType: 'discovery-30min',
    },
    {
      icon: Video,
      title: 'Single Session',
      duration: '60 minutes',
      price: '$200',
      description: 'One-on-one coaching focused on your specific challenge',
      calLink: 'zhengrowth/single-session',
      eventType: 'single-60min',
    },
    {
      icon: MessageCircle,
      title: 'Monthly Package',
      duration: '4 sessions',
      price: '$700',
      description: 'Ongoing support with weekly sessions and email check-ins',
      calLink: 'zhengrowth/monthly-package',
      eventType: 'monthly-package',
    },
  ];

  const handleBooking = (session: typeof sessionTypes[0]) => {
    track('booking_initiated', {
      session_type: session.eventType,
      price: session.price,
      duration: session.duration,
    });

    if (typeof window !== 'undefined' && window.Cal) {
      window.Cal('modal', {
        calLink: session.calLink,
        config: {
          name: '',
          email: '',
          notes: '',
          guests: [],
          theme: 'light',
        },
      });
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-5xl">
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
                    Schedule Now
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
      </div>
    </div>
  );
};

export default Book;
