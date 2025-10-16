# App Icons Configuration

Your app now has professional app icons for iOS and Android devices using the ZhenGrowth growth logo design (teal and gold plant/growth symbol).

## Generated Icons

### Main Icons
- **`/app-icon-512.png`** - 512×512px - High resolution for Android, OG images, and desktop PWA
- **`/app-icon-192.png`** - 192×192px - Standard Android icon
- **`/app-icon-192-maskable.png`** - 192×192px - Android maskable icon with safe zone padding
- **`/apple-touch-icon.png`** - 180×180px - iOS home screen icon

### Icon Design
- **Symbol**: Growing plant with golden leaves emerging from soil
- **Colors**: Teal background (#0b8080) with gold/yellow gradient leaves
- **Style**: 3D minimalist design with subtle shadows
- **Theme**: Represents growth, development, and coaching

## Manifest Configuration

### Main App (`/manifest.json`)
```json
{
  "icons": [
    { "src": "/app-icon-192.png", "sizes": "192x192", "purpose": "any" },
    { "src": "/app-icon-192-maskable.png", "sizes": "192x192", "purpose": "maskable" },
    { "src": "/app-icon-512.png", "sizes": "512x512", "purpose": "any" }
  ]
}
```

### Admin App (`/admin/manifest.webmanifest`)
Uses the same icons for consistency across the app.

## HTML Configuration

### Both `index.html` and `index-cn.html` now include:

```html
<!-- Favicon -->
<link rel="icon" type="image/png" sizes="192x192" href="/app-icon-192.png" />
<link rel="icon" type="image/png" sizes="512x512" href="/app-icon-512.png" />

<!-- iOS Icons -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- PWA -->
<link rel="manifest" href="/manifest.json" />
<meta name="apple-mobile-web-app-title" content="ZhenGrowth" />
```

## Platform Support

### iOS
- ✅ Home screen icon (180×180px)
- ✅ App title: "ZhenGrowth"
- ✅ Status bar style: black-translucent
- ✅ Splash screen support via PWA

### Android
- ✅ Adaptive icons with maskable support
- ✅ Standard icon (192×192px)
- ✅ High-res icon (512×512px)
- ✅ Splash screen support via PWA

### Desktop PWA
- ✅ Taskbar icon (512×512px)
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
