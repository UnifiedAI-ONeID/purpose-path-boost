import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { track } from '@/analytics/events';

const CoachingPrograms = () => {
  const { t, i18n } = useTranslation('coaching');
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/coaching/list')
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.rows) {
          setOffers(data.rows);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const lang = i18n.language as 'en' | 'zh-CN' | 'zh-TW';
  const freeOfferSlug = offers.find(o => o.base_price_cents === 0)?.slug || 'discovery-60';

  const outcomes = [
    {
      title: 'Crystal Clear Direction',
      description: 'Know exactly where you\'re headed and why it matters',
    },
    {
      title: 'Confident Decision-Making',
      description: 'Make choices aligned with your values without second-guessing',
    },
    {
      title: 'Sustainable Growth Systems',
      description: 'Build habits and processes that create lasting results',
    },
    {
      title: 'Increased Earning Potential',
      description: 'Position yourself for promotions, raises, and better opportunities',
    },
  ];

  const faqs = [
    {
      question: 'How do I know if coaching is right for me?',
      answer: 'Coaching works best for people who are motivated to grow and willing to take action. If you\'re feeling stuck, unclear about your direction, or ready to level up your career but not sure how - coaching can help. Book a free discovery call to explore if we\'re a good fit.',
    },
    {
      question: 'What\'s the difference between the packages?',
      answer: 'The Discovery Session is perfect for getting started and seeing if coaching resonates with you. Single Sessions work well for specific challenges. The Monthly and Quarterly packages provide ongoing support and accountability for deeper transformation.',
    },
    {
      question: 'How are sessions conducted?',
      answer: 'All sessions are conducted via video call (Zoom). You\'ll receive a calendar invite with the link after booking. Sessions are recorded (with your permission) so you can review key insights.',
    },
    {
      question: 'What if I need to reschedule?',
      answer: 'Life happens! You can reschedule up to 24 hours before your session at no charge. Cancellations within 24 hours forfeit that session.',
    },
    {
      question: 'Do you offer payment plans?',
      answer: 'Yes! Payment plans are available for the Monthly and Quarterly packages. Contact me to discuss options that work for your budget.',
    },
    {
      question: 'What languages do you offer coaching in?',
      answer: 'I offer coaching in English, Traditional Chinese (繁體中文), and Simplified Chinese (简体中文). Choose your preferred language when booking.',
    },
  ];

  return (
    <div className="min-h-screen py-20">
      {/* Hero */}
      <section className="container mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-5xl font-serif font-bold mb-6">
            Coaching Programs
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Personalized coaching to help you gain clarity, build confidence, and achieve
            meaningful growth in your career and life
          </p>
        </motion.div>
      </section>

      {/* Packages */}
      <section className="container mb-20">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No coaching programs available at this time.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offers.map((offer, index) => {
              const isFree = offer.base_price_cents === 0;
              const isFeatured = offer.sort === 1; // Assuming sort=1 for featured
              const title = lang === 'zh-CN' ? (offer.title_zh_cn || offer.title_en) :
                           lang === 'zh-TW' ? (offer.title_zh_tw || offer.title_en) :
                           offer.title_en;
              const summary = lang === 'zh-CN' ? (offer.summary_zh_cn || offer.summary_en) :
                             lang === 'zh-TW' ? (offer.summary_zh_tw || offer.summary_en) :
                             offer.summary_en;
              
              return (
                <motion.div
                  key={offer.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {isFeatured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-brand-accent text-brand-dark px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  <Card
                    className={`h-full ${
                      isFeatured
                        ? 'border-2 border-brand-accent shadow-strong'
                        : 'hover:shadow-medium'
                    } transition-smooth`}
                  >
                    <CardHeader>
                      <CardTitle className="text-2xl">{title}</CardTitle>
                      <div className="mt-4">
                        {isFree ? (
                          <p className="text-4xl font-bold text-brand-accent">Free</p>
                        ) : (
                          <div>
                            <p className="text-4xl font-bold">
                              ${(offer.base_price_cents / 100).toFixed(0)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {offer.base_currency || 'USD'}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">{summary}</p>
                      <div className="space-y-3">
                        <Button
                          asChild
                          variant={isFeatured ? 'cta' : 'default'}
                          className="w-full"
                          onClick={() =>
                            track('cta_click', { offer: offer.slug, action: 'view' })
                          }
                        >
                          <Link to={`/coaching/${offer.slug}`}>
                            {isFree ? 'Book Free Call' : 'View Details'}
                          </Link>
                        </Button>
                        {!isFree && (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              track('cta_click', {
                                offer: offer.slug,
                                action: 'free_call',
                              })
                            }
                          >
                            <Link to={`/coaching/${freeOfferSlug}`}>Free Call First</Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Outcomes */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">
              What You'll Achieve
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real, measurable outcomes that impact your career and quality of life
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {outcomes.map((outcome, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-brand-accent flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg mb-2">
                          {outcome.title}
                        </h3>
                        <p className="text-muted-foreground">
                          {outcome.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="container py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border rounded-lg px-6"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-serif font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Book a free discovery session to explore how coaching can help you achieve
              your goals
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to={`/coaching/${freeOfferSlug}`}>
                Book Your Free Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CoachingPrograms;
