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
      description: "Results in 6–8 weeks · 1:1",
      link: "/coaching#career"
    },
    {
      title: "Leadership",
      description: "Results in 6–8 weeks · 1:1",
      link: "/coaching#leadership"
    },
    {
      title: "Life Reset",
      description: "Results in 6–8 weeks · 1:1",
      link: "/coaching#life"
    }
  ];

  return (
    <div className="p-4 space-y-4 pb-20">
      <header className="rounded-2xl p-6 bg-gradient-to-br from-brand/10 to-accent/10 border border-brand/20">
        <h1 className="text-xl font-semibold text-fg mb-2">
          Grow with clarity, confidence, purpose
        </h1>
        <p className="text-sm text-muted mb-4">
          Personalized coaching for Chinese-speaking professionals.
        </p>
        <Link 
          to="/book" 
          className="inline-flex items-center justify-center w-full h-11 rounded-xl bg-brand text-white hover:bg-brand/90 transition-all shadow-md"
        >
          Book a clarity session
        </Link>
      </header>

      <section className="space-y-3">
        <h2 className="font-medium text-fg">Popular programs</h2>
        <div className="flex gap-3 overflow-x-auto snap-x pb-2">
          {programs.map((program) => (
            <Link
              key={program.title}
              to={program.link}
              className="min-w-[72%] snap-start p-4 rounded-2xl border border-border bg-surface hover:shadow-md transition-all"
            >
              <h3 className="font-semibold text-fg">{program.title}</h3>
              <p className="text-sm text-muted">{program.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 mx-auto max-w-md px-4 pointer-events-none">
        <Link 
          to="/book" 
          className="w-full h-12 rounded-xl bg-brand text-white flex items-center justify-center shadow-xl hover:bg-brand/90 transition-all pointer-events-auto"
        >
          Book now
        </Link>
      </div>
    </div>
  );
}
