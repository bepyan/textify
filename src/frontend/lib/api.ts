import { hc } from 'hono/client';

import type routes from '@be/routes';

const API_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://textify.bepyan.me/api'
    : 'http://localhost:8787/';

export const client = hc<typeof routes>(API_URL);
