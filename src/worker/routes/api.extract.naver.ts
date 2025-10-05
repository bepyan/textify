import { createRoute, z } from '@hono/zod-openapi';

import { extractNaverBlogContent } from '@be/lib/naver-extractor';
import { TextifyHono } from '@be/lib/textify-hono';
import { ErrorSchema, getValidationErrorResponse } from '@be/utils/error';

// ============================================================================
// Schema
// ============================================================================

const ParamsSchema = z.object({
  blogId: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'blogId',
        in: 'query',
      },
      example: 'ranto28',
    }),
  logNo: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'logNo',
        in: 'query',
      },
      example: '224028693561',
    }),
});

const ResultSchema = z
  .object({
    content: z.string().openapi({
      example: 'This is a test content',
    }),
  })
  .openapi('User');

// ============================================================================
// Route
// ============================================================================

const route = createRoute({
  method: 'get',
  path: '/',
  tags: ['extract'],
  request: {
    query: ParamsSchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ResultSchema,
        },
      },
      description: 'Retrieve the result',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Returns an error',
    },
  },
});

// ============================================================================
// App
// ============================================================================

const app = new TextifyHono()
  ///////////////////////////////////////////////////////////////////////////////
  .openapi(
    route,
    async (c) => {
      const { blogId, logNo } = c.req.valid('query');

      const cacheKey = `naver:${blogId}:${logNo}`;
      const cachedResult = await c.env.KV.get(cacheKey);
      if (cachedResult) {
        return c.json(JSON.parse(cachedResult), 200);
      }

      const content = await extractNaverBlogContent({ blogId, logNo });

      const result = { content };
      await c.env.KV.put(cacheKey, JSON.stringify(result));

      return c.json(result, 200);
    },
    (result, c) => {
      if (!result.success) {
        return c.json(getValidationErrorResponse(result.error), 400);
      }
    },
  );

export default app;
