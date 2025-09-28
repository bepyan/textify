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
} from '../middleware/error-handler';

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

// Rate limiting (분당 100 요청)
app.use('/extract/*', rateLimitMiddleware(100, 60000));

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

// 콘텐츠 추출 API 라우트 추가
app.route('/extract', extract);
// app.get(
//   '/',
//   describeRoute({
//     description: 'Say hello to the user',
//     responses: {
//       200: {
//         description: 'Successful response',
//         content: {
//           'application/json': { schema: resolver(responseSchema) },
//         },
//       },
//     },
//   }),
//   validator('query', querySchema),
//   (c) => {
//     const query = c.req.valid('query');
//     return c.text(`Hello ${query?.name ?? 'Hono'}!`);
//   },
// );
app.get('/health', (c) => c.text('OK'));
app.get('/docs', swaggerUI({ url: '/api/schema' }));
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
