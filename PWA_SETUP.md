# PWA Setup Guide

## Overview
ZhenGrowth is now a fully-featured Progressive Web App (PWA) with:
- ✅ Installable on mobile and desktop
- ✅ Offline support with smart caching
- ✅ Startup splash screen
- ✅ Install prompt banner
- ✅ China/Global region detection
- ✅ Optimized performance

## Features Implemented

### 1. PWA Manifest (`public/manifest.json`)
- App name and branding
- Theme colors (`#0B3D3C` - jade green)
- Display mode: standalone (looks like native app)
- Start URL with PWA tracking: `/?source=pwa`
- App shortcuts (Book Session)
- Icons configured for all platforms

### 2. Service Worker (`public/sw.js`)
- **Cache-first** strategy for static assets (JS, CSS, images)
- **Network-first** strategy for dynamic content
- Offline fallback support
- Auto-cleanup of old caches
- Smart filtering (skips API calls, analytics)

### 3. Startup Splash Screen (`src/components/Startup.tsx`)
- Animated branding screen (🍃 + tagline)
- 1.2 second display duration
- Auto-redirects to `/home`
- Smooth fade-in animation

### 4. Install Prompt (`src/components/InstallPrompt.tsx`)
- Smart detection of install capability
- Dismissible banner with "Later" and "Install" buttons
- Persists user preference (won't show again if dismissed)
- Tracks installation state

### 5. Region Detection (`src/lib/cn-env.ts`)
**Automatically detects China vs Global:**
- Checks subdomain: `cn.zhengrowth.com`
- Checks edge worker country header
- Switches services based on region:
  - **Analytics**: Baidu Tongji (CN) vs Umami (Global)
  - **Booking**: Feishu (CN) vs Cal.com (Global)
  - **Maps**: AMap (CN) vs Google Maps (Global)

### 6. Payment Localization (`src/pages/Payment.tsx`)
- Auto-detects region and adjusts currency
- **China**: Shows CNY pricing (¥), WeChat Pay, Alipay, UnionPay
- **Global**: Shows USD pricing ($), Credit Cards, WeChat Pay, Alipay
- Includes region in payment metadata

## Usage

### Installing the App
**Mobile (iOS/Android):**
1. Visit the website in Safari/Chrome
2. Tap the install prompt banner, OR
3. iOS: Tap Share → "Add to Home Screen"
4. Android: Tap menu → "Install app"

**Desktop (Chrome/Edge):**
1. Click the install icon in address bar
2. Or use the install prompt banner

### Testing PWA Features

**Test Install Prompt:**
```javascript
// In console, clear localStorage to reset:
localStorage.removeItem('pwa-install-dismissed');
localStorage.removeItem('pwa-installed');
// Reload page to see prompt again
```

**Test Offline Mode:**
1. Open DevTools → Network tab
2. Select "Offline" from throttling dropdown
3. Navigate the app - cached pages will load

**Test Region Detection:**
```javascript
// In console:
console.log('Is China Build:', isCN);
console.log('Endpoints:', endpoints);
```

## File Structure

```
project/
├── public/
│   ├── manifest.json          # PWA configuration
│   ├── sw.js                  # Service worker
│   ├── offline.html           # Offline fallback page
│   ├── app-icon.png          # 192x192 icon
│   └── icon-512.png          # 512x512 icon
├── src/
│   ├── components/
│   │   ├── Startup.tsx       # Splash screen
│   │   └── InstallPrompt.tsx # Install banner
│   ├── lib/
│   │   ├── cn-env.ts         # Region detection
│   │   └── loaders.ts        # Service loaders
│   ├── pages/
│   │   └── Payment.tsx       # Localized payment
│   └── App.tsx               # Routes with startup
└── index.html                # PWA meta tags
```

## Deployment

### Edge Worker (Cloudflare)
Deploy `edge/country-redirect-worker.js` to route China traffic:
```javascript
// Redirects CN visitors to cn.zhengrowth.com
// Others see global build at zhengrowth.com
```

### Build Commands
```bash
# Standard build (includes PWA)
npm run build

# Test locally with PWA
npm run dev
# Note: Service worker only activates in production builds
```

### Environment Variables
```bash
# Global build
VITE_UMAMI_ID=your_umami_id
VITE_CAL_LINK=your_cal_link

# China build (index-cn.html)
VITE_BAIDU_TONGJI_ID=your_baidu_id
VITE_FEISHU_FORM_ID=your_feishu_form
```

## Performance Optimizations

1. **Preloading**: Critical assets preloaded in `index.html`
2. **Font Strategy**: System fonts prioritized, web fonts async
3. **Image Optimization**: Hero images in modern formats (AVIF, WebP)
4. **Code Splitting**: Lazy loading for China-specific components
5. **Cache Strategy**: Aggressive caching for static assets

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Safari 15+ (iOS/macOS)
- ✅ Firefox 90+
- ✅ Samsung Internet
- ⚠️ iOS Safari: Some limitations on PWA features

## Troubleshooting

**Install prompt not showing:**
- Clear site data in browser settings
- Check `beforeinstallprompt` is fired (console)
- Ensure HTTPS (required for PWA)

**Service worker not updating:**
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Unregister in DevTools → Application → Service Workers
- Clear cache storage

**Offline mode not working:**
- Check service worker is active
- Verify assets are cached (DevTools → Application → Cache)
- Check network requests in DevTools

## Next Steps

1. **Add push notifications** (requires backend integration)
2. **Implement background sync** for form submissions
3. **Add more offline content** to cache
4. **Create app store listings** (for TWA/PWA distribution)
5. **Enhance China booking** with Feishu integration

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox (advanced SW)](https://developers.google.com/web/tools/workbox)
