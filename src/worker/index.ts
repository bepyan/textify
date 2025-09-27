import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import routes from '@be/routes';

const app = new Hono();

app.use(logger());
app.use(prettyJSON());

app.route('/', routes);

export default app;
