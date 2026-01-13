/**
 * App Icon Generator Script
 * 
 * Generates all required iOS and Android app icons from the logo.png source
 * 
 * Usage: node tools/generate-icons.js
 * 
 * Prerequisites: npm install sharp
 */

import sharp from 'sharp';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Source logo path
const SOURCE_LOGO = join(__dirname, '../src/assets/images/logo.png');
const PUBLIC_DIR = join(__dirname, '../public');

// iOS icon sizes (for apple-touch-icon and PWA)
const IOS_ICONS = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-167x167.png', size: 167 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
  { name: 'apple-touch-icon-76x76.png', size: 76 },
  { name: 'apple-touch-icon-60x60.png', size: 60 },
];

// Android/PWA icon sizes
const ANDROID_ICONS = [
  { name: 'app-icon-512.png', size: 512 },
  { name: 'app-icon-192.png', size: 192 },
  { name: 'app-icon-144.png', size: 144 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-144x144.png', size: 144 },
  { name: 'icon-512.png', size: 512 },
  { name: 'favicon.ico', size: 32 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-16x16.png', size: 16 },
];

// Maskable icons (with padding for Android adaptive icons)
const MASKABLE_ICONS = [
  { name: 'app-icon-192-maskable.png', size: 192, padding: 0.2 },
  { name: 'app-icon-512-maskable.png', size: 512, padding: 0.2 },
];

// Background color for maskable icons
const BACKGROUND_COLOR = { r: 11, g: 128, b: 128, alpha: 1 }; // Teal #0b8080

async function generateIcon(inputPath, outputPath, size, isMaskable = false, padding = 0.2) {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    
    if (isMaskable) {
      // For maskable icons, add padding and background
      const innerSize = Math.round(size * (1 - padding * 2));
      const offset = Math.round(size * padding);
      
      // Resize the logo to fit within the safe zone
      const resizedLogo = await sharp(inputPath)
        .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      
      // Create a background with the logo centered
      await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: BACKGROUND_COLOR
        }
      })
        .composite([{
          input: resizedLogo,
          top: offset,
          left: offset
        }])
        .png()
        .toFile(outputPath);
    } else {
      // Standard icon - resize with transparent background
      await image
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outputPath);
    }
    
    console.log(`✅ Generated: ${outputPath} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Failed to generate ${outputPath}:`, error.message);
  }
}

async function generateFavicon(inputPath, outputPath) {
  try {
    // Generate a 32x32 PNG for favicon (ICO format is tricky, use PNG)
    await sharp(inputPath)
      .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outputPath.replace('.ico', '.png'));
    
    // Copy as .ico (browsers accept PNG with .ico extension)
    copyFileSync(outputPath.replace('.ico', '.png'), outputPath);
    console.log(`✅ Generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to generate ${outputPath}:`, error.message);
  }
}

async function main() {
  console.log('🎨 App Icon Generator\n');
  console.log(`📁 Source: ${SOURCE_LOGO}`);
  console.log(`📁 Output: ${PUBLIC_DIR}\n`);
  
  // Check if source logo exists
  if (!existsSync(SOURCE_LOGO)) {
    console.error('❌ Source logo not found at:', SOURCE_LOGO);
    process.exit(1);
  }
  
  // Ensure public directory exists
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  console.log('📱 Generating iOS icons...');
  for (const icon of IOS_ICONS) {
    await generateIcon(SOURCE_LOGO, join(PUBLIC_DIR, icon.name), icon.size);
  }
  
  console.log('\n🤖 Generating Android/PWA icons...');
  for (const icon of ANDROID_ICONS) {
    if (icon.name === 'favicon.ico') {
      await generateFavicon(SOURCE_LOGO, join(PUBLIC_DIR, icon.name));
    } else {
      await generateIcon(SOURCE_LOGO, join(PUBLIC_DIR, icon.name), icon.size);
    }
  }
  
  console.log('\n🎭 Generating maskable icons (Android adaptive)...');
  for (const icon of MASKABLE_ICONS) {
    await generateIcon(SOURCE_LOGO, join(PUBLIC_DIR, icon.name), icon.size, true, icon.padding);
  }
  
  console.log('\n✨ Icon generation complete!');
  console.log('\n📋 Generated icons summary:');
  console.log('   iOS: apple-touch-icon variants (60-180px)');
  console.log('   Android: app-icon variants (144-512px)');
  console.log('   PWA: android-chrome variants');
  console.log('   Favicon: 16px, 32px, .ico');
  console.log('   Maskable: 192px, 512px with safe zone padding');
}

main().catch(console.error);
