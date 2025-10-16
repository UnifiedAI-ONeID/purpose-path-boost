import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHelmet from '@/components/SEOHelmet';
import CoachingCTA from '@/components/CoachingCTA';
import { usePrefs } from '@/prefs/PrefsProvider';
import { pickLang } from '@/i18n/dict';
import { useI18nFetch } from '@/hooks/useI18nFetch';

export default function CoachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = usePrefs();
  
  const { data, loading } = useI18nFetch<any>(slug ? `/api/coaching/get?slug=${slug}` : '', [slug]);
  const localized = data?.localized;

  useEffect(() => {
    if (!slug || !data) return;

    // Check for payment success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
      const name = params.get('name') || '';
      const email = params.get('email') || '';
      
      fetch('/api/coaching/book-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, email })
      })
        .then(r => r.json())
        .then(result => {
          if (result.ok && result.url) {
            window.location.href = result.url;
          }
        });
    }
  }, [slug, data]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </main>
    );
  }

  if (!data?.ok || !data.offer) {
    return (
      <main className="container mx-auto px-4 py-12">
        <div className="rounded-2xl border border-border p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Coaching program not found</h1>
          <p className="text-muted-foreground mb-4">The coaching program you're looking for doesn't exist.</p>
          <Link 
            to="/coaching" 
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View All Programs
          </Link>
        </div>
      </main>
    );
  }

  const { offer, page } = data;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <SEOHelmet
        title={`${localized?.title || 'Coaching'} | ZhenGrowth Coaching`}
        description={localized?.summary || 'Professional coaching with Amelda Chen'}
        path={`/coaching/${offer.slug}`}
      />

      {/* Back link */}
      <Link 
        to="/coaching" 
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        ← Back to all programs
      </Link>

      {/* Hero section */}
      <header className="rounded-2xl p-8 mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-3 text-foreground">{localized?.title}</h1>
            {localized?.summary && (
              <p className="text-lg text-muted-foreground leading-relaxed">{localized.summary}</p>
            )}
          </div>
          {offer.billing_type === 'free' && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary whitespace-nowrap">
              FREE SESSION
            </span>
          )}
        </div>
        <CoachingCTA slug={offer.slug} />
      </header>

      {page?.hero_image && (
        <img
          src={page.hero_image}
          alt={localized?.title || 'Coaching'}
          className="w-full h-auto rounded-2xl mb-8"
          loading="lazy"
        />
      )}

      {localized?.body && (
        <article
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: localized.body }}
        />
      )}

      {page?.faqs && page.faqs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {page.faqs
              .filter((faq: any) => !faq.lang || faq.lang === lang)
              .map((faq: any, i: number) => (
                <div key={i} className="card p-4">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
          </div>
        </section>
      )}
    </main>
  );
}
