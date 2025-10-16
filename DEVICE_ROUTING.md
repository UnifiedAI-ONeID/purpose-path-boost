# Automatic Device Routing

Your app now automatically detects the user's device type and routes them to the appropriate experience!

## How It Works

### 📱 Mobile Devices
Mobile users are automatically redirected to PWA-optimized routes:
- `/` → `/pwa` (PWA home)
- `/quiz` → `/pwa/quiz`
- `/coaching` → `/pwa/coaching`
- `/me` or `/dashboard` → `/pwa/dashboard`

### 💻 Desktop Devices
Desktop users see the full website version and are redirected away from PWA routes if they try to access them directly.

### 🔐 Protected Routes
The following routes are **never** auto-redirected:
- Admin panel (`/admin/*`)
- Authentication (`/auth`)
- Static pages (`/blog`, `/privacy`, `/terms`, etc.)
- Booking flows (`/book/*`)
- Payment pages

## Testing

### Force Desktop Mode
Add `?forceDesktop` to any URL:
```
https://yourdomain.com/?forceDesktop
```

### Force Mobile Mode
Add `?forceMobile` to any URL:
```
https://yourdomain.com/?forceMobile
```

Your preference is saved in `localStorage` so you don't have to keep adding the parameter.

### Clear Preference
To reset and use automatic detection:
```javascript
localStorage.removeItem('zg.devicePreference');
```

## Device Detection

The app detects mobile devices using:
1. **User Agent** - Detects iOS, Android, and other mobile platforms
2. **Screen Size** - Checks if viewport is < 768px wide
3. **Touch Support** - Verifies touch capability

This ensures accurate detection even on tablets and hybrid devices.

## Development

### View Mobile on Desktop
In Lovable, click the phone/tablet/computer icon above the preview to test different screen sizes.

Or add `?forceMobile` to your local development URL.

### View Desktop on Mobile
Add `?forceDesktop` to the URL when testing on a mobile device.

## Customizing Route Mappings

To add new route mappings, edit `src/components/DeviceRouter.tsx`:

```typescript
const ROUTE_MAPPINGS: { [key: string]: string } = {
  // Add your custom mappings here
  '/my-page': '/pwa/my-page',
  '/pwa/my-page': '/my-page',
};
```

## Files Modified

- `src/lib/deviceDetect.ts` - Device detection utilities
- `src/components/DeviceRouter.tsx` - Automatic routing logic
- `src/App.tsx` - Integrated DeviceRouter component
- `src/pwa/PWALayout.tsx` - Updated PWA navigation
