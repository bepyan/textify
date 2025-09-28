import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import api from './api';

const app = new Hono();

app.route('/api/', api);

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
