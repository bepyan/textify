/**
 * Content Extraction API Routes
 *
 * 콘텐츠 추출 API 엔드포인트들
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { NaverBlogExtractor } from '../extractors/naver-blog-extractor';
import { YouTubeExtractor } from '../extractors/youtube-extractor';
import {
  ContentExtractionError,
  ExtractionErrorType,
  getHttpStatusFromErrorType,
} from '../types/errors';
import {
  ExtractionRequestSchema,
  generateRequestId,
  createResponseMetadata,
  ContentPlatform,
} from '../types/extraction';
import { detectPlatform, parseUrl } from '../utils/url-parser';

// ============================================================================
// Router Setup
// ============================================================================

const extract = new Hono();

// ============================================================================
// Route Handlers
// ============================================================================

/**
 * POST /extract/youtube - YouTube 콘텐츠 추출
 */
extract.post(
  '/youtube',
  zValidator('json', ExtractionRequestSchema, (result, c) => {
    if (!result.success) {
      const requestId = generateRequestId();
      const metadata = createResponseMetadata(
        requestId,
        0,
        ContentPlatform.YOUTUBE,
        [],
      );

      return c.json(
        {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: '요청 데이터가 유효하지 않습니다.',
            details: JSON.stringify(result.error.issues),
            retryable: false,
          },
          metadata,
        },
        400,
      );
    }
  }),
  async (c) => {
    const startTime = performance.now();
    const requestId = generateRequestId();

    try {
      const { url, options } = c.req.valid('json');

      // YouTube URL 검증
      const platform = detectPlatform(url);
      if (platform !== ContentPlatform.YOUTUBE) {
        throw new ContentExtractionError(
          ExtractionErrorType.INVALID_URL,
          'YouTube URL이 아닙니다.',
          `제공된 URL: ${url}`,
        );
      }

      // YouTube 추출기로 콘텐츠 추출
      const extractor = new YouTubeExtractor();
      const content = await extractor.extract(url, options);

      // 성공 응답
      const processingTime = Math.max(
        1,
        Math.round(performance.now() - startTime),
      );
      const metadata = createResponseMetadata(
        requestId,
        processingTime,
        ContentPlatform.YOUTUBE,
        Object.keys(content).filter(
          (key) => content[key as keyof typeof content] !== undefined,
        ),
      );

      return c.json(
        {
          success: true,
          data: content,
          metadata,
        },
        200,
      );
    } catch (error) {
      return handleExtractionError(
        c,
        error,
        requestId,
        startTime,
        ContentPlatform.YOUTUBE,
      );
    }
  },
);

/**
 * POST /extract/naver-blog - 네이버 블로그 콘텐츠 추출
 */
extract.post(
  '/naver-blog',
  zValidator('json', ExtractionRequestSchema, (result, c) => {
    if (!result.success) {
      const requestId = generateRequestId();
      const metadata = createResponseMetadata(
        requestId,
        0,
        ContentPlatform.NAVER_BLOG,
        [],
      );

      return c.json(
        {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: '요청 데이터가 유효하지 않습니다.',
            details: JSON.stringify(result.error.issues),
            retryable: false,
          },
          metadata,
        },
        400,
      );
    }
  }),
  async (c) => {
    const startTime = performance.now();
    const requestId = generateRequestId();

    try {
      const { url, options } = c.req.valid('json');

      // 네이버 블로그 URL 검증
      const platform = detectPlatform(url);
      if (platform !== ContentPlatform.NAVER_BLOG) {
        throw new ContentExtractionError(
          ExtractionErrorType.INVALID_URL,
          '네이버 블로그 URL이 아닙니다.',
          `제공된 URL: ${url}`,
        );
      }

      // 네이버 블로그 추출기로 콘텐츠 추출
      const extractor = new NaverBlogExtractor();
      const content = await extractor.extract(url, options);

      // 성공 응답
      const processingTime = Math.max(
        1,
        Math.round(performance.now() - startTime),
      );
      const metadata = createResponseMetadata(
        requestId,
        processingTime,
        ContentPlatform.NAVER_BLOG,
        Object.keys(content).filter(
          (key) => content[key as keyof typeof content] !== undefined,
        ),
      );

      return c.json(
        {
          success: true,
          data: content,
          metadata,
        },
        200,
      );
    } catch (error) {
      return handleExtractionError(
        c,
        error,
        requestId,
        startTime,
        ContentPlatform.NAVER_BLOG,
      );
    }
  },
);

/**
 * POST /extract/auto - 자동 플랫폼 감지 및 콘텐츠 추출
 */
extract.post(
  '/auto',
  zValidator('json', ExtractionRequestSchema, (result, c) => {
    if (!result.success) {
      const requestId = generateRequestId();
      const metadata = createResponseMetadata(requestId, 0, 'unknown', []);

      return c.json(
        {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: '요청 데이터가 유효하지 않습니다.',
            details: JSON.stringify(result.error.issues),
            retryable: false,
          },
          metadata,
        },
        400,
      );
    }
  }),
  async (c) => {
    const startTime = performance.now();
    const requestId = generateRequestId();
    let url = '';

    try {
      const requestData = c.req.valid('json');
      url = requestData.url;
      const options = requestData.options;

      // URL 파싱 및 플랫폼 자동 감지
      const parseResult = parseUrl(url);

      if (!parseResult.success || !parseResult.platform) {
        const errorType =
          parseResult.error === 'INVALID_URL'
            ? ExtractionErrorType.INVALID_URL
            : ExtractionErrorType.UNSUPPORTED_PLATFORM;

        throw new ContentExtractionError(
          errorType,
          parseResult.error === 'INVALID_URL'
            ? '유효하지 않은 URL입니다.'
            : '지원하지 않는 플랫폼입니다.',
          `제공된 URL: ${url}`,
        );
      }

      // 플랫폼별 추출기 선택 및 실행
      let content;
      const detectedPlatform = parseResult.platform;

      switch (parseResult.platform) {
        case ContentPlatform.YOUTUBE: {
          const youtubeExtractor = new YouTubeExtractor();
          content = await youtubeExtractor.extract(url, options);
          break;
        }

        case ContentPlatform.NAVER_BLOG: {
          const naverExtractor = new NaverBlogExtractor();
          content = await naverExtractor.extract(url, options);
          break;
        }

        default:
          throw new ContentExtractionError(
            ExtractionErrorType.UNSUPPORTED_PLATFORM,
            `지원하지 않는 플랫폼입니다: ${parseResult.platform}`,
          );
      }

      // 성공 응답
      const processingTime = Math.max(
        1,
        Math.round(performance.now() - startTime),
      );
      const metadata = createResponseMetadata(
        requestId,
        processingTime,
        detectedPlatform,
        Object.keys(content).filter(
          (key) => content[key as keyof typeof content] !== undefined,
        ),
      );

      return c.json(
        {
          success: true,
          data: content,
          metadata,
        },
        200,
      );
    } catch (error) {
      // 플랫폼 감지를 다시 시도해서 메타데이터에 포함
      let detectedPlatform: ContentPlatform | 'unknown' = 'unknown';
      try {
        const parseResult = parseUrl(url);
        if (parseResult.success && parseResult.platform) {
          detectedPlatform = parseResult.platform;
        }
      } catch {
        // 플랫폼 감지 실패 시 unknown 유지
      }

      return handleExtractionError(
        c,
        error,
        requestId,
        startTime,
        detectedPlatform,
      );
    }
  },
);

// ============================================================================
// Error Handler
// ============================================================================

function handleExtractionError(
  c: { json: (data: unknown, status?: number) => Response },
  error: unknown,
  requestId: string,
  startTime: number,
  platform: ContentPlatform | 'unknown',
) {
  const processingTime = Math.max(1, Math.round(performance.now() - startTime));

  // ContentExtractionError 처리
  if (error instanceof ContentExtractionError) {
    const httpStatus = getHttpStatusFromErrorType(error.type);
    const metadata = createResponseMetadata(
      requestId,
      processingTime,
      platform,
      [],
    );

    return c.json(
      {
        success: false,
        error: {
          type: error.type,
          message: error.message,
          details: error.details,
          retryable: error.retryable,
        },
        metadata,
      },
      httpStatus,
    );
  }

  // Zod 검증 에러 처리
  if (error && typeof error === 'object' && 'issues' in error) {
    const metadata = createResponseMetadata(
      requestId,
      processingTime,
      platform,
      [],
    );

    return c.json(
      {
        success: false,
        error: {
          type: 'VALIDATION_ERROR',
          message: '요청 데이터가 유효하지 않습니다.',
          details: JSON.stringify((error as { issues: unknown }).issues),
          retryable: false,
        },
        metadata,
      },
      400,
    );
  }

  // 일반 에러 처리
  const metadata = createResponseMetadata(
    requestId,
    processingTime,
    platform,
    [],
  );

  return c.json(
    {
      success: false,
      error: {
        type: ExtractionErrorType.PARSING_ERROR,
        message: '알 수 없는 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
        retryable: true,
      },
      metadata,
    },
    500,
  );
}

export default extract;
