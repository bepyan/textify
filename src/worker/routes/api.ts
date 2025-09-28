import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { openAPIRouteHandler } from 'hono-openapi';

import extract from './extract';
import {
  errorHandler,
  requestIdMiddleware,
  requestLoggingMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  jsonParsingMiddleware,
} from '../middleware/error-handler';

const app = new Hono();

// ============================================================================
// Global Middleware
// ============================================================================

// CORS 설정
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Request-ID'],
  maxAge: 86400,
  credentials: false,
}));

// 보안 헤더
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
  return c.json({
    status: 'healthy',
    service: 'textify-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime ? process.uptime() : 0,
    cache: {
      type: 'hono-cache-middleware',
      description: 'HTTP-level caching with Web Standards Cache API',
    },
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
  return c.json({
    cache: {
      type: 'hono-cache-middleware',
      description: 'HTTP-level caching with Web Standards Cache API',
      note: 'Cache statistics are managed by Cloudflare Workers Cache API',
    },
    timestamp: new Date().toISOString(),
    uptime: process.uptime ? process.uptime() : 0,
    memory: process.memoryUsage ? process.memoryUsage() : null,
  });
});

/**
 * POST /cache/clear - 전역 캐시 비우기 (관리용)
 */
app.post('/cache/clear', (c) => {
  return c.json({
    success: false,
    message: 'Cache clearing is managed by Cloudflare Workers Cache API',
    note: 'Use Cloudflare Dashboard or API to manage cache',
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
