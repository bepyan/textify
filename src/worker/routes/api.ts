// API Routes for Textify Content Extraction Tool
// Implements /api/extract, /api/validate endpoints

import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { validator } from 'hono/validator';
import { openAPIRouteHandler } from 'hono-openapi';
import { NaverExtractor } from '../lib/extractors/naver';
import { YouTubeExtractor } from '../lib/extractors/youtube';
import {
  extractionRequestSchema,
  validationRequestSchema,
  extractionResponseSchema,
  validationResponseSchema,
} from '../lib/validators/schemas';
import type {
  ExtractionRequest,
  ExtractionResponse,
  ValidationRequest,
  ValidationResponse,
  ExtractionResult,
} from '../types';

const app = new Hono();

// CORS middleware
app.use(
  '/*',
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8787',
      'https://textify.bepyan.workers.dev',
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Initialize extractors
const youtubeExtractor = new YouTubeExtractor(process.env.YOUTUBE_API_KEY);
const naverExtractor = new NaverExtractor();

/**
 * POST /api/extract - Extract content from URL
 */
app.post(
  '/extract',
  validator('json', (value, c) => {
    const parsed = extractionRequestSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: 'Invalid request format',
        cause: parsed.error,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    const startTime = Date.now();

    try {
      const request: ExtractionRequest = c.req.valid('json');
      const { url, options = {} } = request;

      // Determine platform type
      const platformType = detectPlatformType(url);

      let result: ExtractionResult;

      // Extract content based on platform
      switch (platformType) {
        case 'youtube':
          result = await youtubeExtractor.extract(url, {
            language: options.language,
            includeTimestamps: options.includeTimestamps,
          });
          break;

        case 'naver':
          result = await naverExtractor.extract(url, {
            format: options.format || 'plain',
          });
          break;

        default:
          result = {
            success: false,
            error: {
              code: 'UNSUPPORTED_PLATFORM',
              message:
                '지원하지 않는 플랫폼입니다. YouTube 또는 Naver 블로그 URL을 사용해주세요.',
              retryable: false,
            },
            processingTime: Date.now() - startTime,
            timestamp: new Date(),
          };
      }

      // Format response
      const response: ExtractionResponse = {
        success: result.success,
        data: result.data,
        error: result.error,
        processingTime: result.processingTime,
        timestamp: result.timestamp.toISOString(),
      };

      // Return appropriate status code
      const statusCode = result.success
        ? 200
        : getErrorStatusCode(result.error?.code);

      return c.json(response, statusCode);
    } catch (error) {
      console.error('Extraction error:', error);

      const response: ExtractionResponse = {
        success: false,
        error: {
          code: 'EXTRACTION_FAILED',
          message: '콘텐츠 추출 중 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : 'Unknown error',
          retryable: false,
        },
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      return c.json(response, 500);
    }
  },
);

/**
 * POST /api/validate - Validate URL
 */
app.post(
  '/validate',
  validator('json', (value, c) => {
    const parsed = validationRequestSchema.safeParse(value);
    if (!parsed.success) {
      throw new HTTPException(400, {
        message: 'Invalid request format',
        cause: parsed.error,
      });
    }
    return parsed.data;
  }),
  async (c) => {
    try {
      const request: ValidationRequest = c.req.valid('json');
      const { url } = request;

      // Detect platform type
      const platformType = detectPlatformType(url);

      let isValid = false;
      let normalizedUrl: string | undefined;

      // Validate based on platform
      switch (platformType) {
        case 'youtube':
          isValid = await youtubeExtractor.validate(url);
          if (isValid) {
            normalizedUrl = normalizeYouTubeUrl(url);
          }
          break;

        case 'naver':
          isValid = await naverExtractor.validate(url);
          if (isValid) {
            normalizedUrl = url; // Naver URLs don't need normalization
          }
          break;

        default:
          isValid = false;
      }

      const response: ValidationResponse = {
        valid: isValid,
        type: platformType,
        normalizedUrl,
        reason: isValid
          ? undefined
          : getValidationFailureReason(platformType, url),
      };

      return c.json(response, 200);
    } catch (error) {
      console.error('Validation error:', error);

      const response: ValidationResponse = {
        valid: false,
        type: 'unknown',
        reason: '유효성 검사 중 오류가 발생했습니다.',
      };

      return c.json(response, 500);
    }
  },
);

/**
 * GET /api/health - Health check
 */
app.get('/health', (c) => {
  const response = {
    status: 'healthy' as const,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };

  return c.json(response, 200);
});

/**
 * GET /api/docs - Swagger UI
 */
app.get('/docs', swaggerUI({ url: '/api/schema' }));

/**
 * GET /api/schema - OpenAPI schema
 */
app.get(
  '/schema',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Textify Content Extraction API',
        version: '1.0.0',
        description:
          'API for extracting clean text content from YouTube videos and Naver blog posts',
      },
      servers: [
        {
          url: 'https://textify.bepyan.workers.dev/api',
          description: 'Production',
        },
        { url: 'http://localhost:8787/api', description: 'Development' },
      ],
    },
  }),
);

// Helper functions

/**
 * Detect platform type from URL
 */
function detectPlatformType(url: string): 'youtube' | 'naver' | 'unknown' {
  if (!url || typeof url !== 'string') {
    return 'unknown';
  }

  // YouTube patterns
  if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
    return 'youtube';
  }

  // Naver blog patterns
  if (url.includes('blog.naver.com')) {
    return 'naver';
  }

  return 'unknown';
}

/**
 * Normalize YouTube URL to standard format
 */
function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  return url;
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeVideoId(url: string): string | null {
  const watchMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return watchMatch ? watchMatch[1] : null;
}

/**
 * Get appropriate HTTP status code for error
 */
function getErrorStatusCode(errorCode?: string): number {
  switch (errorCode) {
    case 'INVALID_URL':
    case 'UNSUPPORTED_PLATFORM':
      return 400;
    case 'CONTENT_NOT_FOUND':
    case 'NO_SUBTITLES':
      return 404;
    case 'RATE_LIMITED':
      return 429;
    case 'TIMEOUT':
    case 'EXTRACTION_FAILED':
    default:
      return 500;
  }
}

/**
 * Get validation failure reason
 */
function getValidationFailureReason(platformType: string, url: string): string {
  if (platformType === 'unknown') {
    return '지원하지 않는 플랫폼입니다. YouTube 또는 Naver 블로그 URL을 사용해주세요.';
  }

  return '올바른 URL 형식이 아닙니다.';
}

export default app;
