import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import routes from './routes';

const app = new Hono();

app.use(logger());
app.use(prettyJSON());
app.use('*', cors());

app.route('/', routes);

export default app;
