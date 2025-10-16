import React from 'react';
import { Helmet } from 'react-helmet-async';
import { OrgJsonLD, WebsiteJsonLD } from './JsonLD';
import Robots from './Robots';

/** Common head bundle for site-wide meta tags */
export function GlobalHead() {
  return (
    <>
      <Helmet>
        {/* Favicon */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/app-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#0b1f1f" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Charset */}
        <meta charSet="utf-8" />
        
        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Performance hints */}
        <link rel="preconnect" href="https://cdn.zhengrowth.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/app-icon.png" imageSizes="192x192" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </Helmet>
      
      <OrgJsonLD />
      <WebsiteJsonLD />
      <Robots content="index,follow" />
    </>
  );
}

/** Per-page SEO with sane defaults */
export function PageHead({
  title, 
  description, 
  path='/', 
  lang='en', 
  image, 
  robots='index,follow',
  noIndex=false
}:{
  title: string;
  description: string;
  path?: string;
  lang?: 'en'|'zh-CN'|'zh-TW';
  image?: string;
  robots?: 'index,follow'|'noindex,follow'|'noindex,nofollow'|'index,nofollow';
  noIndex?: boolean;
}) {
  return (
    <>
      <SEOHelmet 
        title={title} 
        description={description} 
        path={path} 
        lang={lang} 
        image={image}
        noIndex={noIndex}
      />
      <Robots content={noIndex ? 'noindex,nofollow' : robots} />
    </>
  );
}

// Import SEOHelmet for use in PageHead
import { SEOHelmet } from './SEOHelmet';
