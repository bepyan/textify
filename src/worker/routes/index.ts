import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';

import extractNaver from './api.extract.naver';
import sample from './api.sample';

// ============================================================================
// Route
// ============================================================================

const app = new OpenAPIHono()
  ///////////////////////////////////////////////////////////////////////////
  .route('/api/sample', sample)
  .route('/api/extract/naver', extractNaver);

// ============================================================================
// Docs
// ============================================================================

app.doc31('/api/docs', {
  openapi: '3.1.0',
  info: { title: 'Textify API', version: '0.1.0' },
  servers: [
    {
      url: 'https://textify.bepyan.workers.dev/',
      description: 'Production',
    },
    {
      url: 'http://localhost:8787/',
      description: 'Development',
    },
  ],
});

app.get('/api/ui', swaggerUI({ url: '/api/docs' }));

// ============================================================================
// Error
// ============================================================================

app.notFound((c) => {
  return c.json(
    {
      code: 404,
      message: 'Not Found',
    },
    404,
  );
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      code: 500,
      message: 'Internal Server Error',
    },
    500,
  );
});

// ============================================================================
// Export
// ============================================================================

export default app;
