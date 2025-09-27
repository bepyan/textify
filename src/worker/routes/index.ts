import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import api from './api';

const app = new Hono();

// CORS for all routes
app.use(
  '/*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8787',
      'https://textify.bepyan.workers.dev',
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// API routes
app.route('/api', api);

// Health check endpoint (also available at root level)
app.get('/health', (c) => {
  const response = {
    status: 'healthy' as const,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  return c.json(response, 200);
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Textify Content Extraction API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/api/docs',
      schema: '/api/schema',
    },
  });
});

// Error handlers
app.notFound((c) => {
  return c.json(
    {
      message: 'Not Found',
      ok: false,
      availableEndpoints: [
        '/health',
        '/api/extract',
        '/api/validate',
        '/api/health',
        '/api/docs',
      ],
    },
    404,
  );
});

app.onError((err, c) => {
  console.error('Server error:', err);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json(
    {
      message: 'Internal Server Error',
      ok: false,
      timestamp: new Date().toISOString(),
    },
    500,
  );
});

export default app;
