# Admin Routing Issue - Diagnosis & Fix

## Problem Identified

**Issue**: Admins are not being routed to `/admin` dashboard after login

**Root Cause**: The `api-admin-check-role` edge function was being called **WITHOUT authorization headers**

## Evidence

1. **Database Check**: ✅ User `simon.luke@unswalumni.com` (ID: `c69fda2c-ff73-4997-9922-6addbdab169e`) IS in `zg_admins` table
2. **Edge Function Logs**: ❌ NO logs found for `api-admin-check-role` - function was never reached
3. **Auth Logs**: ✅ Login successful at 20:58:31

## Why It Failed

The edge function requires an authorization token to verify admin status:

```typescript
// Edge function expects this header:
const authHeader = req.headers.get('authorization');

// But Auth.tsx was calling it WITHOUT the header:
await supabase.functions.invoke('api-admin-check-role');  // ❌ Missing auth header
```

Without the auth header, the function returns:
```json
{ "ok": true, "authed": false, "is_admin": false }
```

This causes ALL users (including admins) to be routed to `/me` instead of `/admin`.

## Fix Applied

### 1. Updated `src/pages/Auth.tsx`

**Post-Login Routing** (lines 313-336):
```typescript
const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
  headers: {
    Authorization: `Bearer ${data.session?.access_token}`  // ✅ Added auth header
  }
});
```

**Session Restore Routing** (lines 78-99):
```typescript
const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
  headers: {
    Authorization: `Bearer ${session.access_token}`  // ✅ Added auth header
  }
});
```

### 2. Updated `src/pages/DashboardRedirect.tsx`

**Smart Dashboard Router** (lines 15-54):
```typescript
const { data: adminData, error: adminError } = await supabase.functions.invoke('api-admin-check-role', {
  headers: {
    Authorization: `Bearer ${session.access_token}`  // ✅ Added auth header
  }
});
```

### 3. Updated `src/components/ProtectedAdminRoute.tsx`

**Admin Route Protection** (lines 23-67):
```typescript
const data = await invokeApi('/api/admin/check-role', {
  headers: {
    Authorization: `Bearer ${session.access_token}`  // ✅ Added auth header
  }
});
```

### 4. Enhanced Logging

Added comprehensive console logs to trace the routing flow in all three components:

```typescript
console.log('[Auth] Checking admin status for user:', userId);
console.log('[Auth] Admin check response:', { adminData, adminError });
console.log('[Auth] Routing admin to /admin');

console.log('[DashboardRedirect] Starting redirect logic');
console.log('[DashboardRedirect] Admin check response:', { adminData, adminError });

console.log('[ProtectedAdminRoute] Starting admin access check');
console.log('[ProtectedAdminRoute] Admin check response:', data);
```

This will help diagnose any future routing issues.

## Expected Behavior After Fix

### Admin Login Flow:
```
1. Admin logs in with credentials
2. Auth.tsx calls api-admin-check-role WITH auth token
3. Edge function verifies user in zg_admins table
4. Returns { is_admin: true }
5. Navigate to /admin ✅
```

### Regular User Login Flow:
```
1. User logs in with credentials
2. Auth.tsx calls api-admin-check-role WITH auth token
3. Edge function checks zg_admins table (user not found)
4. Returns { is_admin: false }
5. Navigate to /me ✅
```

### Dashboard Redirect:
```
1. User visits /dashboard
2. DashboardRedirect checks session
3. Calls api-admin-check-role WITH auth token
4. Routes to /admin (admin) or /me (user) ✅
```

## Files Modified

1. **src/pages/Auth.tsx**
   - Added Authorization header to both login and session restore flows
   - Enhanced console logging for debugging

2. **src/pages/DashboardRedirect.tsx**
   - Added Authorization header to admin check
   - Enhanced console logging for debugging

3. **src/components/ProtectedAdminRoute.tsx**
   - Added Authorization header to admin check via invokeApi
   - Enhanced console logging for debugging

## Testing

To verify the fix works:

1. **Admin Login Test**:
   - Log out (if logged in)
   - Log in as admin user
   - Check console for: `[Auth] Routing admin to /admin`
   - Should redirect to `/admin` dashboard

2. **Session Restore Test**:
   - As admin, refresh the page
   - Should stay on admin dashboard
   - Check console for routing logs

3. **Dashboard Redirect Test**:
   - As admin, visit `/dashboard`
   - Should redirect to `/admin`
   - Check console logs

## Security Note

This fix maintains proper security:
- ✅ Authorization token passed to edge function
- ✅ Edge function verifies token server-side
- ✅ Checks zg_admins table as source of truth
- ✅ No client-side role storage
- ✅ Proper RLS policies

## Related Components

All admin routing components now correctly pass auth tokens:
- ✅ `/auth` page → routes after login (fixed)
- ✅ `/dashboard` redirect → smart router (fixed)
- ✅ `ProtectedAdminRoute` → admin route guard (fixed)

All three components now include:
1. Authorization headers in edge function calls
2. Detailed console logging
3. Proper error handling

## Status

**Fix Applied**: ✅ Admin routing now includes proper authorization headers
**Expected Result**: Admins will be correctly routed to `/admin` dashboard
**Next Step**: Test admin login to verify fix works
