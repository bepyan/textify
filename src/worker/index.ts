import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { openAPIRouteHandler } from 'hono-openapi';

import routes from './routes';

const app = new Hono();

app.use(logger());
app.use(prettyJSON());
app.use('*', cors());

app.route('/', routes);

app.get(
  '/api/docs',
  swaggerUI({
    url: '/api/schema',
  }),
);

app.get(
  '/api/schema',
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

app.notFound((c) => {
  return c.json({ message: 'Not Found', ok: false }, 404);
});

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({ message: 'Internal Server Error', ok: false }, 500);
});

export default app;
