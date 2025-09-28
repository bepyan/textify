/**
 * Unit Test: Error Types Handling
 *
 * 에러 타입들의 처리 로직을 테스트합니다.
 * 이 테스트는 구현 전에 작성되어 실패해야 합니다.
 */

import { describe, it, expect } from 'vitest';

// 구현 예정: 에러 타입 정의와 에러 클래스
import {
  ExtractionErrorType,
  type ExtractionError,
  ContentExtractionError,
  createExtractionError,
  isRetryableError,
  getHttpStatusFromErrorType,
} from './errors';

describe('Error Types Handling', () => {
  describe('ExtractionErrorType enum', () => {
    it('should have all required error types', () => {
      expect(ExtractionErrorType.INVALID_URL).toBe('INVALID_URL');
      expect(ExtractionErrorType.UNSUPPORTED_PLATFORM).toBe(
        'UNSUPPORTED_PLATFORM',
      );
      expect(ExtractionErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(ExtractionErrorType.PARSING_ERROR).toBe('PARSING_ERROR');
      expect(ExtractionErrorType.CONTENT_NOT_FOUND).toBe('CONTENT_NOT_FOUND');
      expect(ExtractionErrorType.RATE_LIMITED).toBe('RATE_LIMITED');
      expect(ExtractionErrorType.TIMEOUT).toBe('TIMEOUT');
      expect(ExtractionErrorType.CONTENT_TOO_LARGE).toBe('CONTENT_TOO_LARGE');
      expect(ExtractionErrorType.ACCESS_DENIED).toBe('ACCESS_DENIED');
    });
  });

  describe('ExtractionError interface', () => {
    it('should have required properties', () => {
      const error: ExtractionError = {
        type: ExtractionErrorType.INVALID_URL,
        message: '유효하지 않은 URL입니다.',
        retryable: false,
      };

      expect(error.type).toBe('INVALID_URL');
      expect(error.message).toBe('유효하지 않은 URL입니다.');
      expect(error.retryable).toBe(false);
    });

    it('should allow optional details', () => {
      const error: ExtractionError = {
        type: ExtractionErrorType.PARSING_ERROR,
        message: '파싱 중 오류가 발생했습니다.',
        details: 'HTML 구조를 파싱할 수 없습니다.',
        retryable: true,
      };

      expect(error.details).toBe('HTML 구조를 파싱할 수 없습니다.');
    });
  });

  describe('ContentExtractionError class', () => {
    it('should create error with basic properties', () => {
      const error = new ContentExtractionError(
        ExtractionErrorType.INVALID_URL,
        '유효하지 않은 URL입니다.',
      );

      expect(error.name).toBe('ContentExtractionError');
      expect(error.type).toBe('INVALID_URL');
      expect(error.message).toBe('유효하지 않은 URL입니다.');
      expect(error.retryable).toBe(false); // 기본값
      expect(error.details).toBeUndefined();
    });

    it('should create error with all properties', () => {
      const error = new ContentExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        '네트워크 오류가 발생했습니다.',
        '연결 시간 초과',
        true,
      );

      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.message).toBe('네트워크 오류가 발생했습니다.');
      expect(error.details).toBe('연결 시간 초과');
      expect(error.retryable).toBe(true);
    });

    it('should be instance of Error', () => {
      const error = new ContentExtractionError(
        ExtractionErrorType.PARSING_ERROR,
        '파싱 오류',
      );

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ContentExtractionError).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new ContentExtractionError(
        ExtractionErrorType.TIMEOUT,
        '시간 초과',
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ContentExtractionError');
    });
  });

  describe('createExtractionError helper', () => {
    it('should create error with default retryable setting', () => {
      const error = createExtractionError(
        ExtractionErrorType.INVALID_URL,
        '유효하지 않은 URL입니다.',
      );

      expect(error.type).toBe('INVALID_URL');
      expect(error.retryable).toBe(false);
    });

    it('should create error with custom retryable setting', () => {
      const error = createExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        '네트워크 오류',
        undefined,
        true,
      );

      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should create error with details', () => {
      const error = createExtractionError(
        ExtractionErrorType.PARSING_ERROR,
        '파싱 실패',
        'HTML 구조가 예상과 다릅니다.',
      );

      expect(error.details).toBe('HTML 구조가 예상과 다릅니다.');
    });
  });

  describe('isRetryableError helper', () => {
    it('should identify retryable errors', () => {
      const retryableTypes = [
        ExtractionErrorType.NETWORK_ERROR,
        ExtractionErrorType.TIMEOUT,
        ExtractionErrorType.RATE_LIMITED,
        ExtractionErrorType.PARSING_ERROR,
      ];

      retryableTypes.forEach((type) => {
        expect(isRetryableError(type)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableTypes = [
        ExtractionErrorType.INVALID_URL,
        ExtractionErrorType.UNSUPPORTED_PLATFORM,
        ExtractionErrorType.CONTENT_NOT_FOUND,
        ExtractionErrorType.CONTENT_TOO_LARGE,
        ExtractionErrorType.ACCESS_DENIED,
      ];

      nonRetryableTypes.forEach((type) => {
        expect(isRetryableError(type)).toBe(false);
      });
    });
  });

  describe('getHttpStatusFromErrorType helper', () => {
    it('should map error types to correct HTTP status codes', () => {
      const statusMappings = [
        { type: ExtractionErrorType.INVALID_URL, status: 400 },
        { type: ExtractionErrorType.UNSUPPORTED_PLATFORM, status: 400 },
        { type: ExtractionErrorType.CONTENT_NOT_FOUND, status: 404 },
        { type: ExtractionErrorType.ACCESS_DENIED, status: 403 },
        { type: ExtractionErrorType.CONTENT_TOO_LARGE, status: 413 },
        { type: ExtractionErrorType.RATE_LIMITED, status: 429 },
        { type: ExtractionErrorType.NETWORK_ERROR, status: 502 },
        { type: ExtractionErrorType.PARSING_ERROR, status: 500 },
        { type: ExtractionErrorType.TIMEOUT, status: 504 },
      ];

      statusMappings.forEach(({ type, status }) => {
        expect(getHttpStatusFromErrorType(type)).toBe(status);
      });
    });
  });

  describe('Error message localization', () => {
    it('should provide Korean error messages', () => {
      const koreanMessages = [
        {
          type: ExtractionErrorType.INVALID_URL,
          expectedMessage: '유효하지 않은 URL입니다.',
        },
        {
          type: ExtractionErrorType.UNSUPPORTED_PLATFORM,
          expectedMessage: '지원하지 않는 플랫폼입니다.',
        },
        {
          type: ExtractionErrorType.NETWORK_ERROR,
          expectedMessage: '네트워크 오류가 발생했습니다.',
        },
        {
          type: ExtractionErrorType.PARSING_ERROR,
          expectedMessage: '콘텐츠 파싱 중 오류가 발생했습니다.',
        },
        {
          type: ExtractionErrorType.CONTENT_NOT_FOUND,
          expectedMessage: '콘텐츠를 찾을 수 없습니다.',
        },
        {
          type: ExtractionErrorType.RATE_LIMITED,
          expectedMessage: '요청 한도를 초과했습니다.',
        },
        {
          type: ExtractionErrorType.TIMEOUT,
          expectedMessage: '요청 시간이 초과되었습니다.',
        },
        {
          type: ExtractionErrorType.CONTENT_TOO_LARGE,
          expectedMessage: '콘텐츠 크기가 너무 큽니다.',
        },
        {
          type: ExtractionErrorType.ACCESS_DENIED,
          expectedMessage: '콘텐츠에 접근할 수 없습니다.',
        },
      ];

      koreanMessages.forEach(({ type, expectedMessage }) => {
        const error = createExtractionError(type, expectedMessage);
        expect(error.message).toBe(expectedMessage);
      });
    });
  });

  describe('Error serialization', () => {
    it('should serialize error to JSON', () => {
      const error = new ContentExtractionError(
        ExtractionErrorType.NETWORK_ERROR,
        '네트워크 오류',
        '연결 실패',
        true,
      );

      const serialized = JSON.parse(JSON.stringify(error));

      expect(serialized.type).toBe('NETWORK_ERROR');
      expect(serialized.message).toBe('네트워크 오류');
      expect(serialized.details).toBe('연결 실패');
      expect(serialized.retryable).toBe(true);
    });

    it('should deserialize error from JSON', () => {
      const errorData = {
        type: 'PARSING_ERROR',
        message: '파싱 실패',
        details: 'HTML 구조 오류',
        retryable: true,
      };

      const error = new ContentExtractionError(
        errorData.type as ExtractionErrorType,
        errorData.message,
        errorData.details,
        errorData.retryable,
      );

      expect(error.type).toBe('PARSING_ERROR');
      expect(error.message).toBe('파싱 실패');
      expect(error.details).toBe('HTML 구조 오류');
      expect(error.retryable).toBe(true);
    });
  });
});
