import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SEOHelmet from '@/components/SEOHelmet';
import CoachingCTA from '@/components/CoachingCTA';
import { usePrefs } from '@/prefs/PrefsProvider';
import { pickLang } from '@/i18n/dict';
import { useI18nFetch } from '@/hooks/useI18nFetch';

export default function CoachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = usePrefs();
  const [loading, setLoading] = useState(true);
  
  // Use i18n-aware fetch
  const { data } = useI18nFetch<any>(slug ? `/api/coaching/get?slug=${slug}` : '', [slug]);

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
        <h1 className="text-2xl font-bold">Coaching program not found</h1>
      </main>
    );
  }

  const { offer, page } = data;
  const { title, summary, body: bodyHtml } = pickLang({ ...offer, ...page }, lang);

  return (
    <main className="container mx-auto px-4 py-12">
      <SEOHelmet
        title={`${title} | ZhenGrowth Coaching`}
        description={summary || 'Professional coaching with Amelda Chen'}
        path={`/coaching/${offer.slug}`}
      />

      <header className="rounded-2xl p-6 mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {summary && <p className="text-lg text-muted-foreground mb-4">{summary}</p>}
        <CoachingCTA slug={offer.slug} />
      </header>

      {page?.hero_image && (
        <img
          src={page.hero_image}
          alt={title}
          className="w-full h-auto rounded-2xl mb-8"
          loading="lazy"
        />
      )}

      {bodyHtml && (
        <article
          className="prose prose-lg max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
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
