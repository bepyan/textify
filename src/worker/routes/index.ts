import { Hono } from 'hono';
import { hc } from 'hono/client';

import extract from './api.extract';

const app = new Hono().route('/api/extract', extract);

export default app;

type AppType = typeof app;

// NOTE: assign the client to a variable to calculate the type when compiling
const _client = hc<AppType>('');
export type Client = typeof _client;

export const hcWithType = (...args: Parameters<typeof hc>): Client => {
  return hc<AppType>(...args);
};
