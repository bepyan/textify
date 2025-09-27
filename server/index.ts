import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import routes from './routes';

const app = new Hono();

app.use(logger());
app.use(prettyJSON());

app.route('/', routes);

// ----------------------------------------------------------------------------
// NOTE: Docker 환경에서 유용한 방법입니다.
// 해당 앱에서는 Vercel CDN을 활용하기 위해 Frontend 서버와 분리합니다.
// ----------------------------------------------------------------------------
// app.get('*', serveStatic({ root: './frontend/build/client' }));
// app.get('*', serveStatic({ path: './frontend/build/client/index.html' }));

export default {
  port: 1129,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
