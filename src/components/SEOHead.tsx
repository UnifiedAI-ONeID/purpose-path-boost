import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

export default function SEOHead({ 
  title = 'ZhenGrowth - Life Coaching & Leadership Development',
  description = 'Clarity. Confidence. Consistency. Professional coaching for career growth and leadership development.',
  image = 'https://zhengrowth.com/og-image.jpg',
  type = 'website'
}: SEOHeadProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const canonicalUrl = `https://zhengrowth.com${pathname}`;

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {/* Canonical and hreflang */}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" href={canonicalUrl} hrefLang="en" />
      <link rel="alternate" href={`https://zhengrowth.com/zh-CN${pathname}`} hrefLang="zh-CN" />
      <link rel="alternate" href={`https://zhengrowth.com/zh-TW${pathname}`} hrefLang="zh-TW" />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
