import React from 'react';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function OrgJsonLD() {
  return (
    <JsonLd data={{
      "@context":"https://schema.org",
      "@type":"Organization",
      "name":"ZhenGrowth",
      "url":"https://zhengrowth.com",
      "logo":"https://zhengrowth.com/logo.png",
      "sameAs":[
        "https://www.linkedin.com/company/zhengrowth",
        "https://www.instagram.com/zhengrowth"
      ]
    }}/>
  );
}

export function WebsiteJsonLD() {
  return (
    <JsonLd data={{
      "@context":"https://schema.org",
      "@type":"WebSite",
      "name":"ZhenGrowth",
      "url":"https://zhengrowth.com",
      "potentialAction": {
        "@type":"SearchAction",
        "target":"https://zhengrowth.com/search?q={query}",
        "query-input":"required name=query"
      }
    }}/>
  );
}

interface ArticlePost {
  title: string;
  slug: string;
  published_at: string;
  updated_at?: string;
  lang?: string;
  tags?: string[];
}

export function ArticleJsonLD({ post }:{ post: ArticlePost }) {
  return (
    <JsonLd data={{
      "@context":"https://schema.org",
      "@type":"Article",
      "headline": post.title,
      "image": [`https://cdn.zhengrowth.com/og/blog/${post.slug}.png`],
      "author": [{"@type":"Person","name":"Grace Huang"}],
      "datePublished": post.published_at,
      "dateModified": post.updated_at || post.published_at,
      "inLanguage": post.lang || "en",
      "keywords": (post.tags||[]).join(', '),
      "publisher": {"@type":"Organization","name":"ZhenGrowth","logo":{"@type":"ImageObject","url":"https://zhengrowth.com/logo.png"}}
    }}/>
  );
}

interface EventInfo {
  title: string;
  start_at: string;
  end_at: string;
  cover_url: string;
  summary: string;
  meeting_url?: string;
  slug: string;
}

interface TicketInfo {
  price_cents: number;
  currency: string;
}

export function EventJsonLD({ ev, tickets }:{ ev: EventInfo; tickets: TicketInfo[] }) {
  return (
    <JsonLd data={{
      "@context":"https://schema.org",
      "@type":"Event",
      "name": ev.title,
      "startDate": ev.start_at,
      "endDate": ev.end_at,
      "eventAttendanceMode":"https://schema.org/OnlineEventAttendanceMode",
      "eventStatus":"https://schema.org/EventScheduled",
      "image":[ev.cover_url],
      "description": ev.summary,
      "location": { "@type":"VirtualLocation", "url": ev.meeting_url || `https://zhengrowth.com/events/${ev.slug}` },
      "organizer": { "@type":"Organization", "name":"ZhenGrowth", "url":"https://zhengrowth.com" },
      "offers": [{
        "@type":"Offer",
        "price": (tickets?.[0]?.price_cents||0)/100,
        "priceCurrency": tickets?.[0]?.currency || "USD",
        "availability": "https://schema.org/InStock",
        "url": `https://zhengrowth.com/events/${ev.slug}`
      }]
    }}/>
  );
}

export function ProductJsonLD({ priceCents, currency }:{ priceCents:number; currency:string }) {
  return (
    <JsonLd data={{
      "@context":"https://schema.org",
      "@type":"Product",
      "name":"30-min Priority Consult",
      "brand":{"@type":"Brand","name":"ZhenGrowth"},
      "description":"48-hour response SLA, action plan in 30 minutes.",
      "offers":{
        "@type":"Offer","price":(priceCents/100).toFixed(2),
        "priceCurrency": currency,"url":"https://zhengrowth.com/contact#priority",
        "availability":"https://schema.org/InStock"
      }
    }}/>
  );
}

export function FAQJsonLD({ qa }:{ qa:{ q:string; a:string }[] }) {
  return (
    <JsonLd data={{
      "@context":"https://schema.org",
      "@type":"FAQPage",
      "mainEntity": qa.map(x=>({ "@type":"Question","name":x.q,"acceptedAnswer":{ "@type":"Answer","text":x.a }}))
    }}/>
  );
}
