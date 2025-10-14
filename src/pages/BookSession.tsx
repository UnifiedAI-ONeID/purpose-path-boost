import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { track } from '@/analytics/events';
import Cal, { getCalApi } from '@calcom/embed-react';
import { useEffect } from 'react';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  goal: z.string().min(10, 'Please describe your goal (minimum 10 characters)'),
  challenge: z.string().min(10, 'Please describe your challenge (minimum 10 characters)'),
  timeline: z.enum(['urgent', '1month', '3months', 'flexible']),
  language: z.enum(['en', 'zh-TW', 'zh-CN']),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const BookSession = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showCalendar, setShowCalendar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      language: 'en',
      timeline: 'flexible',
    },
  });

  useEffect(() => {
    track('book_view');
  }, []);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal('ui', {
        theme: 'light',
        styles: { branding: { brandColor: '#0B3D3C' } },
      });
    })();
  }, []);

  const onSubmit = (data: BookingFormData) => {
    track('book_start', {
      goal: data.goal.substring(0, 50),
      timeline: data.timeline,
      language: data.language,
    });
    
    // Store form data for thank you page
    sessionStorage.setItem('bookingData', JSON.stringify(data));
    setShowCalendar(true);
  };

  const formData = watch();

  if (showCalendar) {
    return (
      <div className="min-h-screen py-20 bg-background">
        <div className="container max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-serif font-bold mb-4">
                Choose Your Time
              </h1>
              <p className="text-lg text-muted-foreground">
                Select a time that works best for your schedule
              </p>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Cal
                  calLink="zhengrowth/discovery"
                  config={{
                    name: formData.name,
                    email: formData.email,
                    notes: `Goal: ${formData.goal}\nChallenge: ${formData.challenge}\nTimeline: ${formData.timeline}`,
                    metadata: {
                      language: formData.language,
                    },
                  }}
                  style={{ width: '100%', height: '100%', overflow: 'scroll' }}
                />
              </CardContent>
            </Card>

            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => setShowCalendar(false)}>
                ← Back to Form
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 bg-background">
      <div className="container max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif font-bold mb-4">
              Book Your Discovery Session
            </h1>
            <p className="text-xl text-muted-foreground">
              Free 30-minute clarity call - Let's explore how coaching can help you grow
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-brand-accent text-white' : 'bg-muted'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-brand-accent text-white' : 'bg-muted'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Schedule</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tell Me About Your Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" {...register('name')} />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input id="email" type="email" {...register('email')} />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="goal">What's your primary goal? *</Label>
                  <Textarea
                    id="goal"
                    {...register('goal')}
                    placeholder="e.g., I want to transition to a leadership role..."
                    rows={3}
                  />
                  {errors.goal && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.goal.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="challenge">
                    What's your biggest challenge right now? *
                  </Label>
                  <Textarea
                    id="challenge"
                    {...register('challenge')}
                    placeholder="e.g., I feel stuck and unclear about my next steps..."
                    rows={3}
                  />
                  {errors.challenge && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.challenge.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="timeline">When do you want to achieve this? *</Label>
                  <select
                    id="timeline"
                    {...register('timeline')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="urgent">As soon as possible (urgent)</option>
                    <option value="1month">Within 1 month</option>
                    <option value="3months">Within 3 months</option>
                    <option value="flexible">I'm flexible</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="language">Preferred Session Language *</Label>
                  <select
                    id="language"
                    {...register('language')}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="zh-TW">繁體中文</option>
                    <option value="zh-CN">简体中文</option>
                  </select>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-brand-accent flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">What to expect:</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• 30-minute video call via Zoom</li>
                        <li>• Discuss your goals and challenges</li>
                        <li>• Get initial clarity and direction</li>
                        <li>• Explore if coaching is right for you</li>
                        <li>• No pressure, no commitment required</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button type="submit" variant="cta" size="lg" className="w-full">
                  Continue to Schedule
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BookSession;
