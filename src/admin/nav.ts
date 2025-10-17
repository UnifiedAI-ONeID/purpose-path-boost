export type AdminNavItem = {
  label: string;
  href: string;
  icon?: string;
};

export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Overview', href: '/admin' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Marketing', href: '/admin/marketing' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Integrations', href: '/admin/integrations' },
  { label: 'System', href: '/admin/system' },
];
