import SiteShell from '@/components/SiteShell';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { triggerHomeAnim } from '@/anim/animator';
import { usePrefs } from '@/prefs/PrefsProvider';
import { SEOHelmet } from '@/components/SEOHelmet';
import Testimonials from '@/components/Testimonials';

export default function Home() {
  const { lang } = usePrefs();
  
  return (
    <SiteShell>
      <SEOHelmet
        title="ZhenGrowth - Grow with Clarity, Confidence, and Purpose"
        description="Transform your career and life with personalized coaching. Expert guidance for Chinese-speaking professionals seeking clarity, confidence, and sustainable growth."
        path="/home"
        lang={lang as 'en'|'zh-CN'|'zh-TW'}
        image="https://zhengrowth.com/app-icon.png"
      />
      <section className="rounded-2xl p-6 md:p-8 text-white" style={{ background: 'var(--grad-brand)' }}>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          {lang === 'zh-CN' ? '在清晰中成长' : lang === 'zh-TW' ? '在清晰中成長' : 'Grow with Clarity'}
        </h1>
        <p className="text-lg opacity-90 mb-6">
          {lang === 'zh-CN' 
            ? '为全球华语专业人士提供宁静而持久的改变之路 — 生涯与生活辅导' 
            : lang === 'zh-TW' 
            ? '為全球華語專業人士提供寧靜而持久的改變之路 — 生涯與生活輔導' 
            : 'A calm path to lasting change — coaching for Chinese-speaking professionals worldwide'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <SmartLink to={ROUTES.pwaQuiz}>
            <button className="btn btn-cta w-full sm:w-auto" onClick={() => triggerHomeAnim(650)}>
              {lang === 'zh-CN' ? '开始60秒自我评估' : lang === 'zh-TW' ? '開始60秒自我評估' : 'Start 60-second self-assessment'}
            </button>
          </SmartLink>
          <SmartLink to={ROUTES.coaching}>
            <button className="btn btn-ghost text-white border-white/30 hover:bg-white/10 w-full sm:w-auto">
              {lang === 'zh-CN' ? '探索辅导项目' : lang === 'zh-TW' ? '探索輔導項目' : 'Explore Coaching'}
            </button>
          </SmartLink>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">
          {lang === 'zh-CN' ? '客户评价' : lang === 'zh-TW' ? '客戶評價' : 'What Our Clients Say'}
        </h2>
        <Testimonials />
      </section>
    </SiteShell>
  );
}
