# Dashboard Routing System

## Overview
The application automatically routes users to the appropriate dashboard based on their role (admin vs client).

## Authentication Flow

### 1. Login/Signup (`/auth`)
After successful authentication, the system:
- Checks if user is admin via `api-admin-check-role` edge function
- Routes admins → `/admin`
- Routes clients → `/me`
- Respects `returnTo` parameter if provided

### 2. OAuth (Google/Apple)
- Redirects to `/auth` after OAuth callback
- Auth page detects existing session
- Checks admin status and routes appropriately

### 3. Direct Dashboard Access
- `/dashboard` → Smart redirect based on role
- Admins → `/admin`
- Clients → `/me`
- Unauthenticated → `/auth?returnTo=/dashboard`

## Admin Verification

### Server-Side (Edge Function)
**File:** `supabase/functions/api-admin-check-role/index.ts`
```typescript
// Checks zg_admins table
const { data: adminRow } = await supabase
  .from('zg_admins')
  .select('user_id')
  .eq('user_id', user.id)
  .maybeSingle();
  
return { is_admin: !!adminRow }
```

### Client-Side Components

1. **Auth.tsx** (Lines 78-100, 313-336)
   - Checks admin status after login/session restore
   - Routes to appropriate dashboard

2. **HeaderUser.tsx** (Lines 41-53)
   - Shows "Dashboard" or "Admin" link based on role
   - Links to `/me` or `/admin`

3. **AdminShell.tsx** (Lines 35-64)
   - Verifies admin access via `zg_admins` table
   - Redirects non-admins to home

4. **ProtectedAdminRoute.tsx**
   - Wraps all admin routes
   - Uses edge function to verify admin status
   - Redirects non-admins to `/auth?returnTo=/admin`

5. **DashboardRedirect.tsx**
   - Handles `/dashboard` route
   - Checks admin status via edge function
   - Routes to appropriate dashboard

## Dashboard Routes

### Admin Routes (Protected)
- `/admin` - Main admin dashboard
- `/admin/bookings` - Bookings management
- `/admin/events` - Events management
- `/admin/coaching` - Coaching programs
- `/admin/pricing` - Pricing & FX management
- `/admin/seo` - SEO monitoring
- All wrapped in `<ProtectedAdminRoute>`

### Client Routes (Protected)
- `/me` - Web client dashboard
- `/pwa/dashboard` - PWA client dashboard
- Both wrapped in `<RequireAuth>`

## Security Features

1. **Database-Level**
   - `zg_admins` table with RLS policies
   - Only admins can read admin list
   - Service role for management

2. **Edge Function**
   - `api-admin-check-role` checks `zg_admins` table
   - Returns `is_admin` boolean
   - Used by all admin verification

3. **Client Components**
   - Multiple layers of verification
   - Redirect to auth if unauthorized
   - Consistent admin checks across app

## Testing Admin Access

### Add Admin User
```sql
INSERT INTO public.zg_admins (user_id, email)
SELECT id, email FROM auth.users
WHERE email = 'your-email@example.com';
```

### Verify Admin Status
1. Login at `/auth`
2. Should route to `/admin` automatically
3. Header shows "Admin" link
4. Can access all `/admin/*` routes

### Test Client Access
1. Login with non-admin account
2. Should route to `/me` automatically
3. Header shows "Dashboard" link
4. Cannot access `/admin/*` routes (redirects to auth)

## Database Schema

### zg_admins Table
```sql
create table public.zg_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);
```

### RLS Policies
- Only admins can read admin list
- Service role can manage admins
- `is_admin()` function checks this table

## Troubleshooting

### Admin Not Routing to /admin
1. Check if user exists in `zg_admins` table
2. Verify edge function returns `is_admin: true`
3. Check console for admin check errors

### Client Routing Issues
1. Verify user has profile in `zg_profiles`
2. Check `RequireAuth` is wrapping routes
3. Ensure session is valid

### Both Failing
1. Check Supabase connection
2. Verify auth tokens are valid
3. Check RLS policies are enabled
