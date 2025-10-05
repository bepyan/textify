/// <reference types="vitest/config" />

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackRouter({
      routesDirectory: 'src/frontend/routes',
      generatedRouteTree: 'src/frontend/routeTree.gen.ts',
    }),
    react(),
    tsconfigPaths(),
    cloudflare({
      configPath: isDev ? 'wrangler.local.json' : 'wrangler.json',
    }),
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
