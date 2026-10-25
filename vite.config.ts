import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// PWA now; orientation is intentionally "any" (unlocked) and the app is
// designed with no backend so it can be wrapped natively (Capacitor) later.
//
// `base` is configurable so the same build serves from any path:
//   - default "/"            → local dev, `npm run preview`, and host-at-root
//                              targets like Netlify (planned).
//   - BASE_PATH=/repo-name/  → GitHub Pages project site (set by the CI
//                              workflow). All in-app asset/manifest URLs are
//                              relative, so only this base needs to change.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  // Which build this is, shown in Grown-ups → Settings (Netlify sets COMMIT_REF).
  define: {
    __APP_BUILD__: JSON.stringify(
      `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC${process.env.COMMIT_REF ? ` · ${process.env.COMMIT_REF.slice(0, 7)}` : ''}`,
    ),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': a new version waits until src/pwaUpdate.ts (which registers
      // the worker itself) switches to it at a calm moment, never mid-game.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Kielipesä – Finnish for Kids',
        short_name: 'Kielipesä',
        description: 'A playful game for kids learning everyday Finnish.',
        lang: 'en',
        theme_color: '#d8ecf9',
        background_color: '#faf2e3',
        display: 'standalone',
        orientation: 'any',
        // Relative so the installed app starts correctly whether served from
        // the domain root (Netlify) or a project subpath (GitHub Pages).
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
});
