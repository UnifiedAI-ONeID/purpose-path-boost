/**
 * @file This file centralizes the SEO configuration for the application.
 * It provides a default configuration and a factory function to create
 * page-specific SEO settings, ensuring consistency across the site.
 */

// --- Type Definitions ---

interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

interface OpenGraphConfig {
  type?: 'website' | 'article';
  site_name?: string;
  images?: OpenGraphImage[];
}

interface TwitterConfig {
  cardType?: 'summary' | 'summary_large_image';
  site?: string;
  creator?: string;
}

interface Hreflang {
  hreflang: 'en' | 'zh-CN' | 'zh-TW' | 'x-default';
  href: string;
}

/**
 * Defines the structure for all SEO-related configuration.
 */
export interface SEOConfig {
  title?: string;
  titleTemplate?: string;
  defaultTitle: string;
  description: string;
  openGraph?: OpenGraphConfig;
  twitter?: TwitterConfig;
  hreflangs?: Hreflang[];
}

// --- Default SEO Configuration ---

/**
 * The default SEO configuration for the entire site.
 * This configuration is used as a base and can be overridden on a per-page basis.
 */
export const defaultSEOConfig: SEOConfig = {
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
    cardType: 'summary_large_image',
    site: '@zhengrowth',
    creator: '@gracehuangco',
  },
  hreflangs: [
    { hreflang: 'en', href: 'https://zhengrowth.com/' },
    { hreflang: 'zh-CN', href: 'https://zhengrowth.com/zh-CN' },
    { hreflang: 'zh-TW', href: 'https://zhengrowth.com/zh-TW' },
    { hreflang: 'x-default', href: 'https://zhengrowth.com/' }
  ]
};

// --- Factory Function for Page-Specific Config ---

/**
 * Creates a page-specific SEO configuration by merging custom settings with the default configuration.
 * This ensures that essential SEO tags are always present while allowing for customization.
 *
 * @param {Partial<SEOConfig>} pageConfig - The SEO settings specific to the page.
 * @returns {SEOConfig} A complete, merged SEO configuration object.
 */
export function createSEOConfig(pageConfig: Partial<SEOConfig>): SEOConfig {
  return {
    ...defaultSEOConfig,
    ...pageConfig,
    openGraph: {
      ...defaultSEOConfig.openGraph,
      ...pageConfig.openGraph,
    },
    twitter: {
      ...defaultSEOConfig.twitter,
      ...pageConfig.twitter,
    },
    hreflangs: pageConfig.hreflangs || defaultSEOConfig.hreflangs,
  };
}
