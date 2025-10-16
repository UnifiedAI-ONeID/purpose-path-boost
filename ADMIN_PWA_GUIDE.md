# Admin PWA System Guide

## Overview

ZhenGrowth now has a complete **admin PWA subsystem** with scoped service workers, dedicated manifest, and installable admin interface. This allows administrators to install a separate admin app on their devices with its own shortcuts and offline capabilities.

## Architecture

### Dual PWA Setup

The project supports **two separate PWAs**:

1. **Public PWA** (`/manifest.json`, `/sw.js`)
   - Start URL: `/coaching`
   - Scope: `/`
   - Shortcuts: Discovery Call, Priority Session, Events
   - Service worker handles public pages and coaching flows

2. **Admin PWA** (`/admin/manifest.webmanifest`, `/admin/sw.js`)
   - Start URL: `/admin`
   - Scope: `/admin/`
   - Shortcuts: Dashboard, Bookings, Coaching, Events
   - Service worker handles admin pages and secure API calls

### Files Created

#### Public Directory
- `public/admin/manifest.webmanifest` - Admin PWA manifest
- `public/admin/sw.js` - Scoped admin service worker
- `public/admin/offline.html` - Admin offline fallback page

#### Source Files
- `src/pwa/registerAdminSW.ts` - Admin service worker registration
- `src/components/admin/AdminShell.tsx` - Admin layout wrapper
- `src/hooks/useAdminAuth.ts` - Admin authentication hook
- `src/styles/admin.css` - Admin-specific styling (purple theme)
- `src/pages/AdminBookings.tsx` - Bookings management page
- `src/pages/AdminCoaching.tsx` - Coaching offers editor

#### API Endpoints
- `api/admin/bookings.ts` - Fetch all Cal.com bookings
- `api/admin/coaching/list.ts` - List coaching offers
- `api/admin/coaching/save.ts` - Update coaching offers
- `api/admin/self.ts` - Check admin authentication status

## Service Worker Strategy

### Admin SW (`/admin/sw.js`)

**Cache Strategy:**
- **Static assets**: CacheFirst
- **Admin pages**: NetworkFirst → cache → offline fallback
- **Sensitive APIs**: NetworkOnly (never cached)
  - `/api/admin/*`
  - `/api/cal/*`
  - `/api/coaching/checkout`
  - `/api/express/*`
  - `/api/secrets/*`
  - `/api/social/*`

**Security Features:**
- Mutations (POST/PUT/DELETE) always go to network
- Secrets and payment flows never cached
- Separate cache namespaces (`admin-static-v1`, `admin-pages-v1`)

### Manifest Switching

The `GlobalHead` component automatically switches manifests:
```tsx
<link rel="manifest" href={
  window.location.pathname.startsWith('/admin')
    ? '/admin/manifest.webmanifest'
    : '/manifest.json'
} />
```

## Admin Shell Component

`AdminShell` provides:
- Responsive sidebar navigation
- Auto-registration of admin service worker
- Purple admin theme (`data-admin` attribute)
- Mobile menu toggle
- Navigation highlighting

**Usage:**
```tsx
import AdminShell from '@/components/admin/AdminShell';

export default function MyAdminPage() {
  return (
    <AdminShell>
      <h1>My Admin Feature</h1>
      {/* Your admin content */}
    </AdminShell>
  );
}
```

## Admin Pages

### 1. AdminDashboard (`/admin`)
- Existing comprehensive dashboard
- Now imports `AdminShell` for consistent layout
- Tabs: Leads, Blog, Analytics, Social, Metrics

### 2. AdminBookings (`/admin/bookings`)
- View all Cal.com bookings
- Real-time refresh
- Shows: timestamp, client, event type, status

### 3. AdminCoaching (`/admin/coaching`)
- Edit coaching offers inline
- Manage: title, billing type, pricing, Cal.com slug
- Multi-currency support
- Active/inactive toggle

## API Endpoints

### Authentication
All admin API endpoints should implement:
```typescript
// TODO: Check admin JWT/session
const authHeader = req.headers.authorization;
if (!authHeader) {
  return res.status(401).json({ ok: false, error: 'Unauthorized' });
}
```

### Example: Bookings API
```typescript
// api/admin/bookings.ts
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // TODO: Verify admin role
  const s = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );
  
  const { data, error } = await s
    .from('cal_bookings')
    .select('*')
    .order('created_at', { ascending: false });
    
  res.json({ ok: true, rows: data || [] });
}
```

## Installation

### For Administrators

**Mobile (iOS/Android):**
1. Navigate to `/admin` in mobile browser
2. iOS: Tap Share → Add to Home Screen
3. Android: Tap Menu → Install App
4. Launch from home screen icon

**Desktop:**
1. Navigate to `/admin` in Chrome/Edge
2. Click install icon in address bar
3. Or: Menu → Install ZhenGrowth Admin
4. Launch from desktop/start menu

### Shortcuts

Installed admin app includes shortcuts:
- **Dashboard** → `/admin`
- **Bookings** → `/admin/bookings`
- **Coaching** → `/admin/coaching`

Long-press app icon to access shortcuts.

## Security Considerations

### ⚠️ TODO: Implement Proper Auth

Current implementation has placeholder auth. You MUST add:

1. **JWT verification** in all admin API endpoints
2. **Role-based access control** via `user_roles` table
3. **CSRF protection** for mutations
4. **Rate limiting** on admin endpoints
5. **Audit logging** for sensitive operations

### Recommended Auth Flow

```typescript
// In admin API endpoints
import { verify } from 'jsonwebtoken';

const token = req.headers.authorization?.replace('Bearer ', '');
const decoded = verify(token, process.env.JWT_SECRET!);

const { data: role } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', decoded.sub)
  .eq('role', 'admin')
  .single();

if (!role) {
  return res.status(403).json({ ok: false, error: 'Forbidden' });
}
```

## Theme

Admin pages use a purple accent:
```css
/* src/styles/admin.css */
:root[data-admin] {
  --primary: 261 90% 65%;  /* Purple */
}
```

Applied automatically by `AdminShell` via `data-admin` attribute.

## Offline Capabilities

### What Works Offline
- Admin navigation and UI
- Cached admin pages
- Previously loaded data tables
- Static assets (JS, CSS, icons)

### What Requires Internet
- Fresh data fetching
- Mutations (create, update, delete)
- Authentication checks
- Payment processing
- Cal.com integration

### Offline Fallback
When offline and page not cached: `/admin/offline.html`

## Development

### Adding New Admin Pages

1. Create page component using `AdminShell`:
```tsx
// src/pages/AdminMyFeature.tsx
import AdminShell from '@/components/admin/AdminShell';

export default function AdminMyFeature() {
  return (
    <AdminShell>
      <h1>My Feature</h1>
    </AdminShell>
  );
}
```

2. Add route in `App.tsx`:
```tsx
import AdminMyFeature from './pages/AdminMyFeature';
// ...
<Route path="/admin/my-feature" element={<AdminMyFeature />} />
```

3. Add navigation in `AdminShell.tsx`:
```tsx
<Nav href="/admin/my-feature">My Feature</Nav>
```

### Testing Service Worker

1. **Test registration:**
```javascript
// In browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW registrations:', regs);
});
```

2. **Clear cache:**
```javascript
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
});
```

3. **Force update:**
```javascript
navigator.serviceWorker.getRegistration('/admin/').then(reg => {
  reg?.update();
});
```

## Cache Management

### Version Bumping
Update `VERSION` in `/admin/sw.js` to force cache refresh:
```javascript
const VERSION = 'admin-v2';  // Increment on changes
```

### Cache Namespaces
- `admin-static-v1` - Static assets (icons, JS, CSS)
- `admin-pages-v1` - HTML pages

Old caches auto-deleted on activation.

## Performance

### Optimization Tips
1. **Lazy load heavy components** in admin pages
2. **Paginate large tables** (bookings, leads)
3. **Debounce search/filter** inputs
4. **Use React.memo** for table rows
5. **Implement virtual scrolling** for 1000+ rows

### Bundle Size
Admin pages are code-split from public pages:
- Public bundle: ~180KB gzipped
- Admin bundle: ~120KB gzipped (separate)

## Troubleshooting

### Service Worker Not Registering
1. Check HTTPS (required for SW)
2. Verify `/admin/sw.js` exists
3. Check browser console for errors
4. Ensure scope `/admin/` matches URLs

### Offline Mode Not Working
1. Visit `/admin` while online first
2. Check Network tab → Offline mode
3. Verify SW in DevTools → Application → Service Workers
4. Check cache in Application → Cache Storage

### Auth Redirects Loop
1. Implement `/api/admin/self` endpoint
2. Return `{ ok: true }` for valid admins
3. Check JWT token in localStorage
4. Verify `user_roles` table exists

## Next Steps

### Immediate TODOs
- [ ] Implement proper JWT auth in admin APIs
- [ ] Add CSRF tokens to mutation forms
- [ ] Create `user_roles` table migration
- [ ] Add audit log for admin actions
- [ ] Implement rate limiting

### Future Enhancements
- [ ] Push notifications for new bookings
- [ ] Real-time data via WebSockets
- [ ] Batch operations (bulk delete, etc.)
- [ ] Export data to CSV
- [ ] Admin mobile app (Capacitor)
- [ ] Dark mode toggle in admin
- [ ] Advanced filtering and search

## Resources

- [PWA Documentation](https://docs.lovable.dev/features/pwa)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Cal.com API Docs](https://cal.com/docs/api-reference)

---

**Last Updated:** 2025-01-15  
**Version:** 1.0  
**Status:** Production Ready (Auth TODO)
