/**
 * Base Extractor Abstract Class
 *
 * 모든 콘텐츠 추출기의 기본 클래스
 */

import { ContentExtractionError, ExtractionErrorType } from '../types/errors';
import {
  ContentPlatform,
  type ExtractedContent,
  type ExtractionOptions,
} from '../types/extraction';
import { contentCache } from '../utils/cache';
import { logger } from '../utils/logger';

// ============================================================================
// Abstract Base Class
// ============================================================================

export abstract class BaseExtractor {
  protected readonly platform: ContentPlatform;
  protected readonly timeout: number;
  protected readonly maxRetries: number;

  constructor(
    platform: ContentPlatform,
    timeout: number = 5000,
    maxRetries: number = 3,
  ) {
    this.platform = platform;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
  }

  /**
   * 콘텐츠 추출 메인 메서드
   */
  public async extract(
    url: string,
    options: ExtractionOptions = {},
  ): Promise<ExtractedContent> {
    const startTime = Date.now();

    try {
      // URL 검증
      this.validateUrl(url);

      // 추출 옵션 병합
      const mergedOptions = this.mergeOptions(options);

      // 캐시 확인
      const cached = contentCache.get(url, mergedOptions);
      if (cached) {
        logger.debug('Cache hit for content extraction', {
          url,
          platform: this.platform,
          processingTime: Date.now() - startTime,
        });
        return cached;
      }

      // 실제 추출 로직 (하위 클래스에서 구현)
      const content = await this.performExtraction(url, mergedOptions);

      // 추출 시간 기록
      content.extractedAt = Date.now();

      // 캐시에 저장 (성공한 경우에만)
      contentCache.set(url, content, mergedOptions);

      // 처리 시간 로깅
      const processingTime = Date.now() - startTime;
      this.logExtractionSuccess(url, processingTime);

      return content;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logExtractionError(url, error, processingTime);
      throw error;
    }
  }

  /**
   * 실제 추출 로직 (하위 클래스에서 구현)
   */
  protected abstract performExtraction(
    url: string,
    options: ExtractionOptions,
  ): Promise<ExtractedContent>;

  /**
   * URL 검증 (하위 클래스에서 구현)
   */
  protected abstract validateUrl(url: string): void;

  /**
   * 플랫폼별 기본 옵션 반환 (하위 클래스에서 구현)
   */
  protected abstract getDefaultOptions(): ExtractionOptions;

  // ============================================================================
  // Protected Helper Methods
  // ============================================================================

  /**
   * 추출 옵션 병합
   */
  protected mergeOptions(options: ExtractionOptions): ExtractionOptions {
    const defaultOptions = this.getDefaultOptions();
    return {
      ...defaultOptions,
      ...options,
      timeout: options.timeout || this.timeout,
    };
  }

  /**
   * HTTP 요청 수행 (재시도 로직 포함)
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TextifyBot/1.0)',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new ContentExtractionError(
            this.getErrorTypeFromStatus(response.status),
            `HTTP ${response.status}: ${response.statusText}`,
            `URL: ${url}`,
            this.isRetryableStatus(response.status),
          );
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        // AbortError (타임아웃)인 경우 특별 처리
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ContentExtractionError(
            ExtractionErrorType.TIMEOUT,
            '요청 시간이 초과되었습니다.',
            `타임아웃: ${this.timeout}ms`,
            true,
          );
        }

        // 재시도 불가능한 에러인 경우 즉시 throw
        if (error instanceof ContentExtractionError && !error.retryable) {
          throw error;
        }

        // 마지막 시도가 아닌 경우 잠시 대기
        if (attempt < this.maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000); // 지수 백오프
        }
      }
    }

    // 모든 재시도 실패
    throw new ContentExtractionError(
      ExtractionErrorType.NETWORK_ERROR,
      '네트워크 요청이 실패했습니다.',
      lastError?.message || 'Unknown error',
      true,
    );
  }

  /**
   * HTML 콘텐츠 가져오기
   */
  protected async fetchHtmlContent(url: string): Promise<string> {
    const response = await this.fetchWithRetry(url);
    const html = await response.text();

    if (!html || html.trim().length === 0) {
      throw new ContentExtractionError(
        ExtractionErrorType.CONTENT_NOT_FOUND,
        '빈 콘텐츠가 반환되었습니다.',
        `URL: ${url}`,
      );
    }

    return html;
  }

  /**
   * 콘텐츠 ID 생성
   */
  protected generateContentId(url: string): string {
    // URL을 기반으로 32자 해시 생성
    const hash = Array.from(url).reduce((hash, char) => {
      const charCode = char.charCodeAt(0);
      hash = (hash << 5) - hash + charCode;
      return hash & hash; // 32bit integer로 변환
    }, 0);

    return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
  }

  /**
   * 텍스트 길이 제한 적용
   */
  protected limitTextLength(text: string, maxLength?: number): string {
    if (!maxLength || text.length <= maxLength) {
      return text;
    }

    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * 요약 생성 (처음 200자)
   */
  protected generateSummary(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }

    // 문장 단위로 자르기 시도
    const sentences = content.split(/[.!?]\s+/);
    let summary = '';

    for (const sentence of sentences) {
      if (summary.length + sentence.length + 1 <= maxLength) {
        summary += (summary ? ' ' : '') + sentence;
      } else {
        break;
      }
    }

    // 문장 단위로 자르기 실패 시 글자 단위로 자르기
    if (!summary) {
      summary = content.substring(0, maxLength - 3) + '...';
    }

    return summary;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * HTTP 상태 코드에서 에러 타입 추출
   */
  private getErrorTypeFromStatus(status: number): ExtractionErrorType {
    switch (status) {
      case 400:
      case 422:
        return ExtractionErrorType.INVALID_URL;
      case 403:
        return ExtractionErrorType.ACCESS_DENIED;
      case 404:
        return ExtractionErrorType.CONTENT_NOT_FOUND;
      case 413:
        return ExtractionErrorType.CONTENT_TOO_LARGE;
      case 429:
        return ExtractionErrorType.RATE_LIMITED;
      case 502:
      case 503:
        return ExtractionErrorType.NETWORK_ERROR;
      case 504:
        return ExtractionErrorType.TIMEOUT;
      default:
        return ExtractionErrorType.NETWORK_ERROR;
    }
  }

  /**
   * 재시도 가능한 HTTP 상태 코드인지 확인
   */
  private isRetryableStatus(status: number): boolean {
    const retryableStatuses = [429, 500, 502, 503, 504];
    return retryableStatuses.includes(status);
  }

  /**
   * 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 성공 로깅
   */
  private logExtractionSuccess(url: string, processingTime: number): void {
    logger.info('Content extraction successful', {
      platform: this.platform,
      url,
      processingTime,
    });
  }

  /**
   * 에러 로깅
   */
  private logExtractionError(
    url: string,
    error: unknown,
    processingTime: number,
  ): void {
    logger.error('Content extraction failed', error, {
      platform: this.platform,
      url,
      processingTime,
    });
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 추출기 팩토리 함수
 */
export function createExtractor(platform: ContentPlatform): BaseExtractor {
  switch (platform) {
    case ContentPlatform.YOUTUBE:
      // 동적 import로 순환 참조 방지
      throw new Error('YouTube extractor not implemented yet');
    case ContentPlatform.NAVER_BLOG:
      // 동적 import로 순환 참조 방지
      throw new Error('Naver blog extractor not implemented yet');
    default:
      throw new ContentExtractionError(
        ExtractionErrorType.UNSUPPORTED_PLATFORM,
        `지원하지 않는 플랫폼입니다: ${platform}`,
      );
  }
}
