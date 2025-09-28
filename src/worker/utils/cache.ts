/**
 * Caching System
 *
 * 콘텐츠 추출 결과 캐싱 시스템
 */

import { logger } from './logger';
import { type ExtractedContent } from '../types/extraction';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsage: number;
}

// ============================================================================
// Cache Implementation
// ============================================================================

export class MemoryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private stats = { hits: 0, misses: 0 };
  private readonly maxSize: number;
  private readonly defaultTtl: number;

  constructor(maxSize: number = 1000, defaultTtl: number = 300000) {
    // 5분 기본 TTL
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;

    // 주기적으로 만료된 항목 정리 (1분마다)
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * 캐시에서 값 가져오기
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // 액세스 정보 업데이트
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    this.stats.hits++;
    return entry.data;
  }

  /**
   * 캐시에 값 저장
   */
  set(key: string, data: T, ttl?: number): void {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      accessCount: 0,
      lastAccessed: Date.now(),
    };

    this.cache.set(key, entry);
  }

  /**
   * 캐시에서 항목 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 캐시 전체 비우기
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /**
   * 모든 캐시 키 가져오기
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * 캐시 통계 가져오기
   */
  getStats(): CacheStats {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * 만료된 항목들 정리
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  /**
   * LRU 방식으로 항목 제거
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Cache eviction: removed LRU entry ${oldestKey}`);
    }
  }

  /**
   * 메모리 사용량 추정
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      // 키와 값의 대략적인 크기 계산
      totalSize += key.length * 2; // UTF-16
      totalSize += JSON.stringify(entry.data).length * 2;
      totalSize += 64; // 메타데이터 오버헤드
    }

    return totalSize;
  }
}

// ============================================================================
// Content Cache Wrapper
// ============================================================================

export class ContentCache {
  private cache: MemoryCache<ExtractedContent>;

  constructor() {
    this.cache = new MemoryCache<ExtractedContent>(500, 600000); // 10분 TTL
  }

  /**
   * URL 기반 캐시 키 생성
   */
  private generateKey(url: string, options?: Record<string, unknown>): string {
    const optionsHash = options ? JSON.stringify(options) : '';
    return `content:${url}:${optionsHash}`;
  }

  /**
   * 캐시된 콘텐츠 가져오기
   */
  get(url: string, options?: Record<string, unknown>): ExtractedContent | null {
    const key = this.generateKey(url, options);
    const cached = this.cache.get(key);

    if (cached) {
      logger.debug('Cache hit for content extraction', { url, key });
    }

    return cached;
  }

  /**
   * 콘텐츠 캐시에 저장
   */
  set(
    url: string,
    content: ExtractedContent,
    options?: Record<string, unknown>,
    ttl?: number,
  ): void {
    const key = this.generateKey(url, options);
    this.cache.set(key, content, ttl);

    logger.debug('Content cached', { url, key, ttl });
  }

  /**
   * 모든 캐시 키 가져오기
   */
  private getAllKeys(): string[] {
    return this.cache.getKeys();
  }

  /**
   * 특정 URL의 캐시 무효화
   */
  invalidate(url: string): void {
    // URL과 관련된 모든 캐시 항목 제거
    const keysToDelete: string[] = [];

    for (const key of this.getAllKeys()) {
      if (key.includes(url)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      logger.debug(
        `Cache invalidated for URL: ${url}, removed ${keysToDelete.length} entries`,
      );
    }
  }

  /**
   * 캐시 통계
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * 캐시 전체 비우기
   */
  clear(): void {
    this.cache.clear();
    logger.info('Content cache cleared');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const contentCache = new ContentCache();

// ============================================================================
// Cache Middleware
// ============================================================================

export function withCache<T extends unknown[], R extends ExtractedContent>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl?: number,
) {
  return async (...args: T): Promise<R> => {
    const key = keyGenerator(...args);

    // 캐시에서 확인
    const cached = contentCache.get(key) as R | null;
    if (cached) {
      return cached;
    }

    // 캐시 미스 - 실제 함수 실행
    const result = await fn(...args);

    // 결과 캐시
    contentCache.set(key, result, undefined, ttl);

    return result;
  };
}

// ============================================================================
// Cache Warming
// ============================================================================

export class CacheWarmer {
  private readonly popularUrls: string[] = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Rick Roll - 테스트용
  ];

  /**
   * 인기 콘텐츠 미리 캐싱
   */
  async warmCache(extractor: {
    extract: (url: string) => Promise<ExtractedContent>;
  }): Promise<void> {
    logger.info('Starting cache warming');

    const promises = this.popularUrls.map(async (url) => {
      try {
        const content = await extractor.extract(url);
        contentCache.set(url, content, undefined, 3600000); // 1시간 TTL
        logger.debug(`Cache warmed for URL: ${url}`);
      } catch (error) {
        logger.warn(`Failed to warm cache for URL: ${url}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    await Promise.allSettled(promises);
    logger.info('Cache warming completed');
  }
}

export const cacheWarmer = new CacheWarmer();
