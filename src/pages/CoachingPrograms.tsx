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
      
      <header className="rounded-2xl p-6 md:p-8 mb-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
          {lang === 'zh-CN' ? '辅导项目' : lang === 'zh-TW' ? '輔導項目' : 'Coaching Programs'}
        </h1>
        <p className="text-lg text-muted-foreground">
          {lang === 'zh-CN' ? '选择适合你的路径 — 立即预约专业的生涯与生活辅导' : 
           lang === 'zh-TW' ? '選擇適合你的路徑 — 立即預約專業的生涯與生活輔導' : 
           'Choose the path that fits — book instantly with professional life and career coaching'}
        </p>
      </header>

{loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border p-6 animate-pulse">
              <div className="h-6 bg-muted rounded w-3/4 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-5/6 mb-4" />
              <div className="h-10 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-semibold mb-2">Failed to load coaching programs</p>
          <p className="text-sm text-muted-foreground">{String(error)}</p>
        </div>
      ) : !data?.ok || !data?.rows?.length ? (
        <div className="rounded-2xl border border-border p-8 text-center">
          <p className="text-muted-foreground">No coaching programs available at this time.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.rows.map((offer: any) => (
            <CoachingCard key={offer.slug} offer={offer} />
          ))}
        </div>
      )}
    </SiteShell>
  );
}
