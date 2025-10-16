import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SEOHelmet from '@/components/SEOHelmet';
import BookCTA from '@/components/BookCTA';
import { useTranslation } from 'react-i18next';

export default function CoachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n } = useTranslation();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/coaching/get?slug=${slug}`)
      .then(r => r.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

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
  const lang = i18n.language as 'en' | 'zh-CN' | 'zh-TW';

  const title = lang === 'zh-CN' ? (offer.title_zh_cn || offer.title_en) :
                lang === 'zh-TW' ? (offer.title_zh_tw || offer.title_en) : 
                offer.title_en;

  const summary = lang === 'zh-CN' ? (offer.summary_zh_cn || offer.summary_en) :
                  lang === 'zh-TW' ? (offer.summary_zh_tw || offer.summary_en) :
                  offer.summary_en;

  const bodyHtml = lang === 'zh-CN' ? page?.body_html_zh_cn :
                   lang === 'zh-TW' ? page?.body_html_zh_tw :
                   page?.body_html_en;

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
        <BookCTA slug={offer.slug} campaign={`coaching-${offer.slug}`} />
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
