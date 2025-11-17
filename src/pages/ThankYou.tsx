import { useEffect } from 'react';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, Mail, Download } from 'lucide-react';
import { trackEvent } from '@/lib/trackEvent';

const ThankYou = () => {
  useEffect(() => {
    trackEvent('book_complete');
  }, []);

  return (
    <div className="min-h-screen py-20 bg-gradient-primary">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-accent/20 mb-6">
              <CheckCircle className="h-10 w-10 text-brand-accent" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white mb-4">
              You're All Set!
            </h1>
            <p className="text-xl text-white/90">
              Your discovery session has been confirmed
            </p>
          </div>

          <Card>
            <CardContent className="pt-8">
              <div className="space-y-6">
                <div className="text-left space-y-4">
                  <h2 className="text-2xl font-serif font-semibold">What Happens Next?</h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Mail className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Check Your Email</p>
                        <p className="text-sm text-muted-foreground">
                          You'll receive a confirmation email with your Zoom link and calendar invite
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Download className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Prepare for Your Session</p>
                        <p className="text-sm text-muted-foreground">
                          Take a moment to think about your goals and what you want to achieve
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Calendar className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Join at Your Scheduled Time</p>
                        <p className="text-sm text-muted-foreground">
                          I'll meet you on Zoom - come prepared with questions!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Need to reschedule? Use the link in your confirmation email.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button asChild variant="default" size="lg" className="flex-1">
                      <SmartLink to={ROUTES.home}>Return Home</SmartLink>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="flex-1">
                      <SmartLink to={ROUTES.quiz}>Take the Clarity Quiz</SmartLink>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <p className="text-white/80 text-sm">
              Looking forward to meeting you! 🎯
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ThankYou;
