import { Hono } from 'hono';

import api from './api';

const app = new Hono();

app.route('/api/', api);

app.notFound((c) => {
  return c.json({ message: 'Not Found', ok: false }, 404);
});

export default app;
