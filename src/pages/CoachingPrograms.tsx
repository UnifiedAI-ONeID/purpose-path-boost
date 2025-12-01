/**
 * @file Renders the page that lists all available coaching programs.
 */

import { useState, useEffect, useCallback } from 'react';
import CoachingCard from '@/components/CoachingCard';
import { usePrefs } from '@/prefs/PrefsProvider';
import { SEOHelmet } from '@/components/SEOHelmet';
import { coachingService, CoachingProgram } from '@/services/coaching';
import { trackEvent } from '@/lib/trackEvent';
import { logger } from '@/lib/log';

// --- I18n Content ---

const i18nContent = {
  en: {
    title: 'Coaching Programs',
    description: 'Choose the path that fits — book instantly with professional life and career coaching.',
    errorTitle: 'Unable to load coaching programs',
    retry: 'Retry',
    noPrograms: 'No coaching programs available at this time.'
  },
  'zh-CN': {
    title: '辅导项目',
    description: '选择适合你的路径 — 立即预约专业的生涯与生活辅导。',
    errorTitle: '无法加载辅导项目',
    retry: '重试',
    noPrograms: '目前没有可用的辅导项目。'
  },
  'zh-TW': {
    title: '輔導項目',
    description: '選擇適合你的路徑 — 立即預約專業的生涯與生活輔導。',
    errorTitle: '無法加載輔導項目',
    retry: '重試',
    noPrograms: '目前沒有可用的輔導項目。'
  },
};

// --- Main Component ---

export default function CoachingPrograms() {
  const { lang } = usePrefs();
  const [programs, setPrograms] = useState<CoachingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const t = i18nContent[lang];

  const loadCoaching = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedPrograms = await coachingService.getPrograms(lang);
      setPrograms(fetchedPrograms);
    } catch (err) {
      const errorMessage = (err as Error).message;
      logger.error('[CoachingPrograms] Failed to load programs.', { error: err });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    trackEvent('coaching_programs_view', { lang });
    loadCoaching();
  }, [loadCoaching, lang]);

  return (
    <>
      <SEOHelmet
        title={t.title}
        description={t.description}
        path="/coaching"
        lang={lang}
      />
      
      <Header title={t.title} description={t.description} />

      {loading && <LoadingState />}
      {error && <ErrorState message={error} t={t} onRetry={loadCoaching} />}
      {!loading && !error && (
        <ProgramsGrid programs={programs} t={t} />
      )}
    </>
  );
}

// --- Sub-components ---

const Header = ({ title, description }: { title: string, description: string }) => (
  <header className="rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
    <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">{title}</h1>
    <p className="text-lg text-muted-foreground">{description}</p>
  </header>
);

const LoadingState = () => (
  <div className="grid md:grid-cols-2 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="rounded-2xl border border-border p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-3/4 mb-3" />
        <div className="h-4 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-5/6 mb-4" />
        <div className="h-10 bg-muted rounded w-full" />
      </div>
    ))}
  </div>
);

const ErrorState = ({ message, t, onRetry }: { message: string; t: typeof i18nContent['en']; onRetry: () => void; }) => (
  <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center">
    <p className="text-destructive font-semibold mb-2">{t.errorTitle}</p>
    <p className="text-sm text-muted-foreground">{message}</p>
    <button onClick={onRetry} className="btn btn-primary mt-4">{t.retry}</button>
  </div>
);

const ProgramsGrid = ({ programs, t }: { programs: CoachingProgram[], t: typeof i18nContent['en'] }) => {
  if (programs.length === 0) {
    return (
      <div className="rounded-2xl border border-border p-8 text-center">
        <p className="text-muted-foreground">{t.noPrograms}</p>
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {programs.map(program => (
        <CoachingCard key={program.slug} offer={program} />
      ))}
    </div>
  );
};
