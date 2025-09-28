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
app.use(
  '*',
  cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Request-ID'],
    maxAge: 86400,
    credentials: false,
  }),
);

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

app.route('/extract', extract);

// ============================================================================
// Utils Endpoints
// ============================================================================

app.get('/', (c) =>
  c.json({
    name: 'Textify API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }),
);

app.get('/health', (c) => {
  return c.text('OK');
});

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
 