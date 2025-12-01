/**
 * @file Renders the detailed page for a specific coaching program.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SEOHelmet from '@/components/SEOHelmet';
import CoachingCTA from '@/components/CoachingCTA';
import { usePrefs } from '@/prefs/PrefsProvider';
import { useI18nFetch } from '@/hooks/useI18nFetch';
import { invokeApi } from '@/lib/api-client';
import { sanitizeHtml } from '@/lib/sanitize';
import { logger } from '@/lib/log';

// --- Type Definitions ---

interface CoachingOffer {
  slug: string;
  billing_type: 'free' | 'paid';
}

interface LocalizedContent {
  title: string;
  summary: string;
  body: string;
}

interface PageData {
  hero_image?: string;
  faqs?: { q: string; a: string; lang?: string }[];
}

interface CoachingData {
  ok: boolean;
  offer: CoachingOffer;
  localized: LocalizedContent;
  page: PageData;
}

// --- Main Component ---

export default function CoachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = usePrefs();
  
  const { data, loading, error } = useI18nFetch<CoachingData>(slug ? `/api/coaching/get?slug=${slug}` : '', [slug]);

  useEffect(() => {
    if (!slug || !data?.offer) return;

    // Handle post-payment redirects.
    const params = new URLSearchParams(window.location.search);
    if (params.get('paid') === '1') {
      const name = params.get('name') || '';
      const email = params.get('email') || '';
      
      invokeApi<{ ok: boolean; url?: string }>('/api/coaching/book-url', {
        method: 'POST',
        body: { slug, name, email }
      })
      .then(result => {
        if (result.ok && result.url) {
          window.location.href = result.url;
        } else {
          toast.error("Could not retrieve your unique booking link. Please check your email.");
        }
      }).catch(err => {
        logger.error(`[CoachingDetail] Booking URL fetch failed for slug ${slug}`, { error: err });
        toast.error("An error occurred while fetching your booking link.");
      });
    }
  }, [slug, data]);

  if (loading) return <LoadingState />;
  if (error || !data?.ok || !data.offer) return <NotFoundState />;

  const { offer, localized, page } = data;

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <SEOHelmet
        title={`${localized?.title || 'Coaching'} | ZhenGrowth`}
        description={localized?.summary || 'Professional coaching with Amelda Chen'}
        path={`/coaching/${offer.slug}`}
      />
      <BackLink />
      <Header title={localized.title} summary={localized.summary} isFree={offer.billing_type === 'free'} slug={offer.slug} />
      {page?.hero_image && <HeroImage src={page.hero_image} alt={localized.title} />}
      {localized.body && <ArticleBody htmlContent={localized.body} />}
      {page?.faqs && <FAQSection faqs={page.faqs} lang={lang} />}
    </main>
  );
}

// --- Sub-components ---

const LoadingState = () => (
  <main className="container mx-auto px-4 py-12">
    <div className="animate-pulse space-y-4 max-w-4xl">
      <div className="h-8 bg-muted rounded w-3/4" />
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="h-64 bg-muted rounded-2xl w-full" />
    </div>
  </main>
);

const NotFoundState = () => (
  <main className="container mx-auto px-4 py-12">
    <div className="rounded-2xl border border-border p-8 text-center">
      <h1 className="text-2xl font-bold mb-2">Program Not Found</h1>
      <p className="text-muted-foreground mb-4">The coaching program you're looking for doesn't seem to exist.</p>
      <Link to="/coaching" className="btn btn-primary">View All Programs</Link>
    </div>
  </main>
);

const BackLink = () => (
  <Link to="/coaching" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
    ← Back to all programs
  </Link>
);

const Header = ({ title, summary, isFree, slug }: { title: string; summary: string; isFree: boolean, slug: string }) => (
  <header className="rounded-2xl p-8 mb-8 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h1 className="text-4xl font-bold mb-3 text-foreground">{title}</h1>
        <p className="text-lg text-muted-foreground leading-relaxed">{summary}</p>
      </div>
      {isFree && <span className="badge badge-primary whitespace-nowrap">FREE SESSION</span>}
    </div>
    <CoachingCTA slug={slug} />
  </header>
);

const HeroImage = ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} className="w-full h-auto rounded-2xl mb-8 object-cover" loading="lazy" />
);

const ArticleBody = ({ htmlContent }: { htmlContent: string }) => (
    <article className="prose prose-lg max-w-none mb-8" dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }} />
);

const FAQSection = ({ faqs, lang }: { faqs: PageData['faqs'], lang: string }) => {
    const filteredFaqs = faqs?.filter(faq => !faq.lang || faq.lang === lang);
    if (!filteredFaqs || filteredFaqs.length === 0) return null;
    
    return (
        <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {filteredFaqs.map((faq, i) => (
                    <div key={i} className="card p-4">
                        <h3 className="font-semibold mb-2">{faq.q}</h3>
                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
