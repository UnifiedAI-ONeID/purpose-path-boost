import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { track } from '@/analytics/events';
import { Link } from 'react-router-dom';

export default function MobileHome() {
  const { t } = useTranslation('home');

  useEffect(() => {
    track('page_view', { page: 'mobile_home' });
  }, []);

  const programs = [
    {
      title: "Career Breakthrough",
      description: "Navigate transitions with clarity",
      duration: "6–8 weeks · 1:1",
      link: "/coaching#career"
    },
    {
      title: "Leadership Accelerator",
      description: "Lead with confidence and impact",
      duration: "6–8 weeks · 1:1",
      link: "/coaching#leadership"
    },
    {
      title: "Life Reset",
      description: "Realign with your purpose",
      duration: "6–8 weeks · 1:1",
      link: "/coaching#life"
    },
    {
      title: "Executive Presence",
      description: "Elevate your influence",
      duration: "4 weeks · 1:1",
      link: "/coaching#executive"
    },
    {
      title: "Work-Life Integration",
      description: "Balance without burnout",
      duration: "6 weeks · 1:1",
      link: "/coaching#balance"
    }
  ];

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Compact Hero */}
      <header className="p-6 pt-8">
        <h1 className="text-2xl font-serif font-bold text-fg mb-3 leading-tight">
          Grow with clarity,<br />confidence, purpose
        </h1>
        <p className="text-sm text-muted mb-5">
          Personalized coaching for Chinese-speaking professionals.
        </p>
        <Link 
          to="/book" 
          className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-brand text-white hover:bg-brand/90 transition-all shadow-lg font-medium animate-fade-in"
        >
          Book a clarity session
        </Link>
      </header>

      {/* Horizontal Carousel with Peek & Snap */}
      <section className="mt-8 px-4">
        <h2 className="font-semibold text-fg mb-4 px-2">Popular programs</h2>
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
          {programs.map((program, index) => (
            <Link
              key={index}
              to={program.link}
              className="min-w-[85%] snap-start shrink-0 p-5 rounded-2xl border border-border bg-surface hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="font-semibold text-fg text-lg mb-2">{program.title}</h3>
              <p className="text-sm text-muted mb-3">{program.description}</p>
              <p className="text-xs text-muted/80">{program.duration}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-6 pointer-events-none z-10">
        <Link 
          to="/book" 
          className="block w-full h-14 rounded-2xl bg-brand text-white flex items-center justify-center shadow-2xl hover:bg-brand/90 transition-all pointer-events-auto font-semibold text-base hover-scale"
        >
          Book now
        </Link>
      </div>
    </div>
  );
}
