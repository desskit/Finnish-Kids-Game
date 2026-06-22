import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Vitest is configured separately from vite.config.ts so the PWA/service-worker
// plugin doesn't run during tests. jsdom provides a DOM for the component tests;
// the setup file stubs the browser audio APIs jsdom doesn't implement. The
// Playwright specs in e2e/ are excluded — they run under `npm run test:e2e`.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/**/*.d.ts',
      ],
    },
  },
});
