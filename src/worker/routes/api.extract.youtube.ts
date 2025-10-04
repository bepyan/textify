import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

import { YouTubeExtractor } from '@be/lib/youtube-extractor';
import { ErrorSchema, getValidationErrorResponse } from '@be/utils/error';

// ============================================================================
// Schema
// ============================================================================

const ParamsSchema = z.object({
  videoId: z
    .string()
    .min(3)
    .openapi({
      param: {
        name: 'videoId',
        in: 'query',
      },
      example: 'utImgpthqoo',
    }),
});

const CaptionTrackSchema = z.object({
  baseUrl: z.string(),
  languageCode: z.string(),
  name: z
    .object({
      simpleText: z.string().optional(),
    })
    .optional(),
});

const ResultSchema = z
  .object({
    title: z.string().nullable().openapi({
      example: 'YouTube Video Title',
    }),
    captionTracks: z.array(CaptionTrackSchema).openapi({
      example: [
        {
          baseUrl: 'https://www.youtube.com/api/timedtext?...',
          languageCode: 'ko',
          name: { simpleText: '한국어' },
        },
      ],
    }),
    captionData: z.object({
      events: z.array(
        z.object({
          segs: z.array(
            z.object({
              utf8: z.string(),
            }),
          ),
        }),
      ),
    }),
  })
  .openapi('YouTubeVideoInfo');

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
      description: 'Retrieve the YouTube video info with caption tracks',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Returns an error',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorSchema,
        },
      },
      description: 'Internal server error',
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
    async (c) => {
      const { videoId } = c.req.valid('query');

      const videoInfo = await YouTubeExtractor.getVideoInfo(videoId);

      return c.json(videoInfo, 200);
    },
    (result, c) => {
      if (!result.success) {
        return c.json(getValidationErrorResponse(result.error), 400);
      }
    },
  );

export default app;
