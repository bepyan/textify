import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import { extractQtLatest } from '@be/lib/qt-extractor';

// ============================================================================
// Schema
// ============================================================================

const ResponseSchema = z.object({
  title: z.string().openapi({
    example: '성전의 정화',
  }),
  description: z.string().openapi({
    example: '본문 : 역대하(2 Chronicles)29:1 - 29:19 찬송가 14장',
  }),
});

// ============================================================================
// Route
// ============================================================================

const route = createRoute({
  method: 'get',
  path: '/',
  tags: ['qt'],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ResponseSchema,
        },
      },
      description: '매일성경 본문 추출',
    },
  },
});

// ============================================================================
// App
// ============================================================================

const app = new OpenAPIHono()
  ///////////////////////////////////////////////////////////////////////////////
  .openapi(route, async (c) => {
    const result = await extractQtLatest();
    return c.json(result, 200);
  });

export default app;
