import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      protocol: 'wss',
      clientPort: 443
    }
  },
  publicDir: 'public',
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        id: "app.zhengrowth.pwa",
        name: "ZhenGrowth",
        short_name: "ZhenGrowth",
        description: "Life & career coaching for Chinese-speaking professionals worldwide",
        start_url: "/",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        orientation: "portrait",
        background_color: "#0b1f1f",
        theme_color: "#0b1f1f",
        icons: [
          { 
            src: "/app-icon-192.png", 
            sizes: "192x192", 
            type: "image/png",
            purpose: "any"
          },
          { 
            src: "/app-icon-192-maskable.png", _composer_unnamed_chunk_1
            sizes: "192x192", 
            type: "image/png",
            purpose: "maskable"
          },
          { 
            src: "/app-icon-512.png", 
            sizes: "512x512", 
            type: "image/png",
            purpose: "any"
          },
          { 
            src: "/app-icon-512.png", // Use 512 maskable if available, fallback to same
            sizes: "512x512", 
            type: "image/png",
            purpose: "maskable"
          }
        ],
        categories: ["lifestyle", "education", "health"],
        screenshots: [
          {
            src: "/screenshots/mobile-home.png",
            sizes: "540x720",
            type: "image/png",
            form_factor: "narrow",
            label: "ZhenGrowth home screen"
          },
          {
            src: "/screenshots/desktop-dashboard.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
            label: "ZhenGrowth dashboard"
          }
        ],
        shortcuts: [
          {
            name: "Take Quiz",
            short_name: "Quiz",
            description: "60-second self-assessment",
            url: "/pwa/quiz",
            icons: [{ "src": "/app-icon-192.png", "sizes": "192x192" }]
          },
          {
            name: "Book Coaching",
            short_name: "Book",
            description: "Schedule a session",
            url: "/pwa/coaching",
            icons: [{ "src": "/app-icon-192.png", "sizes": "192x192" }]
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true, 
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,webp,mp4}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, 
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Force single React instance - critical for hooks to work
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react-dom/client": path.resolve(__dirname, "./node_modules/react-dom/client"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
      "react-router": path.resolve(__dirname, "./node_modules/react-router"),
      "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom"),
    },
    dedupe: [
      "react", 
      "react-dom", 
      "react-dom/client", 
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-router",
      "react-router-dom",
      "@tanstack/react-query"
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router',
      'react-router-dom',
      '@tanstack/react-query'
    ],
    force: true,
    esbuildOptions: {
      resolveExtensions: ['.js', '.jsx', '.ts', '.tsx'],
    }
  },
  ssr: {
    noExternal: ['react', 'react-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
}));