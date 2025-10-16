export const seoConfig = {
  titleTemplate: '%s | ZhenGrowth',
  defaultTitle: 'ZhenGrowth — Grow with Clarity',
  description: 'Life & career coaching for Chinese-speaking professionals worldwide. Book your discovery call.',
  openGraph: {
    type: 'website',
    site_name: 'ZhenGrowth',
    images: [{ 
      url: '/assets/og/og-hero.jpg', 
      width: 1200, 
      height: 630, 
      alt: 'ZhenGrowth — Grow with Clarity' 
    }]
  },
  twitter: { 
    cardType: 'summary_large_image' 
  },
  hreflangs: [
    { hreflang: 'en', href: 'https://zhengrowth.com/?lang=en' },
    { hreflang: 'zh-CN', href: 'https://zhengrowth.com/?lang=zh-CN' },
    { hreflang: 'zh-TW', href: 'https://zhengrowth.com/?lang=zh-TW' }
  ]
};
