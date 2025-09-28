/// <reference types="vitest/config" />

import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

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
  ],
  server: {
    port: 8787,
  },
  test: {
    projects: [
      {
        test: {
          include: [
            'src/frontend/**/*.test.(ts|tsx)',
            'tests/e2e/**/*.test.ts',
          ],
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
          include: [
            'src/worker/**/*.test.ts',
            'tests/contract/**/*.test.ts',
            'tests/integration/**/*.test.ts',
          ],
          environment: 'node',
        },
      },
    ],
  },
});
