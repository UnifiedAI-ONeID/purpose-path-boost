export type RouteKey = 
  | 'home' | 'coaching' | 'coachingDetail' | 'events' | 'eventDetail' 
  | 'blog' | 'blogDetail' | 'about' | 'contact' | 'quiz' 
  | 'privacy' | 'terms' | 'resources'
  | 'pwaHome' | 'pwaQuiz' | 'pwaCoaching' | 'pwaCoachingDetail' 
  | 'sessions' | 'dashboard' | 'me' | 'checkout';

export const ROUTES: Record<RouteKey, string> = {
  // Public pages
  home:           '/',
  coaching:       '/coaching',
  coachingDetail: '/coaching/[slug]',
  resources:      '/resources',
  events:         '/events',
  eventDetail:    '/events/[slug]',
  blog:           '/blog',
  blogDetail:     '/blog/[slug]',
  about:          '/about',
  contact:        '/contact',
  quiz:           '/quiz',
  privacy:        '/privacy',
  terms:          '/terms',
  
  // PWA pages
  pwaHome:            '/pwa',
  pwaQuiz:            '/pwa/quiz',
  pwaCoaching:        '/pwa/coaching',
  pwaCoachingDetail:  '/pwa/coaching/[slug]',
  sessions:           '/pwa/sessions',
  dashboard:          '/pwa/dashboard',
  me:                 '/pwa/me',
  checkout:           '/checkout'
};

// Helper to build path with params
export function pathOf(routePattern: string, params: Record<string, string> = {}) {
  let out = routePattern;
  Object.entries(params).forEach(([k, v]) => out = out.replace(`[${k}]`, encodeURIComponent(v)));
  return out;
}
