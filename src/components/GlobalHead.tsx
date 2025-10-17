import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { OrgJsonLD, WebsiteJsonLD } from './JsonLD';
import Robots from './Robots';

/** Common head bundle for site-wide meta tags */
export function GlobalHead() {
  // Compute manifest path without hooks to avoid invalid hook call issues
  const manifestHref = (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
    ? '/admin/manifest.webmanifest'
    : '/manifest.json';

  return (
    <>
      <Helmet>
        {/* Favicon - Multiple sizes for better compatibility */}
        <link rel="icon" type="image/png" sizes="192x192" href="/app-icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/app-icon-512.png" />
        <link rel="shortcut icon" href="/app-icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* Manifest */}
        <link rel="manifest" href={manifestHref} />
        
        {/* Theme color */}
        <meta name="theme-color" content="#0b1f1f" />
        
        {/* Viewport */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* Charset */}
        <meta charSet="utf-8" />
        
        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZhenGrowth" />
        
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/assets/splash/launch-1290x2796.png" media="(device-width:430px) and (device-height:932px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/assets/splash/launch-1179x2556.png" media="(device-width:393px) and (device-height:852px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/assets/splash/launch-1284x2778.png" media="(device-width:428px) and (device-height:926px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/assets/splash/launch-1170x2532.png" media="(device-width:390px) and (device-height:844px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/assets/splash/launch-1125x2436.png" media="(device-width:375px) and (device-height:812px) and (-webkit-device-pixel-ratio:3)" />
        <link rel="apple-touch-startup-image" href="/assets/splash/launch-1242x2688.png" media="(device-width:414px) and (device-height:896px) and (-webkit-device-pixel-ratio:3)" />
        
        {/* Performance hints */}
        <link rel="preconnect" href="https://cdn.zhengrowth.com" crossOrigin="anonymous" />
        <link rel="preload" as="image" href="/app-icon-192.png" imageSizes="192x192" />
        
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
