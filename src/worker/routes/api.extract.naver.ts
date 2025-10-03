import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import { createStandardNaverBlogUrl } from '@be/lib/naver-extractor';
import { ErrorSchema, getValidationErrorResponse } from '@be/utils/error';

// ============================================================================
// Schema
// ============================================================================

const ParamsSchema = z.object({
  userId: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'userId',
        in: 'query',
      },
      example: 'ranto28',
    }),
  postId: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'postId',
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

const app = new OpenAPIHono()
  ///////////////////////////////////////////////////////////////////////////////
  .openapi(
    route,
    (c) => {
      const { userId, postId } = c.req.valid('query');

      const standardUrl = createStandardNaverBlogUrl(userId, postId);

      // TODO: craw data from standardUrl

      return c.json(
        {
          content: standardUrl,
        },
        200,
      );
    },
    (result, c) => {
      if (!result.success) {
        return c.json(getValidationErrorResponse(result.error), 400);
      }
    },
  );

export default app;
