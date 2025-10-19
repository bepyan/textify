import type { VitePWAOptions } from 'vite-plugin-pwa';

export const pwaConfig: Partial<VitePWAOptions> = {
  registerType: 'autoUpdate',

  includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],

  manifest: {
    name: 'Textify - Text Extraction Tool',
    short_name: 'Textify',
    description:
      'Textify is a tool that helps you extract text from YouTube and Naver blog and more platforms.',
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone',
    scope: '/',
    start_url: '/',
    icons: [
      {
        src: 'pwa-64x64.png',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  },

  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB
    // 웹사이트 제어권 (즉시 활성화)
    clientsClaim: true,
    // 대기 중인 SW 즉시 활성화
    skipWaiting: true,
    // 오래된 캐시 자동 정리
    cleanupOutdatedCaches: true,

    runtimeCaching: [
      // CDN 폰트 (CacheFirst)
      {
        urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cdn-cache',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },

      // 이미지 (StaleWhileRevalidate)
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'images-cache',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
          },
        },
      },
    ],
  },
};
