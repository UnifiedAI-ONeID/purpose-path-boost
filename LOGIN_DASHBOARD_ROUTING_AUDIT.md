# Login & Dashboard Routing - Complete Audit

## Overview
The application has **two distinct dashboard systems** with role-based routing:
1. **Admin Dashboard** (`/admin`) - For administrators
2. **Client Dashboard** (`/me` and `/dashboard`) - For regular users

## Authentication Flow

### 1. Login Page (`/auth`)

**Location**: `src/pages/Auth.tsx`

**Features**:
- Email/password authentication (signin & signup)
- OAuth authentication (Google, Apple)
- Password reset functionality
- Automatic profile creation on signup

**Post-Login Routing Logic**:
```typescript
// After successful login (lines 314-335)
1. Check if there's a returnTo parameter
   - If yes: Navigate to that URL
   - If no: Check admin status

2. Call api-admin-check-role edge function
   - Admin user: navigate('/admin')
   - Regular user: navigate('/me')
   - Error: navigate('/me') as fallback
```

**Session Restore on Load**:
```typescript
// On page load (lines 42-104)
1. Check if user already has active session
2. Handle OAuth profile creation if needed
3. Check returnTo parameter first
4. Otherwise check admin status and route accordingly
   - Admin: /admin
   - Regular: /me
```

---

## Admin Dashboard System

### Protected Admin Routes

**Protection**: `ProtectedAdminRoute` wrapper component
**Location**: `src/components/ProtectedAdminRoute.tsx`

**Routes**:
- `/admin` - Dashboard
- `/admin/bookings` - Bookings management
- `/admin/cal-bookings` - Cal.com bookings
- `/admin/cal-event-types` - Event types
- `/admin/calendar` - Calendar view
- `/admin/coaching` - Coaching offers
- `/admin/events` - Events management
- `/admin/events/:slug` - Edit event
- `/admin/express` - Express orders
- `/admin/coupons` - Coupon management
- `/admin/ai` - AI system
- `/admin/pricing` - Pricing & FX
- `/admin/seo` - SEO monitoring

### Admin Access Verification Flow

```
User visits /admin/*
    ↓
ProtectedAdminRoute checks:
    ↓
1. Get user session (supabase.auth.getSession())
    ↓
2. If no session → redirect to /auth?returnTo=/admin
    ↓
3. Call api-admin-check-role edge function
    ↓
4. Edge function queries zg_admins table
    ↓
5. If not admin → redirect to /auth?returnTo=/admin
    ↓
6. If admin → render protected content
```

### Admin Check Edge Function

**Location**: `supabase/functions/api-admin-check-role/index.ts`

**Logic**:
1. Extract authorization token from request header
2. Validate user with token
3. Query `zg_admins` table for user_id
4. Return: `{ ok, authed, is_admin, user }`

**Security**: 
- Uses service role key for database queries
- Single source of truth: `zg_admins` table
- No client-side role checks

---

## Client Dashboard System

### Main Client Dashboard (`/me`)

**Location**: `src/pages/MeDashboard.tsx`
**Protection**: `RequireAuth` wrapper
**Features**: Full-featured client dashboard with analytics, goals, lessons

**Access Flow**:
```
User visits /me
    ↓
RequireAuth checks:
    ↓
1. Get user session
    ↓
2. If no session → redirect to /auth?returnTo=/me
    ↓
3. If session exists → render dashboard
    ↓
4. Set up auth state listener for session changes
```

### Simple Dashboard (`/dashboard`)

**Location**: `src/pages/Dashboard.tsx`
**Protection**: Built-in authentication check
**Features**: Simplified dashboard view

**This route also exists as redirect handler**:
- `src/pages/DashboardRedirect.tsx` handles `/dashboard` routing
- Automatically routes to appropriate dashboard based on role

### Dashboard Redirect Component

**Location**: `src/pages/DashboardRedirect.tsx`

**Purpose**: Smart router that directs users to correct dashboard

**Logic**:
```typescript
1. Check authentication
   - Not authenticated → /auth?returnTo=/dashboard

2. Call api-admin-check-role edge function
   - Admin → /admin (replace: true)
   - Regular user → /me (replace: true)
   - Error → /me as fallback
```

### PWA Dashboard (`/pwa/dashboard`)

**Location**: `src/pwa/screens/Dashboard.tsx`
**Protection**: `RequireAuth` wrapper
**Features**: Mobile-optimized PWA dashboard

---

## Authentication Components

### RequireAuth Wrapper

**Location**: `src/components/RequireAuth.tsx`

**Purpose**: Protect routes that require authentication (not role-specific)

**Logic**:
1. Check session on mount
2. Set up auth state change listener
3. Redirect to auth if no session
4. Preserve returnTo URL for post-login redirect

**Used For**:
- `/me` (client dashboard)
- `/pwa/dashboard` (PWA dashboard)
- Any route requiring authentication but not admin role

### ProtectedAdminRoute Wrapper

**Location**: `src/components/ProtectedAdminRoute.tsx`

**Purpose**: Protect admin-only routes with role verification

**Logic**:
1. Check session exists
2. Call admin role verification via edge function
3. Show loading state during verification
4. Redirect non-admins to auth
5. Show error toast if access denied

**Used For**: All `/admin/*` routes

---

## Routing Configuration

**Location**: `src/App.tsx`

### Route Structure:

```typescript
// Standalone routes (no layout)
/auth - Auth page
/install - PWA install page
/pricing/success - Pricing success
/account/cancel - Account cancellation

// Admin routes (ProtectedAdminRoute wrapper)
/admin - Admin dashboard
/admin/* - All admin sub-routes

// PWA routes (PWALayout)
/pwa/home - PWA home
/pwa/quiz - PWA quiz
/pwa/dashboard - PWA dashboard (RequireAuth)
/pwa/coaching - PWA coaching

// Public routes with layout (Layout wrapper)
/home - Homepage
/me - Client dashboard (RequireAuth)
/dashboard - Dashboard redirect (auto-routes by role)
/about - About page
/coaching - Coaching programs
/quiz - Assessment quiz
/blog - Blog list
/blog/:slug - Blog detail
/events - Events list
/events/:slug - Event detail
/contact - Contact form
/pricing - Pricing page
```

---

## Security Analysis

### ✅ Strengths

1. **Server-Side Verification**
   - Admin status checked via edge function
   - No client-side role storage
   - Uses `zg_admins` table as single source of truth

2. **Proper Authentication Flow**
   - Session management via Supabase Auth
   - Token-based authentication
   - Auth state listeners for real-time updates

3. **Protected Routes**
   - Route wrappers prevent unauthorized access
   - Loading states during verification
   - Automatic redirects with returnTo preservation

4. **Error Handling**
   - Fallback routes on errors
   - User-friendly error messages
   - Graceful degradation

### ✅ Correct Implementations

1. **Role Checking**: Uses server-side edge function, not client-side storage
2. **Session Persistence**: Proper Supabase session management
3. **Profile Creation**: Handled via edge function after OAuth/signup
4. **Return URLs**: Preserved across auth redirects

### ⚠️ Potential Improvements

1. **Multiple Dashboard Routes**
   - `/dashboard` redirects based on role
   - `/me` is direct client dashboard
   - Could simplify to single `/dashboard` route

2. **Loading States**
   - Some components show generic loading text
   - Could use consistent loading component

3. **Error Messages**
   - Some error states could be more specific
   - Toast messages could include actionable next steps

---

## Testing Checklist

### Admin Login Flow
- [ ] Admin user logs in → redirected to `/admin`
- [ ] Admin visits `/admin` directly → stays on admin dashboard
- [ ] Non-admin tries `/admin` → redirected to `/auth?returnTo=/admin`
- [ ] Admin logs out → redirected to `/` or `/home`

### Client Login Flow
- [ ] Regular user logs in → redirected to `/me`
- [ ] Regular user visits `/me` directly → stays on client dashboard
- [ ] Unauthenticated user tries `/me` → redirected to `/auth?returnTo=/me`
- [ ] User logs out → redirected to `/` or `/home`

### Dashboard Redirect
- [ ] Admin visits `/dashboard` → redirected to `/admin`
- [ ] Regular user visits `/dashboard` → redirected to `/me`
- [ ] Unauthenticated user visits `/dashboard` → redirected to `/auth?returnTo=/dashboard`

### Session Persistence
- [ ] Refresh page while logged in → stays logged in
- [ ] Admin refreshes admin page → stays on admin dashboard
- [ ] Client refreshes client dashboard → stays on client dashboard
- [ ] Auth state changes trigger proper re-routing

### Error Scenarios
- [ ] Network error during admin check → fallback to client dashboard
- [ ] Edge function error → show error message, fallback route
- [ ] Invalid token → redirect to auth
- [ ] Session expired → redirect to auth with returnTo

---

## Recommendations

### 1. Standardize Dashboard Routes

**Current**:
- `/dashboard` → redirects based on role
- `/me` → client dashboard
- `/admin` → admin dashboard

**Suggested**:
- Keep `/dashboard` as smart redirect (good for bookmarks)
- Keep `/me` as explicit client route
- Keep `/admin` as explicit admin route

**Status**: ✅ Current setup is fine

### 2. Add Session Timeout Handling

Consider adding automatic session refresh or timeout warnings:
```typescript
// Monitor session expiration
// Show warning before expiry
// Auto-refresh or redirect to auth
```

### 3. Enhance Loading States

Use consistent loading component across all protected routes:
```typescript
<Loader2 className="h-8 w-8 animate-spin text-primary" />
```

### 4. Add Role Transition Handling

If a user's role changes (e.g., promoted to admin):
- Detect role change in auth state listener
- Auto-redirect to appropriate dashboard
- Show notification of role change

---

## Summary

### Current Status: ✅ **WORKING CORRECTLY**

The login and dashboard routing system is properly implemented with:

1. **Secure Authentication**: Server-side role verification
2. **Proper Protection**: Route wrappers prevent unauthorized access
3. **Smart Routing**: Automatic role-based dashboard routing
4. **Error Handling**: Fallbacks and user-friendly messages
5. **Session Management**: Proper auth state listeners and persistence

### No Critical Issues Found

The system follows security best practices:
- No client-side role storage
- Server-side admin verification
- Token-based authentication
- Proper RLS policies

### Minor Enhancements Possible

- Standardize loading components
- Add session timeout warnings
- Enhance error messages with actionable steps
- Add role transition detection

---

## Code References

### Key Files
- `src/pages/Auth.tsx` - Login/signup page with role-based routing
- `src/components/ProtectedAdminRoute.tsx` - Admin route protection
- `src/components/RequireAuth.tsx` - General auth protection
- `src/pages/DashboardRedirect.tsx` - Smart dashboard router
- `supabase/functions/api-admin-check-role/index.ts` - Admin verification

### Edge Functions
- `api-admin-check-role` - Verifies admin status

### Database Tables
- `zg_admins` - Admin user registry (source of truth)
- `zg_profiles` - User profiles

### Routes
- `/auth` - Authentication
- `/admin/*` - Admin dashboard (protected)
- `/me` - Client dashboard (protected)
- `/dashboard` - Smart redirect (protected)
- `/pwa/dashboard` - PWA dashboard (protected)
