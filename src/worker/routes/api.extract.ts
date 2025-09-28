import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { z } from 'zod';

const schema = {
  response: z.string(),
  query: z.object({
    name: z.string().optional(),
  }),
};

const app = new Hono().get(
  '/',
  describeRoute({
    description: 'Say hello to the user',
    responses: {
      200: {
        description: 'Successful response',
        content: {
          'application/json': { schema: resolver(schema.response) },
        },
      },
    },
  }),
  validator('query', schema.query),
  (c) => {
    const query = c.req.valid('query');
    return c.json({ message: `Hello ${query?.name ?? 'Hono'}!` });
  },
);

export default app;
