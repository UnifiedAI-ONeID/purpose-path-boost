import SiteShell from '@/components/SiteShell';
import { useI18nFetch } from '@/hooks/useI18nFetch';
import CoachingCard from '@/components/CoachingCard';
import { usePrefs } from '@/prefs/PrefsProvider';
import { SEOHelmet } from '@/components/SEOHelmet';

type ListResponse = {
  ok: boolean;
  rows: any[];
  lang: string;
};

export default function CoachingPrograms() {
  const { data, loading, error } = useI18nFetch<ListResponse>('/api/coaching/list');
  const { lang } = usePrefs();

  return (
    <SiteShell>
      <SEOHelmet
        title={lang === 'zh-CN' ? '辅导项目 | ZhenGrowth' : lang === 'zh-TW' ? '輔導項目 | ZhenGrowth' : 'Coaching Programs | ZhenGrowth'}
        description={lang === 'zh-CN' ? '选择适合你的路径 — 立即预约专业的生涯与生活辅导' : lang === 'zh-TW' ? '選擇適合你的路徑 — 立即預約專業的生涯與生活輔導' : 'Choose the path that fits — book instantly with professional life and career coaching'}
        path="/coaching"
        lang={lang as 'en'|'zh-CN'|'zh-TW'}
        image="https://zhengrowth.com/app-icon.png"
      />
      <header className="rounded-2xl p-5 md:p-8 text-white mb-4" style={{ background: 'var(--grad-brand)' }}>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {lang === 'zh-CN' ? '辅导项目' : lang === 'zh-TW' ? '輔導項目' : 'Coaching'}
        </h1>
        <p className="opacity-90">
          {lang === 'zh-CN' ? '选择适合你的路径 — 立即预约' : lang === 'zh-TW' ? '選擇適合你的路徑 — 立即預約' : 'Choose the path that fits — book instantly'}
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-3" data-coaching-grid>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-40" />
          ))
        ) : error ? (
          <div className="card col-span-2 text-destructive">
            {String(error)}
          </div>
        ) : (
          data?.rows?.map((o: any) => <CoachingCard key={o.slug} offer={o} />)
        )}
      </section>
    </SiteShell>
  );
}
