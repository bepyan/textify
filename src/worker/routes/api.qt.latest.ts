import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import { extractQtLatest } from '@be/lib/qt-extractor';

// ============================================================================
// Schema
// ============================================================================

const ResponseSchema = z.string().openapi({
  example: '성전의 정화\n본문 : 역대하(2 Chronicles)29:1 - 29:19 찬송가 14장',
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
        'text/plain': {
          schema: ResponseSchema,
        },
      },
      description: '매일성경 본문 추출',
    },
    500: {
      content: {
        'text/plain': {
          schema: z.string(),
        },
      },
      description: 'Failed to extract daily Bible text',
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

    if (!result.title || !result.description) {
      return c.text('Failed to extract daily Bible text', 500);
    }

    return c.text(result.title + '\n' + result.description, 200);
  });

export default app;
