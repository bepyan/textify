/**
 * Error Handling Middleware
 *
 * 전역 에러 처리 미들웨어
 */

import { type Context, type Next } from 'hono';
import { HTTPException } from 'hono/http-exception';

import {
  ContentExtractionError,
  ExtractionErrorType,
  getHttpStatusFromErrorType,
} from '../types/errors';
import { generateRequestId } from '../types/extraction';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

interface ErrorResponse {
  success: false;
  error: {
    type: string;
    message: string;
    details?: string;
    retryable: boolean;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    path: string;
    method: string;
  };
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

export function errorHandler() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId') || generateRequestId();
      const path = c.req.path;
      const method = c.req.method;
      const timestamp = new Date().toISOString();

      // ContentExtractionError 처리
      if (error instanceof ContentExtractionError) {
        const httpStatus = getHttpStatusFromErrorType(error.type);

        logger.logExtractionError(
          requestId,
          c.req.url,
          'unknown',
          error.type,
          error.message,
          0,
        );

        const response: ErrorResponse = {
          success: false,
          error: {
            type: error.type,
            message: error.message,
            details: error.details,
            retryable: error.retryable,
          },
          metadata: {
            requestId,
            timestamp,
            path,
            method,
          },
        };

        return c.json(response, httpStatus as never);
      }

      // HTTPException 처리 (Hono 내장)
      if (error instanceof HTTPException) {
        logger.error('HTTP Exception occurred', error, {
          requestId,
          path,
          method,
          status: error.status,
        });

        const response: ErrorResponse = {
          success: false,
          error: {
            type: 'HTTP_ERROR',
            message: error.message,
            retryable: error.status >= 500,
          },
          metadata: {
            requestId,
            timestamp,
            path,
            method,
          },
        };

        return c.json(response, error.status);
      }

      // Zod 검증 에러 처리
      if (error && typeof error === 'object' && 'issues' in error) {
        logger.warn('Validation error occurred', {
          requestId,
          path,
          method,
          issues: (error as { issues: unknown }).issues,
        });

        const response: ErrorResponse = {
          success: false,
          error: {
            type: 'VALIDATION_ERROR',
            message: '요청 데이터가 유효하지 않습니다.',
            details: JSON.stringify((error as { issues: unknown }).issues),
            retryable: false,
          },
          metadata: {
            requestId,
            timestamp,
            path,
            method,
          },
        };

        return c.json(response, 400);
      }

      // 일반 에러 처리
      logger.error('Unhandled error occurred', error, {
        requestId,
        path,
        method,
      });

      const response: ErrorResponse = {
        success: false,
        error: {
          type: ExtractionErrorType.PARSING_ERROR,
          message: '알 수 없는 오류가 발생했습니다.',
          details: error instanceof Error ? error.message : String(error),
          retryable: true,
        },
        metadata: {
          requestId,
          timestamp,
          path,
          method,
        },
      };

      return c.json(response, 500);
    }
  };
}

// ============================================================================
// Request ID Middleware
// ============================================================================

export function requestIdMiddleware() {
  return async (c: Context, next: Next) => {
    const requestId = c.req.header('x-request-id') || generateRequestId();
    c.set('requestId', requestId);
    c.header('x-request-id', requestId);
    await next();
  };
}

// ============================================================================
// Request Logging Middleware
// ============================================================================

export function requestLoggingMiddleware() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = c.get('requestId') || generateRequestId();
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('user-agent');
    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      c.req.header('x-real-ip') ||
      'unknown';

    // 요청 시작 로그
    logger.info('Request started', {
      requestId,
      method,
      path,
      userAgent,
      clientIp,
    });

    try {
      await next();

      // 성공 응답 로그
      const responseTime = Date.now() - startTime;
      const statusCode = c.res.status;

      logger.logHttpRequest(
        method,
        path,
        statusCode,
        responseTime,
        requestId,
        clientIp,
        userAgent,
      );
    } catch (error) {
      // 에러 응답 로그
      const responseTime = Date.now() - startTime;

      logger.error('Request failed', error, {
        requestId,
        method,
        path,
        responseTime,
        userAgent,
        clientIp,
      });

      throw error; // 에러를 다시 던져서 errorHandler에서 처리하도록 함
    }
  };
}

// ============================================================================
// Rate Limiting Middleware (Simple)
// ============================================================================

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  maxRequests: number = 100,
  windowMs: number = 60000,
) {
  return async (c: Context, next: Next) => {
    const clientIp =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-forwarded-for') ||
      c.req.header('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const key = `rate_limit:${clientIp}`;

    let record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    if (record.count > maxRequests) {
      const requestId = c.get('requestId') || generateRequestId();

      logger.logSecurity(
        'rate_limit',
        'Rate limit exceeded',
        clientIp,
        c.req.header('user-agent'),
        { maxRequests, windowMs, currentCount: record.count },
      );

      const response: ErrorResponse = {
        success: false,
        error: {
          type: ExtractionErrorType.RATE_LIMITED,
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          retryable: true,
        },
        metadata: {
          requestId,
          timestamp: new Date().toISOString(),
          path: c.req.path,
          method: c.req.method,
        },
      };

      c.header('X-RateLimit-Limit', maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header(
        'X-RateLimit-Reset',
        Math.ceil(record.resetTime / 1000).toString(),
      );

      return c.json(response, 429);
    }

    // Rate limit 헤더 추가
    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    c.header(
      'X-RateLimit-Reset',
      Math.ceil(record.resetTime / 1000).toString(),
    );

    await next();
  };
}


// ============================================================================
// Security Headers Middleware
// ============================================================================

export function securityHeadersMiddleware() {
  return async (c: Context, next: Next) => {
    await next();

    // 보안 헤더 추가
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Content-Security-Policy', "default-src 'self'");
  };
}

// ============================================================================
// JSON Parsing Middleware
// ============================================================================

export function jsonParsingMiddleware() {
  return async (c: Context, next: Next) => {
    // POST 요청이고 Content-Type이 JSON인 경우에만 처리
    if (
      c.req.method === 'POST' &&
      c.req.header('content-type')?.includes('application/json')
    ) {
      try {
        // 요청 본문을 미리 파싱해서 검증
        const body = await c.req.text();
        if (body.trim()) {
          JSON.parse(body);
        } else {
          // 빈 본문인 경우 에러 발생
          throw new Error('Request body is empty');
        }
      } catch (error) {
        const requestId = c.get('requestId') || generateRequestId();

        logger.warn('Malformed JSON in request body', {
          requestId,
          path: c.req.path,
          method: c.req.method,
          error: error instanceof Error ? error.message : String(error),
        });

        const response: ErrorResponse = {
          success: false,
          error: {
            type: 'MALFORMED_JSON',
            message: '잘못된 JSON 형식입니다.',
            details: error instanceof Error ? error.message : String(error),
            retryable: false,
          },
          metadata: {
            requestId,
            timestamp: new Date().toISOString(),
            path: c.req.path,
            method: c.req.method,
          },
        };

        return c.json(response, 400);
      }
    }

    await next();
  };
}
