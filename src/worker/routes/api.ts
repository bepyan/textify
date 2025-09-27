import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';

const app = new Hono();

// const responseSchema = z.string();
// const querySchema = z.object({
//   name: z.string().optional(),
// });

app.get('/', (c) => c.json({ name: 'Cloudflaretest' }));
// app.get(
//   '/',
//   describeRoute({
//     description: 'Say hello to the user',
//     responses: {
//       200: {
//         description: 'Successful response',
//         content: {
//           'application/json': { schema: resolver(responseSchema) },
//         },
//       },
//     },
//   }),
//   validator('query', querySchema),
//   (c) => {
//     const query = c.req.valid('query');
//     return c.text(`Hello ${query?.name ?? 'Hono'}!`);
//   },
// );
app.get('/health', (c) => c.text('OK'));
app.get('/docs', swaggerUI({ url: '/api/schema' }));
app.get(
  '/schema',
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

export default app;
