/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  // Add other env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Define a more specific type for Baidu Tongji analytics
type Hmt = (string | number | undefined)[];

interface Window {
  umami?: any; // changed from specific object to any to allow direct calls
  posthog?: {
    capture: (eventName: string, properties?: Record<string, any>) => void;
    identify: (id: string, properties?: Record<string, any>) => void;
    init: (apiKey: string, config?: any) => void;
  };
  _hmt?: Hmt[];
  AMap?: any;
}
