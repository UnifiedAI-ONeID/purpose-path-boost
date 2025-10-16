# Dashboard Access Control Guide

## Overview

This application has separate dashboards for **clients** and **admins**, with proper authentication and authorization flows for both PWA (mobile) and web versions.

## Dashboard Routes & Access Control

### 1. Client Dashboards (Authenticated Users)

#### Web Version: `/me`
- **Protection**: ✅ `RequireAuth` wrapper
- **Features**: Full-featured client dashboard with:
  - Next session info
  - Goals management
  - Streak tracking
  - Referral links
  - Account settings
  - AI-powered suggestions
- **Redirect if not authenticated**: `/auth?returnTo=/me`

#### PWA Version: `/pwa/dashboard`
- **Protection**: ✅ `RequireAuth` wrapper
- **Features**: Mobile-optimized dashboard
- **Redirect if not authenticated**: `/auth?returnTo=/pwa/dashboard`

#### Legacy Route: `/dashboard`
- **Protection**: ✅ Automatic redirect
- **Behavior**: 
  - If authenticated → redirects to `/me` (clients) or `/admin` (admins)
  - If not authenticated → redirects to `/auth?returnTo=/dashboard`
- **Purpose**: Backward compatibility - routes users to the correct dashboard

### 2. Admin Dashboard (Admin Users Only)

#### Admin Panel: `/admin/*`
- **Protection**: ✅ `ProtectedAdminRoute` wrapper
- **Access**: Only users in `zg_admins` table
- **Features**: Full admin control panel with:
  - Analytics & metrics
  - Booking management
  - Event management
  - Pricing controls
  - SEO monitoring
  - Coaching program management
- **Redirect if not admin**: `/auth?returnTo=/admin`

## Authentication Flow

### Login Process

```
User visits /auth
    ↓
User enters credentials
    ↓
Check admin status via /api/admin/check-role
    ↓
┌─────────────────┬─────────────────┐
│   Is Admin?     │  Regular User?  │
│   ↓             │   ↓             │
│ /admin          │  /me            │
└─────────────────┴─────────────────┘
```

### Route Protection

```
┌──────────────────────────────────────┐
│ Unauthenticated User Access Attempt  │
└──────────────────────────────────────┘
            ↓
    ┌───────────────────┐
    │ Which Dashboard?  │
    └───────────────────┘
            ↓
    ┌──────────────────────────────────┐
    │ /me or /pwa/dashboard → /auth    │
    │ /admin → /auth?returnTo=/admin   │
    │ /dashboard → /auth?returnTo=/... │
    └──────────────────────────────────┘
```

## Admin Authorization

### Security Model

Admin status is determined by the `zg_admins` table:

```sql
-- Admin check function (server-side, secure)
CREATE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.zg_admins 
    WHERE user_id = auth.uid()
  )
$$;
```

### Admin API Endpoints

- `/api/admin/check-role` - Verify if user is admin
- `/api/admin/self` - Get admin user details

Both endpoints:
- Require valid JWT token
- Use server-side validation
- Query `zg_admins` table securely
- Return role information

## Device-Specific Routing

### Startup Flow

```
User lands on /
    ↓
Startup component detects device
    ↓
┌──────────────┬───────────────┐
│   Mobile?    │   Desktop?    │
│   ↓          │   ↓           │
│ /pwa/home    │  /home        │
└──────────────┴───────────────┘
```

### PWA vs Web

- **PWA Routes** (`/pwa/*`): Mobile-optimized with bottom navigation
- **Web Routes** (`/home`, `/me`, etc.): Desktop-optimized with top navigation
- Both support authentication and proper dashboard access

## Security Checklist

### Client Dashboard Protection
- ✅ `/me` - Protected by `RequireAuth`
- ✅ `/pwa/dashboard` - Protected by `RequireAuth`
- ✅ `/dashboard` - Redirects to appropriate dashboard based on auth status

### Admin Dashboard Protection
- ✅ All `/admin/*` routes - Protected by `ProtectedAdminRoute`
- ✅ Server-side role validation via API endpoints
- ✅ Uses secure `zg_admins` table (not client-modifiable boolean)

### Authentication Persistence
- ✅ Session stored in localStorage
- ✅ Auto-refresh tokens enabled
- ✅ Auth state listener for real-time updates
- ✅ Proper redirects with `returnTo` parameter

## Common User Flows

### New Client User
1. Visits site → `/` → `/home` (or `/pwa/home` on mobile)
2. Clicks "Sign Up" → `/auth`
3. Creates account
4. Redirected to `/me` (client dashboard)

### Returning Client User
1. Visits site → `/` → `/home`
2. Clicks "Dashboard" or "Account" → `/me`
3. If not logged in → `/auth?returnTo=/me`
4. After login → `/me`

### Admin User
1. Visits `/admin` → Checks authentication
2. If not logged in → `/auth?returnTo=/admin`
3. After login → Checks `zg_admins` table
4. If admin → `/admin` (admin panel)
5. If not admin → Shows "Admin access required" toast and redirects to `/auth`

## Best Practices

1. **Never expose admin checks client-side** - Always use server API endpoints
2. **Use returnTo parameters** - Preserve user's intended destination
3. **Separate dashboards by role** - Don't mix admin and client features
4. **Protect PWA routes** - Mobile doesn't mean public
5. **Consistent auth checks** - Use the same patterns across web and PWA

## Troubleshooting

### User can't access dashboard
- Check if they're authenticated (session exists)
- Verify their profile was created in `zg_profiles` table
- Check console for auth errors

### Admin can't access /admin
- Verify user exists in `zg_admins` table
- Check API endpoint `/api/admin/check-role` returns correct data
- Ensure JWT token is valid

### Wrong dashboard after login
- Check the logic in `Auth.tsx` lines 80-97
- Verify `/api/admin/check-role` endpoint is working
- Check for `returnTo` parameter in URL
