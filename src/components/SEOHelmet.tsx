import React from 'react';
import { Helmet } from 'react-helmet-async';

type Props = {
  title: string;
  description: string;
  path?: string;
  lang?: 'en'|'zh-CN'|'zh-TW';
  image?: string;
  noIndex?: boolean;
  alternates?: { 'en'?:string; 'zh-CN'?:string; 'zh-TW'?:string };
  canonical?: string;
  site?: { host?:string; cnHost?:string };
};

export function SEOHelmet({
  title, description, path='/', lang='en', image, noIndex=false, alternates, canonical, site
}: Props){
  const host = site?.host || 'https://zhengrowth.com';
  const cnHost = site?.cnHost || 'https://zhengrowth.cn';
  const url = canonical || `${host}${path}`;
  // Use high-res app icon (512x512) as default OG image instead of 192x192
  const img = image || `${host}/app-icon-512.png`;

  const altEN   = alternates?.['en']    || `${host}${path}`;
  const altZHCN = alternates?.['zh-CN'] || `${host}/zh-CN${path}`;
  const altZHTW = alternates?.['zh-TW'] || `${host}/zh-TW${path}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description}/>
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      <link rel="canonical" href={url} />
      
      <link rel="alternate" hrefLang="en"    href={altEN} />
      <link rel="alternate" hrefLang="zh-CN" href={altZHCN} />
      <link rel="alternate" hrefLang="zh-TW" href={altZHTW} />
      <link rel="alternate" hrefLang="x-default" href={altEN} />
      
      <meta property="og:title" content={title}/>
      <meta property="og:description" content={description}/>
      <meta property="og:type" content="website"/>
      <meta property="og:url" content={url}/>
      <meta property="og:image" content={img}/>
      <meta property="og:image:secure_url" content={img}/>
      <meta property="og:image:type" content="image/png"/>
      <meta property="og:image:width" content="512"/>
      <meta property="og:image:height" content="512"/>
      <meta property="og:image:alt" content={title}/>
      <meta property="og:site_name" content="ZhenGrowth"/>
      <meta property="og:locale" content={lang === 'zh-CN' ? 'zh_CN' : lang === 'zh-TW' ? 'zh_TW' : 'en_US'}/>
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title}/>
      <meta name="twitter:description" content={description}/>
      <meta name="twitter:image" content={img}/>
      <meta name="twitter:image:alt" content={title}/>
      <meta name="twitter:site" content="@zhengrowth"/>
      <meta name="twitter:creator" content="@gracehuangco"/>
      
      <meta httpEquiv="content-language" content={lang}/>
    </Helmet>
  );
}

export default SEOHelmet;
