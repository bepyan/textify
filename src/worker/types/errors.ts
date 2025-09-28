/**
 * Error Types and Error Handling
 *
 * 콘텐츠 추출 관련 에러 타입 정의와 에러 처리 유틸리티
 */

// ============================================================================
// Error Types
// ============================================================================

export enum ExtractionErrorType {
  INVALID_URL = 'INVALID_URL',
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  TIMEOUT = 'TIMEOUT',
  CONTENT_TOO_LARGE = 'CONTENT_TOO_LARGE',
  ACCESS_DENIED = 'ACCESS_DENIED',
}

export interface ExtractionError {
  type: ExtractionErrorType;
  message: string;
  details?: string;
  retryable: boolean;
}

// ============================================================================
// Custom Error Class
// ============================================================================

export class ContentExtractionError extends Error implements ExtractionError {
  public readonly name = 'ContentExtractionError';
  public readonly type: ExtractionErrorType;
  public readonly details?: string;
  public readonly retryable: boolean;

  constructor(
    type: ExtractionErrorType,
    message: string,
    details?: string,
    retryable?: boolean,
  ) {
    super(message);

    this.type = type;
    this.details = details;
    this.retryable = retryable ?? isRetryableError(type);

    // Error 클래스 상속 시 필요한 설정
    Object.setPrototypeOf(this, ContentExtractionError.prototype);

    // 스택 트레이스 설정
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContentExtractionError);
    }
  }

  // JSON 직렬화를 위한 메서드
  toJSON(): ExtractionError {
    return {
      type: this.type,
      message: this.message,
      details: this.details,
      retryable: this.retryable,
    };
  }
}

// ============================================================================
// Error Helper Functions
// ============================================================================

export function createExtractionError(
  type: ExtractionErrorType,
  message: string,
  details?: string,
  retryable?: boolean,
): ContentExtractionError {
  return new ContentExtractionError(type, message, details, retryable);
}

export function isRetryableError(type: ExtractionErrorType): boolean {
  const retryableTypes = [
    ExtractionErrorType.NETWORK_ERROR,
    ExtractionErrorType.TIMEOUT,
    ExtractionErrorType.RATE_LIMITED,
    ExtractionErrorType.PARSING_ERROR,
  ];

  return retryableTypes.includes(type);
}

export function getHttpStatusFromErrorType(type: ExtractionErrorType): number {
  const statusMap: Record<ExtractionErrorType, number> = {
    [ExtractionErrorType.INVALID_URL]: 400,
    [ExtractionErrorType.UNSUPPORTED_PLATFORM]: 400,
    [ExtractionErrorType.CONTENT_NOT_FOUND]: 404,
    [ExtractionErrorType.ACCESS_DENIED]: 403,
    [ExtractionErrorType.CONTENT_TOO_LARGE]: 413,
    [ExtractionErrorType.RATE_LIMITED]: 429,
    [ExtractionErrorType.NETWORK_ERROR]: 502,
    [ExtractionErrorType.PARSING_ERROR]: 500,
    [ExtractionErrorType.TIMEOUT]: 504,
  };

  return statusMap[type] || 500;
}

// ============================================================================
// Error Message Templates (Korean)
// ============================================================================

export const ERROR_MESSAGES: Record<ExtractionErrorType, string> = {
  [ExtractionErrorType.INVALID_URL]: '유효하지 않은 URL입니다.',
  [ExtractionErrorType.UNSUPPORTED_PLATFORM]: '지원하지 않는 플랫폼입니다.',
  [ExtractionErrorType.NETWORK_ERROR]: '네트워크 오류가 발생했습니다.',
  [ExtractionErrorType.PARSING_ERROR]: '콘텐츠 파싱 중 오류가 발생했습니다.',
  [ExtractionErrorType.CONTENT_NOT_FOUND]: '콘텐츠를 찾을 수 없습니다.',
  [ExtractionErrorType.RATE_LIMITED]: '요청 한도를 초과했습니다.',
  [ExtractionErrorType.TIMEOUT]: '요청 시간이 초과되었습니다.',
  [ExtractionErrorType.CONTENT_TOO_LARGE]: '콘텐츠 크기가 너무 큽니다.',
  [ExtractionErrorType.ACCESS_DENIED]: '콘텐츠에 접근할 수 없습니다.',
};

export function getErrorMessage(type: ExtractionErrorType): string {
  return ERROR_MESSAGES[type] || '알 수 없는 오류가 발생했습니다.';
}

// ============================================================================
// Error Factory Functions
// ============================================================================

export function createInvalidUrlError(url: string): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.INVALID_URL,
    getErrorMessage(ExtractionErrorType.INVALID_URL),
    `제공된 URL: ${url}`,
  );
}

export function createUnsupportedPlatformError(
  url: string,
): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.UNSUPPORTED_PLATFORM,
    getErrorMessage(ExtractionErrorType.UNSUPPORTED_PLATFORM),
    `지원하지 않는 URL: ${url}`,
  );
}

export function createNetworkError(details: string): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.NETWORK_ERROR,
    getErrorMessage(ExtractionErrorType.NETWORK_ERROR),
    details,
    true,
  );
}

export function createParsingError(details: string): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.PARSING_ERROR,
    getErrorMessage(ExtractionErrorType.PARSING_ERROR),
    details,
    true,
  );
}

export function createContentNotFoundError(
  url: string,
): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.CONTENT_NOT_FOUND,
    getErrorMessage(ExtractionErrorType.CONTENT_NOT_FOUND),
    `찾을 수 없는 콘텐츠: ${url}`,
  );
}

export function createTimeoutError(timeout: number): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.TIMEOUT,
    getErrorMessage(ExtractionErrorType.TIMEOUT),
    `타임아웃: ${timeout}ms`,
    true,
  );
}

export function createContentTooLargeError(
  size: number,
  maxSize: number,
): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.CONTENT_TOO_LARGE,
    getErrorMessage(ExtractionErrorType.CONTENT_TOO_LARGE),
    `콘텐츠 크기: ${size}바이트, 최대 허용: ${maxSize}바이트`,
  );
}

export function createAccessDeniedError(url: string): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.ACCESS_DENIED,
    getErrorMessage(ExtractionErrorType.ACCESS_DENIED),
    `접근 거부된 콘텐츠: ${url}`,
  );
}

export function createRateLimitedError(
  retryAfter?: number,
): ContentExtractionError {
  return createExtractionError(
    ExtractionErrorType.RATE_LIMITED,
    getErrorMessage(ExtractionErrorType.RATE_LIMITED),
    retryAfter ? `${retryAfter}초 후 재시도 가능` : undefined,
    true,
  );
}
