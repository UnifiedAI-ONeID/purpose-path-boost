// China-specific analytics using Baidu Tongji
// Only used in China build (cn.zhengrowth.com)

declare global {
  interface Window {
    _hmt: any[];
  }
}

export const trackEventCN = (category: string, action: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window._hmt) {
    const params: (string | number)[] = [category, action];
    if (label) params.push(label);
    if (value !== undefined) params.push(value);
    
    window._hmt.push(['_trackEvent', ...params]);
    
    // Development logging
    if (import.meta.env.DEV) {
      console.log(`[Baidu Tongji] ${category} - ${action}`, { label, value });
    }
  }
};

export const trackPageViewCN = (pagePath: string) => {
  if (typeof window !== 'undefined' && window._hmt) {
    window._hmt.push(['_trackPageview', pagePath]);
    
    if (import.meta.env.DEV) {
      console.log(`[Baidu Tongji] Page view: ${pagePath}`);
    }
  }
};

// Event mapping for consistency with global analytics
export const EVENTS_CN = {
  // Lead Magnet
  lm_view: () => trackEventCN('lead_magnet', 'view'),
  lm_submit: () => trackEventCN('lead_magnet', 'submit'),
  quiz_complete: (score: number) => trackEventCN('quiz', 'complete', 'score', score),
  
  // Booking
  book_view: () => trackEventCN('booking', 'view'),
  book_start: () => trackEventCN('booking', 'start'),
  book_complete: () => trackEventCN('booking', 'complete'),
  
  // Payment
  pay_click: (plan: string) => trackEventCN('payment', 'click', plan),
  pay_success: (plan: string, amount: number) => trackEventCN('payment', 'success', plan, amount),
  pay_fail: (reason: string) => trackEventCN('payment', 'fail', reason),
  
  // Blog
  blog_read: (slug: string) => trackEventCN('blog', 'read', slug),
  blog_category_click: (category: string) => trackEventCN('blog', 'category', category),
  
  // Engagement
  session_bucket: (duration: string) => trackEventCN('engagement', 'session_duration', duration),
  
  // Navigation
  nav_click: (page: string) => trackEventCN('navigation', 'click', page),
  cta_click: (cta: string) => trackEventCN('cta', 'click', cta),
};
