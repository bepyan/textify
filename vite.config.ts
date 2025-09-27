import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
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
});
