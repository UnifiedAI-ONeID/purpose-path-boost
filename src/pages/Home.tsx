import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import { triggerHomeAnim } from '@/anim/animator';
import { usePrefs } from '@/prefs/PrefsProvider';
import { SEOHelmet } from '@/components/SEOHelmet';
import Testimonials from '@/components/Testimonials';
import coachHero from '@/assets/images/coach-hero.jpg';
import { CheckCircle } from 'lucide-react';

export default function Home() {
  const { lang } = usePrefs();
  
  return (
    <>
      <SEOHelmet
        title="ZhenGrowth - Grow with Clarity, Confidence, and Purpose"
        description="Transform your career and life with personalized coaching. Expert guidance for Chinese-speaking professionals seeking clarity, confidence, and sustainable growth."
        path="/home"
        lang={lang as 'en'|'zh-CN'|'zh-TW'}
        image="https://zhengrowth.com/app-icon.png"
      />
      
      {/* Hero Section with Image */}
      <section className="grid md:grid-cols-2 gap-8 items-center rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 p-6 md:p-12">
        <div className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            {lang === 'zh-CN' ? '在清晰中成长' : lang === 'zh-TW' ? '在清晰中成長' : 'Grow with Clarity'}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-6">
            {lang === 'zh-CN' 
              ? '为全球华语专业人士提供宁静而持久的改变之路' 
              : lang === 'zh-TW' 
              ? '為全球華語專業人士提供寧靜而持久的改變之路' 
              : 'A calm path to lasting change for Chinese-speaking professionals worldwide'}
          </p>
          
          {/* Value Props */}
          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground">
                {lang === 'zh-CN' ? '个性化生涯与生活辅导' : lang === 'zh-TW' ? '個性化生涯與生活輔導' : 'Personalized career & life coaching'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground">
                {lang === 'zh-CN' ? '英语和中文双语支持' : lang === 'zh-TW' ? '英語和中文雙語支持' : 'Bilingual support (English & Chinese)'}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-foreground">
                {lang === 'zh-CN' ? '专为专业人士设计' : lang === 'zh-TW' ? '專為專業人士設計' : 'Designed for ambitious professionals'}
              </span>
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <SmartLink to={ROUTES.pwaQuiz}>
              <button className="btn btn-primary w-full sm:w-auto" onClick={() => triggerHomeAnim(650)}>
                {lang === 'zh-CN' ? '开始60秒自我评估' : lang === 'zh-TW' ? '開始60秒自我評估' : 'Start 60-second assessment'}
              </button>
            </SmartLink>
            <SmartLink to={ROUTES.coaching}>
              <button className="btn btn-outline w-full sm:w-auto">
                {lang === 'zh-CN' ? '探索辅导项目' : lang === 'zh-TW' ? '探索輔導項目' : 'Explore Coaching'}
              </button>
            </SmartLink>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative rounded-xl overflow-hidden shadow-2xl">
            <img 
              src={coachHero} 
              alt="Professional coach in modern office setting"
              className="w-full h-auto object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
          </div>
        </div>
      </section>

      <section className="mt-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {lang === 'zh-CN' ? '客户评价' : lang === 'zh-TW' ? '客戶評價' : 'What Our Clients Say'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {lang === 'zh-CN' 
              ? '听听那些通过我们的辅导实现了转变的专业人士的真实故事' 
              : lang === 'zh-TW' 
              ? '聽聽那些通過我們的輔導實現了轉變的專業人士的真實故事' 
              : 'Hear from professionals who have transformed their careers and lives through our coaching'}
          </p>
        </div>
        <Testimonials />
      </section>
    </>
  );
}
