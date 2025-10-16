import { useTranslation } from 'react-i18next';
import SmartLink from '@/components/SmartLink';
import { ROUTES } from '@/nav/routes';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect } from 'react';
import { track } from '@/analytics/events';
import { motion } from 'framer-motion';
import ScrollReveal from '@/components/motion/ScrollReveal';

export default function About(){
  const { t } = useTranslation('about');

  useEffect(() => {
    track('nav_click', { page: 'about' });
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <h1 className="text-4xl font-semibold text-fg">{t('title')}</h1>
        <ThemeToggle />
      </motion.header>

      <section className="grid md:grid-cols-3 gap-8 items-start">
        <ScrollReveal className="md:col-span-2 space-y-5">
          <h2 className="text-2xl font-serif text-brand">{t('hero')}</h2>
          <p className="text-muted">{t('tag')}</p>
          <p className="text-fg">{t('intro_p1')}</p>
          <p className="text-fg">{t('intro_p2')}</p>
          <p className="text-fg">{t('bio_p1')}</p>
          <p className="text-fg">{t('bio_p2')}</p>
          <div className="p-5 rounded-xl bg-surface border border-border shadow-soft">
            <p className="font-medium text-fg">{t('cred')}</p>
          </div>
          <p className="text-fg">{t('life')}</p>
          <p className="text-lg font-medium text-fg">{t('mission')}</p>

          <SmartLink
            to={ROUTES.coaching} 
            className="inline-flex mt-4 items-center gap-2 px-5 py-3 rounded-xl bg-cta text-white shadow-soft hover:opacity-90 transition-smooth"
            onClick={() => track('cta_click', { button: 'Book Free Call', location: 'about_page' })}
          >
            {t('cta')}
          </SmartLink>
        </ScrollReveal>

        <ScrollReveal dir="left" delay={0.2} className="space-y-4">
          <img 
            src="/assets/images/amelda.jpg" 
            alt="Amelda Chen" 
            className="rounded-xl shadow-soft border border-border w-full"
          />
          <div className="text-sm text-muted">
            <p>Follow: <a href="https://www.instagram.com/" className="underline hover:text-brand">Instagram</a> · <a href="https://www.facebook.com/" className="underline hover:text-brand">Facebook</a></p>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
