/**
 * Content Extraction API Routes
 *
 * 콘텐츠 추출 API 엔드포인트들
 */

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { cache } from 'hono/cache';

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
// Common Handlers
// ============================================================================

/**
 * 추출기 팩토리 함수
 */
function createExtractor(platform: ContentPlatform) {
  switch (platform) {
    case ContentPlatform.YOUTUBE:
      return new YouTubeExtractor();
    case ContentPlatform.NAVER_BLOG:
      return new NaverBlogExtractor();
    default:
      throw new ContentExtractionError(
        ExtractionErrorType.UNSUPPORTED_PLATFORM,
        `지원하지 않는 플랫폼입니다: ${platform}`,
      );
  }
}

/**
 * 공통 라우트 핸들러 팩토리
 */
function createExtractionHandler(
  expectedPlatform?: ContentPlatform,
  platformErrorMessage?: string,
) {
  return async (c: any) => {
    const startTime = performance.now();
    const requestId = generateRequestId();
    let detectedPlatform: ContentPlatform | 'unknown' = 'unknown';

    try {
      const { url, options } = c.req.valid('json');

      // 플랫폼 감지 및 검증
      if (expectedPlatform) {
        // 특정 플랫폼 전용 엔드포인트
        const platform = detectPlatform(url);
        if (platform !== expectedPlatform) {
          throw new ContentExtractionError(
            ExtractionErrorType.INVALID_URL,
            platformErrorMessage || `${expectedPlatform} URL이 아닙니다.`,
            `제공된 URL: ${url}`,
          );
        }
        detectedPlatform = expectedPlatform;
      } else {
        // 자동 감지 엔드포인트
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
        detectedPlatform = parseResult.platform;
      }

      // 추출기 생성 및 콘텐츠 추출
      const extractor = createExtractor(detectedPlatform);
      const content = await extractor.extract(url, options as any);

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
      // 자동 감지 엔드포인트에서 플랫폼 재감지 시도
      if (!expectedPlatform && detectedPlatform === 'unknown') {
        try {
          const { url } = c.req.valid('json');
          const parseResult = parseUrl(url);
          if (parseResult.success && parseResult.platform) {
            detectedPlatform = parseResult.platform;
          }
        } catch {
          // 플랫폼 감지 실패 시 unknown 유지
        }
      }

      return handleExtractionError(
        c,
        error,
        requestId,
        startTime,
        detectedPlatform,
      );
    }
  };
}

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
  createExtractionHandler(ContentPlatform.YOUTUBE, 'YouTube URL이 아닙니다.'),
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
  createExtractionHandler(
    ContentPlatform.NAVER_BLOG,
    '네이버 블로그 URL이 아닙니다.',
  ),
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
  createExtractionHandler(), // 자동 감지이므로 expectedPlatform 없음
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
