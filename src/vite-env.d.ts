/// <reference types="vite/client" />

interface Window {
  umami?: (eventName: string, eventData?: Record<string, any>) => void;
  posthog?: {
    capture: (eventName: string, properties?: Record<string, any>) => void;
    identify: (userId: string, properties?: Record<string, any>) => void;
  };
  _hmt?: any[]; // Baidu Tongji
  AMap?: any; // AMap (高德地图)
  Cal?: any; // Cal.com
}

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_TRANSLATE_API: string;
  readonly VITE_HCAPTCHA_SITE_KEY?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_REGION?: 'global' | 'china';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
