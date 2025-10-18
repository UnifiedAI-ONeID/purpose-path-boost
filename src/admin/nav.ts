export type AdminNavItem = {
  label: string;
  href: string;
  icon?: string;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Overview', href: '/admin' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Coaching', href: '/admin/coaching' },
  { label: 'Marketing', href: '/admin/marketing' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'System', href: '/admin/system' },
];
