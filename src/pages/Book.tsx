import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Video, MessageCircle } from 'lucide-react';

const Book = () => {
  const { t } = useTranslation('common');

  const sessionTypes = [
    {
      icon: Calendar,
      title: 'Discovery Session',
      duration: '30 minutes',
      price: 'Free',
      description: 'Get to know each other and explore if coaching is right for you',
    },
    {
      icon: Video,
      title: 'Single Session',
      duration: '60 minutes',
      price: '$200',
      description: 'One-on-one coaching focused on your specific challenge',
    },
    {
      icon: MessageCircle,
      title: 'Monthly Package',
      duration: '4 sessions',
      price: '$700',
      description: 'Ongoing support with weekly sessions and email check-ins',
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif font-bold mb-4">Book a Session</h1>
          <p className="text-xl text-muted-foreground">
            Choose the coaching format that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {sessionTypes.map((session, index) => {
            const Icon = session.icon;
            return (
              <Card key={index} className="hover:shadow-medium transition-smooth">
                <CardHeader>
                  <Icon className="h-12 w-12 text-brand-accent mb-4" />
                  <CardTitle>{session.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{session.duration}</p>
                  <p className="text-2xl font-bold text-brand-accent mt-2">{session.price}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{session.description}</p>
                  <Button variant="cta" className="w-full">
                    Schedule Now
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              Not sure which option is right for you? Start with a free discovery session.
            </p>
            <Button variant="outline" size="lg">
              Contact Me
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Book;
