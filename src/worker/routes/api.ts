import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';

import extract from './extract';
import {
  errorHandler,
  requestIdMiddleware,
  requestLoggingMiddleware,
  rateLimitMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  jsonParsingMiddleware,
} from '../middleware/error-handler';
// import { contentCache } from '../utils/cache'; // 현재 비활성화

const app = new Hono();

// ============================================================================
// Global Middleware
// ============================================================================

// 보안 및 CORS 헤더
app.use('*', corsMiddleware());
app.use('*', securityHeadersMiddleware());

// 요청 ID 및 로깅
app.use('*', requestIdMiddleware());
app.use('*', requestLoggingMiddleware());

// JSON 파싱 에러 처리
app.use('*', jsonParsingMiddleware());

// Rate limiting (분당 1000 요청 - 개발 환경에서 완화)
app.use('/extract/*', rateLimitMiddleware(1000, 60000));

// 전역 에러 핸들러
app.use('*', errorHandler());

// ============================================================================
// Routes
// ============================================================================

app.get('/', (c) =>
  c.json({
    name: 'Textify API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }),
);

app.route('/extract', extract);

// ============================================================================
// Health Check & Monitoring
// ============================================================================

/**
 * GET /health - 전역 헬스 체크
 */
app.get('/health', (c) => {
  // const cacheStats = contentCache.getStats(); // 현재 비활성화
  const cacheStats = { hits: 0, misses: 0, entries: 0, hitRate: 0, memoryUsage: 0 };

  return c.json({
    status: 'healthy',
    service: 'textify-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime ? process.uptime() : 0,
    cache: cacheStats,
    endpoints: {
      extraction: '/api/extract',
      documentation: '/api/docs',
      schema: '/api/schema',
    },
  });
});

/**
 * GET /stats - 전역 통계 정보
 */
app.get('/stats', (c) => {
  // const cacheStats = contentCache.getStats(); // 현재 비활성화
  const cacheStats = { hits: 0, misses: 0, entries: 0, hitRate: 0, memoryUsage: 0 };

  return c.json({
    cache: cacheStats,
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    memory: process.memoryUsage ? process.memoryUsage() : null,
  });
});

/**
 * POST /cache/clear - 전역 캐시 비우기 (관리용)
 */
app.post('/cache/clear', (c) => {
  // contentCache.clear(); // 현재 비활성화

  return c.json({
    success: true,
    message: 'Global cache cleared successfully',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------------------------------
// Swagger UI and OpenAPI Schema
// ----------------------------------------------------------------------------

app.get(
  '/docs',
  swaggerUI({
    url: '/api/schema',
  }),
);

app.get(
  '/schema',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Textify API',
        version: '0.1.0',
        description: 'API Server build with Hono 🔥',
      },
      servers: [
        { url: 'https://textify.bepyan.me/api' },
        { url: 'http://localhost:8787/api' },
      ],
    },
  }),
);

export default app;
