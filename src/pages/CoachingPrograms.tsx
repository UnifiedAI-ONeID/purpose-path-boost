import { SEOHelmet } from '@/components/SEOHelmet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2 } from 'lucide-react';
import BookSessionLink from '@/components/BookSessionLink';
import { useI18nFetch } from '@/hooks/useI18nFetch';
import CoachingCard from '@/components/CoachingCard';
import SiteShell from '@/components/SiteShell';

type ListResponse = {
  ok: boolean;
  rows: any[];
  lang: string;
};

export default function CoachingPrograms() {
  const { data, loading, error } = useI18nFetch<ListResponse>('/api/coaching/list');

  const freeOfferSlug = data?.rows?.find(o => o.billing_type === 'free')?.slug;

  const outcomes = [
    'Gain crystal-clear clarity on your goals and values',
    'Build unshakeable confidence in your abilities',
    'Develop powerful habits that drive sustainable growth',
    'Navigate life transitions with grace and purpose',
    'Create a personalized roadmap to your ideal future',
    'Master techniques to overcome limiting beliefs'
  ];

  const faqs = [
    {
      question: 'How do I know which program is right for me?',
      answer: 'Start with our free Discovery Session. During this call, we\'ll discuss your goals, challenges, and aspirations to recommend the best program for your needs.'
    },
    {
      question: 'What happens during a coaching session?',
      answer: 'Each session is a focused conversation where we explore your challenges, celebrate wins, and create actionable strategies. You\'ll leave with clarity, motivation, and concrete next steps.'
    },
    {
      question: 'Can I switch programs if my needs change?',
      answer: 'Absolutely! Your growth journey is unique. We can adjust your program as your goals and circumstances evolve.'
    },
    {
      question: 'How long does it take to see results?',
      answer: 'Most clients report noticeable shifts in clarity and confidence within 2-3 sessions. Lasting transformation typically unfolds over 3-6 months of consistent coaching.'
    }
  ];

  return (
    <SiteShell>
      <SEOHelmet 
        title="Coaching Programs - ZhenGrowth"
        description="Personalized coaching programs to help you achieve clarity, confidence, and growth in your personal and professional life."
      />
      
      {/* Hero Section */}
      <header className="rounded-2xl p-8 text-white mb-6" style={{ background: 'var(--grad-brand)' }}>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Transform Your Life with Personal Coaching
        </h1>
        <p className="text-lg opacity-90">
          Whether you're seeking clarity, building confidence, or pursuing mastery, 
          our tailored coaching programs guide you every step of the way.
        </p>
      </header>

      {/* Coaching Programs */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Choose Your Path</h2>
        
        {loading && (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-5 w-1/2 bg-subtle rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-subtle rounded mb-4"></div>
                <div className="h-10 bg-subtle rounded-xl"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="card text-sm text-destructive">Error loading programs: {error}</div>
        )}

        {!loading && !error && data?.rows && (
          <div className="grid md:grid-cols-2 gap-4">
            {data.rows.map(offer => (
              <CoachingCard key={offer.slug} offer={offer} />
            ))}
          </div>
        )}
      </section>

      {/* What You'll Achieve */}
      <section className="mt-8 card">
        <h2 className="text-2xl font-bold mb-6">What You'll Achieve</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {outcomes.map((outcome, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p>{outcome}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-8 card">
        <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="mt-8 rounded-2xl p-8 text-white text-center" style={{ background: 'var(--grad-brand)' }}>
        <h2 className="text-2xl font-bold mb-4">Ready to Begin Your Transformation?</h2>
        <p className="text-lg opacity-90 mb-6">
          Book your free Discovery Session today and take the first step toward 
          the clarity, confidence, and growth you deserve.
        </p>
        {freeOfferSlug && (
          <BookSessionLink 
            slug={freeOfferSlug}
            className="btn btn-hero inline-flex px-8 py-3 text-lg"
          >
            Book Your Free Session Now
          </BookSessionLink>
        )}
      </section>
    </SiteShell>
  );
}
