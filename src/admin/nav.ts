export type AdminNavItem = {
  label: string;
  href: string;
  icon?: string;
  roles?: string[]; // Which roles can see this nav item
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Overview', href: '/admin' },
  { label: 'CRM', href: '/admin/crm', roles: ['owner', 'admin', 'sales'] },
  { label: 'Leads', href: '/admin/leads', roles: ['owner', 'admin', 'sales'] },
  { label: 'Users', href: '/admin/users', roles: ['owner', 'admin'] },
  { label: 'Analytics', href: '/admin/analytics', roles: ['owner', 'admin'] },
  { label: 'Content', href: '/admin/content', roles: ['owner', 'admin'] },
  { label: 'Lessons', href: '/admin/lessons', roles: ['owner', 'admin', 'coach'] },
  { label: 'Coaching', href: '/admin/coaching', roles: ['owner', 'admin', 'coach'] },
  { label: 'Testimonials', href: '/admin/testimonials', roles: ['owner', 'admin'] },
  { label: 'FAQs', href: '/admin/faqs', roles: ['owner', 'admin'] },
  { label: 'Challenges', href: '/admin/challenges', roles: ['owner', 'admin'] },
  { label: 'Marketing', href: '/admin/marketing', roles: ['owner', 'admin', 'sales'] },
  { label: 'Payments', href: '/admin/payments', roles: ['owner', 'admin', 'finance'] },
  { label: 'Settings', href: '/admin/settings', roles: ['owner', 'admin'] },
  { label: 'System', href: '/admin/system', roles: ['owner', 'admin'] },
];
