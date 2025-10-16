import React from 'react';

type RobotsProps = {
  /** 'index,follow' by default */
  content?: 'index,follow'|'noindex,follow'|'noindex,nofollow'|'index,nofollow';
  /** Force-add x-robots for crawlers that honor headers via meta */
  addHttpHint?: boolean;
};

/** Minimal, reusable robots meta tag. */
export default function Robots({ content='index,follow', addHttpHint=false }: RobotsProps){
  // If global indexing disabled via env (e.g., staging) → override to noindex.
  const siteIndex = import.meta.env?.VITE_SEO_INDEX ?? 'true';
  const isPreview = import.meta.env?.MODE === 'preview' || window.location.hostname.includes('lovableproject.com');
  const finalContent = (siteIndex === 'true' && !isPreview) ? content : 'noindex,nofollow';
  
  return (
    <>
      <meta name="robots" content={finalContent} />
      <meta name="googlebot" content={finalContent} />
      {addHttpHint && <meta httpEquiv="X-Robots-Tag" content={finalContent} />}
    </>
  );
}
