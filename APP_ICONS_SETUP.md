# App Icons Configuration

Your app now has professional app icons for iOS and Android devices generated from the ZhenGrowth logo (`src/assets/images/logo.png`).

## Generated Icons

### iOS Icons (Apple Touch)
- **`/apple-touch-icon.png`** - 180×180px - Default iOS home screen icon
- **`/apple-touch-icon-180x180.png`** - 180×180px - iPhone 6 Plus and newer
- **`/apple-touch-icon-167x167.png`** - 167×167px - iPad Pro
- **`/apple-touch-icon-152x152.png`** - 152×152px - iPad, iPad mini
- **`/apple-touch-icon-120x120.png`** - 120×120px - iPhone 4, 5, 6
- **`/apple-touch-icon-76x76.png`** - 76×76px - iPad (non-retina)
- **`/apple-touch-icon-60x60.png`** - 60×60px - iPhone (non-retina)

### Android/PWA Icons
- **`/app-icon-512.png`** - 512×512px - High resolution for Android, Play Store, desktop PWA
- **`/app-icon-192.png`** - 192×192px - Standard Android icon
- **`/app-icon-144.png`** - 144×144px - Android Chrome
- **`/android-chrome-512x512.png`** - 512×512px - Android Chrome standard
- **`/android-chrome-192x192.png`** - 192×192px - Android Chrome standard
- **`/android-chrome-144x144.png`** - 144×144px - Android Chrome standard

### Maskable Icons (Android Adaptive)
- **`/app-icon-512-maskable.png`** - 512×512px - With 20% safe zone padding
- **`/app-icon-192-maskable.png`** - 192×192px - With 20% safe zone padding

### Favicon
- **`/favicon.ico`** - 32×32px - Classic favicon
- **`/favicon-32x32.png`** - 32×32px - Modern favicon
- **`/favicon-16x16.png`** - 16×16px - Small favicon

## Icon Generation

Icons are automatically generated from the source logo using:

```bash
npm run generate:icons
```

This runs the `tools/generate-icons.js` script which uses Sharp to resize the logo for all required sizes.

### Source Logo
Located at: `src/assets/images/logo.png`

To update all icons:
1. Replace `src/assets/images/logo.png` with your new logo
2. Run `npm run generate:icons`
3. All icons will be regenerated automatically

## Manifest Configuration

### Main App (`/manifest.json`)
```json
{
  "icons": [
    { "src": "/app-icon-512.png", "sizes": "512x512", "purpose": "any" },
    { "src": "/app-icon-512-maskable.png", "sizes": "512x512", "purpose": "maskable" },
    { "src": "/app-icon-192.png", "sizes": "192x192", "purpose": "any" },
    { "src": "/app-icon-192-maskable.png", "sizes": "192x192", "purpose": "maskable" },
    { "src": "/android-chrome-144x144.png", "sizes": "144x144", "purpose": "any" },
    { "src": "/apple-touch-icon.png", "sizes": "180x180", "purpose": "any" }
  ]
}
```

### Admin App (`/admin/manifest.webmanifest`)
Uses the same icons for consistency across the app.

## HTML Configuration

### Both `index.html` and `index-cn.html` now include:

```html
<!-- Favicon - Multiple sizes -->
<link rel="icon" type="image/png" sizes="512x512" href="/app-icon-512.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/app-icon-192.png" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="shortcut icon" href="/favicon.ico" />

<!-- iOS Icons - All device sizes -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-180x180.png" />
<link rel="apple-touch-icon" sizes="167x167" href="/apple-touch-icon-167x167.png" />
<link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.png" />
<link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.png" />
<link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.png" />

<!-- PWA -->
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-title" content="ZhenGrowth" />
```

## Animated Logo Loading

The app now uses an animated version of the logo for loading states:

```tsx
import { AnimatedLogo, LoadingOverlay, LogoSpinner } from '@/components/AnimatedLogo';

// Full animated logo with pulsing rings
<AnimatedLogo size="lg" showText={true} />

// Full-screen loading overlay
<LoadingOverlay message="Loading..." />

// Simple spinning logo
<LogoSpinner size="md" />
```

The `LoadingSpinner` component now uses the animated logo automatically.

## Platform Support

### iOS
- ✅ Home screen icons (60-180px for all devices)
- ✅ App title: "ZhenGrowth"
- ✅ Status bar style: black-translucent
- ✅ Splash screen support via PWA

### Android
- ✅ Adaptive icons with maskable support (192px, 512px)
- ✅ Standard icons (144px, 192px, 512px)
- ✅ Splash screen support via PWA

### Desktop PWA
- ✅ Taskbar icon (512×512px)
- ✅ Window icon (192×192px)
- ✅ Favicon (16px, 32px)
- ✅ Window icon (192×192px)

## Testing

### iOS (iPhone/iPad)
1. Open the website in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. See the ZhenGrowth icon on your home screen

### Android
1. Open the website in Chrome
2. Tap the menu (⋮)
3. Select "Install app" or "Add to Home Screen"
4. See the ZhenGrowth icon in your app drawer

### Desktop (Chrome/Edge)
1. Look for the install icon in the address bar
2. Click "Install ZhenGrowth"
3. See the app in your applications folder

## Maskable Icons

The maskable icon (`app-icon-192-maskable.png`) includes 20% safe zone padding to ensure the logo looks good on Android devices with different shaped icon masks (circle, squircle, rounded square, etc.).

## Future Customization

To update the icons with a different logo:
1. Replace the source images in `/public/`
2. Maintain the same file names and sizes
3. Ensure maskable icons have proper padding (20% safe zone)
4. Test on both iOS and Android devices

## Social Sharing

The 512×512px icon is also used for Open Graph and Twitter Card images, ensuring consistent branding when your app is shared on social media.
