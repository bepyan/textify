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

const ResultSchema = z
  .object({
    info: z
      .object({
        videoId: z.string(),
        channelId: z.string(),
        author: z.string(),
        title: z.string(),
        lengthSeconds: z.string(),
        keywords: z.array(z.string()),
        viewCount: z.string(),
        thumbnail: z.object({
          thumbnails: z.array(
            z.object({
              url: z.string(),
              width: z.number(),
              height: z.number(),
            }),
          ),
        }),
      })
      .openapi({
        example: {
          videoId: 'utImgpthqoo',
          channelId: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
          author: '슈카월드',
          title: "'이민자를 추방하라', 유럽에 부는 반이민 열풍",
          keywords: ['슈카', '슈카월드', '경제'],
          lengthSeconds: '1240',
          viewCount: '488830',
          thumbnail: {
            thumbnails: [
              {
                url: 'https://i.ytimg.com/vi/utImgpthqoo/default.jpg',
                width: 120,
                height: 90,
              },
            ],
          },
        },
      }),
    caption: z
      .object({
        events: z.array(
          z.object({
            segs: z.array(
              z.object({
                utf8: z.string(),
              }),
            ),
          }),
        ),
      })
      .openapi({
        example: {
          events: [
            {
              tStartMs: 34180,
              dDurationMs: 1720,
              segs: [{ utf8: '다음 주제는 더 웃지 못할 주제네' }],
            },
          ],
        },
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

      const videoData = await YouTubeExtractor.getVideoData(videoId);

      return c.json(
        {
          info: videoData.info,
          caption: videoData.captionData,
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
