# Admin Dashboard Redesign Complete

## Overview
The admin dashboard has been completely redesigned with a new navigation structure and modular pages following the specified architecture.

## New Navigation Structure

Located in `src/admin/nav.ts`:

```typescript
export const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Overview', href: '/admin' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Content', href: '/admin/content' },
  { label: 'Marketing', href: '/admin/marketing' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'Integrations', href: '/admin/integrations' },
  { label: 'System', href: '/admin/system' },
];
```

## New Admin Pages

### 1. Overview (`/admin`)
- **File**: `src/pages/admin/Overview.tsx`
- **Features**:
  - KPI Dashboard (MRR, Active Subscriptions, Lesson Completions, Bookings)
  - Quick Actions (Create Coupon, Update API Keys, SEO & Cache)
  - System Alerts display
- **Data Source**: Uses `dashboard-admin-metrics` edge function
- **Design**: 4-column KPI grid + 2-column actions/alerts

### 2. Leads (`/admin/leads`)
- **File**: `src/pages/admin/Leads.tsx`
- **Features**:
  - Real-time lead tracking with Supabase realtime
  - Table view with Name, Email, Stage, Source, Created date
  - Status badges for lead stages
  - Auto-updates when leads are added/modified
- **Data Source**: Direct Supabase query on `leads` table

### 3. Content (`/admin/content`)
- **File**: `src/pages/admin/Content.tsx`
- **Features**:
  - Tabbed interface (Lessons / Blog)
  - Quick links to content managers
  - Placeholder for lesson and blog management
- **Integration**: Links to existing admin pages

### 4. Marketing (`/admin/marketing`)
- **File**: `src/pages/admin/Marketing.tsx`
- **Features**:
  - Cross-post to social media (LinkedIn, Facebook, X, 小紅書)
  - Coupon management
  - Referral settings
- **Integration**: Links to `/admin/coupons` and other marketing tools

### 5. Payments (`/admin/payments`)
- **File**: `src/pages/admin/Payments.tsx`
- **Features**:
  - Plans & Pricing management
  - Subscriptions overview
- **Integration**: Links to `/admin/pricing` and `/admin/bookings`

### 6. Integrations (`/admin/integrations`)
- **File**: `src/pages/admin/Integrations.tsx`
- **Features**:
  - API Keys management (Airwallex, Cal.com)
  - Secure secret storage (placeholder for edge function)
- **Security**: Uses authenticated edge function calls

### 7. System (`/admin/system`)
- **File**: `src/pages/admin/System.tsx`
- **Features**:
  - Version/Cache management (bump content version)
  - SEO Alert system (create alerts for admins)
- **Integration**: 
  - Calls `api-admin-bump-version` edge function
  - Writes to `nudge_inbox` table

## Database Tables

### Created Tables

1. **`nudge_inbox`**
   - Stores system alerts and notifications
   - Fields: `id`, `profile_id`, `kind`, `title`, `body`, `expire_at`, `read_at`, `created_at`
   - RLS: Admins can manage, users can view their own

2. **`system_alerts`**
   - Stores admin-level system alerts
   - Fields: `id`, `type`, `title`, `message`, `resolved`, `created_at`, `resolved_at`
   - RLS: Admins only

## Design System

### Layout
- **AdminShell**: Consistent layout wrapper with:
  - Sidebar navigation (240px wide)
  - Brand header with gradient banner
  - Responsive mobile menu
  - Clean, modern design

### Styling
- **Header Gradient**: `linear-gradient(120deg,#0e7c6b,#0b5f54)`
- **Design Tokens**: Uses semantic color tokens from design system
- **Responsive**: Mobile-first with collapsible sidebar
- **Cards**: Rounded corners, consistent padding

## Routing

### App.tsx Updates
All new routes added with admin protection:

```typescript
<Route path="/admin" element={<ProtectedAdminRoute><AdminOverview /></ProtectedAdminRoute>} />
<Route path="/admin/leads" element={<ProtectedAdminRoute><AdminLeads /></ProtectedAdminRoute>} />
<Route path="/admin/content" element={<ProtectedAdminRoute><AdminContent /></ProtectedAdminRoute>} />
<Route path="/admin/marketing" element={<ProtectedAdminRoute><AdminMarketing /></ProtectedAdminRoute>} />
<Route path="/admin/payments" element={<ProtectedAdminRoute><AdminPayments /></ProtectedAdminRoute>} />
<Route path="/admin/integrations" element={<ProtectedAdminRoute><AdminIntegrations /></ProtectedAdminRoute>} />
<Route path="/admin/system" element={<ProtectedAdminRoute><AdminSystem /></ProtectedAdminRoute>} />
```

### Legacy Routes
All existing admin routes maintained for backward compatibility:
- `/admin/dashboard` - Original admin dashboard
- `/admin/events` - Events management
- `/admin/pricing` - Pricing management
- `/admin/coaching` - Coaching management
- etc.

## Authentication & Security

### Admin Protection
- All routes wrapped in `ProtectedAdminRoute`
- Uses `useAdminAuth` hook for verification
- Requires valid session + admin role check
- Redirects non-admins to `/auth?returnTo=/admin`

### Edge Function Security
- All admin API calls use authenticated tokens
- Authorization header: `Bearer ${session.access_token}`
- Server-side admin role verification

## Integration Points

### Existing Edge Functions Used
1. `dashboard-admin-metrics` - KPI data for Overview
2. `api-admin-bump-version` - Version bumping for System page
3. `api-admin-check-role` - Admin role verification

### Database Integration
- Direct Supabase queries for leads
- Realtime subscriptions for live updates
- RLS policies enforce admin-only access

## Testing Checklist

- [x] Admin navigation displays correctly
- [x] All routes are protected with admin auth
- [x] Overview page loads KPI data
- [x] Leads page shows real-time updates
- [x] Content tabs switch correctly
- [x] Marketing links work
- [x] Payments links work
- [x] Integrations form displays
- [x] System alerts can be created
- [x] Version bump function works
- [x] Mobile menu toggles properly
- [x] Gradient header displays correctly
- [x] AdminShell wraps all pages consistently

## Next Steps

1. **Content Management**: Implement full lesson and blog managers
2. **Analytics**: Add charts and graphs to Overview
3. **Reporting**: Export capabilities for leads and metrics
4. **Notifications**: Real-time admin alerts system
5. **Permissions**: Granular role-based access control

## Notes

- Design follows the gradient-based brand theme (`#0e7c6b` to `#0b5f54`)
- All pages use AdminShell for consistent layout
- Realtime functionality implemented for leads
- Modular architecture allows easy addition of new sections
- Bilingual support maintained (Grow with Clarity · 清晰成長)
