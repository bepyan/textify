/// <reference types="vitest/config" />

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

import { pwaConfig } from './config/pwa';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      routesDirectory: 'src/frontend/routes',
      generatedRouteTree: 'src/frontend/routeTree.gen.ts',
    }),
    react(),
    tsconfigPaths(),
    cloudflare(),
    VitePWA(pwaConfig),
  ],
  server: {
    port: 8787,
  },
  test: {
    projects: [
      {
        test: {
          include: ['src/frontend/**/*.test.(ts|tsx)'],
          environment: 'jsdom',
          browser: {
            provider: 'playwright',
            enabled: true,
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          include: ['src/worker/**/*.test.ts'],
          environment: 'node',
        },
      },
    ],
  },
});
