/**
 * Contract Test: YouTube Content Extraction API
 *
 * YouTube 콘텐츠 추출 API의 계약을 검증합니다.
 * 이 테스트는 실제 구현 전에 작성되어 실패해야 합니다.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// API 클라이언트 (구현 예정)
interface ApiClient {
  post(path: string, body: unknown): Promise<Response>;
}

// 스키마 정의 (data-model.md 기반) - Zod v4 최적화 문법
const YouTubeContentSchema = z.object({
  id: z.string().length(32, 'ID는 32자 해시여야 합니다'), // 또는 z.nanoid() 사용 가능
  platform: z.literal('youtube'),
  url: z.url('유효한 URL이어야 합니다'),
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  extractedAt: z.number().int().min(0, '유효한 밀리초 타임스탬프여야 합니다'),
  status: z.enum(['success', 'partial', 'failed']),
  videoId: z
    .string()
    .length(11, 'YouTube 비디오 ID는 11자여야 합니다')
    .regex(/^[a-zA-Z0-9_-]+$/, '유효한 YouTube 비디오 ID 형식이어야 합니다'),
  description: z.string().max(5120, '설명은 5KB를 초과할 수 없습니다'),
  thumbnailUrl: z.url('유효한 썸네일 URL이어야 합니다'),
  channelName: z
    .string()
    .min(1, '채널명은 필수입니다')
    .max(100, '채널명은 100자를 초과할 수 없습니다'),
  channelId: z.string().min(1, '채널 ID는 필수입니다'),
  uploadDate: z.number().int().min(0, '유효한 업로드 타임스탬프여야 합니다'),
  duration: z
    .string()
    .regex(/^PT(\d+H)?(\d+M)?(\d+S)?$/, 'ISO 8601 duration 형식이어야 합니다'),
  viewCount: z.number().min(0, '조회수는 0 이상이어야 합니다').optional(),
  likeCount: z.number().min(0, '좋아요 수는 0 이상이어야 합니다').optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, '태그는 비어있을 수 없습니다')
        .max(50, '태그는 50자를 초과할 수 없습니다'),
    )
    .max(20, '태그는 최대 20개까지 허용됩니다')
    .optional(),
});

const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: YouTubeContentSchema.optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
      details: z.string().optional(),
      retryable: z.boolean(),
    })
    .optional(),
  metadata: z.object({
    requestId: z.string(),
    processingTime: z.number().min(0),
    platform: z.string(),
    extractedFields: z.array(z.string()),
  }),
});

describe('YouTube Content Extraction API Contract', () => {
  let apiClient: ApiClient;
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8787/api';

  beforeAll(() => {
    // API 클라이언트 초기화 (구현 예정)
    apiClient = {
      async post(path: string, body: unknown): Promise<Response> {
        const response = await fetch(`${API_BASE_URL}${path}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        return response;
      },
    };
  });

  describe('POST /extract/youtube', () => {
    it('should extract YouTube video metadata successfully', async () => {
      // Given: 유효한 YouTube URL
      const request = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          includeTags: true,
          timeout: 5000,
        },
      };

      // When: YouTube 추출 API 호출
      const response = await apiClient.post('/extract/youtube', request);

      // Then: 성공 응답 및 스키마 검증
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const validationResult = ExtractionResponseSchema.safeParse(responseBody);

      expect(validationResult.success).toBe(true);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.platform).toBe('youtube');
      expect(responseBody.data.videoId).toBe('dQw4w9WgXcQ');
      expect(responseBody.metadata.platform).toBe('youtube');
      expect(responseBody.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle different YouTube URL formats', async () => {
      const testUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      ];

      for (const url of testUrls) {
        const request = { url };
        const response = await apiClient.post('/extract/youtube', request);

        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(true);
        expect(responseBody.data.videoId).toBe('dQw4w9WgXcQ');
      }
    });

    it('should return 400 for invalid YouTube URL', async () => {
      // Given: 유효하지 않은 URL
      const request = {
        url: 'https://www.youtube.com/watch?v=invalid',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/youtube', request);

      // Then: 400 에러 응답
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error.type).toBe('INVALID_URL');
      expect(responseBody.error.retryable).toBe(false);
    });

    it('should return 404 for non-existent video', async () => {
      // Given: 존재하지 않는 비디오 ID
      const request = {
        url: 'https://www.youtube.com/watch?v=nonexistent',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/youtube', request);

      // Then: 404 에러 응답
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.type).toBe('CONTENT_NOT_FOUND');
    });

    it('should return 400 for invalid timeout value', async () => {
      // Given: 유효하지 않은 타임아웃 값 (최소값 미만)
      const request = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          timeout: 1, // 1ms - 최소값(1000ms) 미만으로 검증 에러 발생
        },
      };

      // When: API 호출
      const response = await apiClient.post('/extract/youtube', request);

      // Then: 400 검증 에러 응답
      expect(response.status).toBe(400);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.type).toBe('VALIDATION_ERROR');
      expect(responseBody.error.retryable).toBe(false);
      expect(responseBody.error.details).toContain('timeout');
      expect(responseBody.error.details).toContain(
        '최소 1초 이상이어야 합니다',
      );
    });

    it('should validate request body schema', async () => {
      // Given: 잘못된 요청 바디
      const invalidRequests = [
        {}, // URL 누락
        { url: 'not-a-url' }, // 유효하지 않은 URL 형식
        { url: 'https://www.google.com' }, // 지원하지 않는 도메인
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          options: { timeout: 50000 }, // 최대 타임아웃 초과
        },
      ];

      for (const request of invalidRequests) {
        const response = await apiClient.post('/extract/youtube', request);
        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(false);
        expect(responseBody.error).toBeDefined();
      }
    });

    it('should include optional fields when requested', async () => {
      // Given: 선택적 필드 포함 요청
      const request = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          includeTags: true,
        },
      };

      // When: API 호출
      const response = await apiClient.post('/extract/youtube', request);

      // Then: 선택적 필드 포함 확인
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.tags).toBeDefined();
      expect(Array.isArray(responseBody.data.tags)).toBe(true);
    });

    it('should respect content length limits', async () => {
      // Given: 콘텐츠 길이 제한 설정
      const request = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          maxContentLength: 1024, // 1KB 제한
        },
      };

      // When: API 호출
      const response = await apiClient.post('/extract/youtube', request);

      // Then: 성공 응답 및 길이 제한 준수
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.description.length).toBeLessThanOrEqual(1024);
    });

    it('should return consistent response structure', async () => {
      // Given: 여러 다른 요청
      const requests = [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { url: 'https://youtu.be/dQw4w9WgXcQ' },
        { url: 'https://www.youtube.com/watch?v=invalid' }, // 에러 케이스
      ];

      for (const request of requests) {
        // When: API 호출
        const response = await apiClient.post('/extract/youtube', request);

        // Then: 일관된 응답 구조
        const responseBody = await response.json();

        expect(responseBody).toHaveProperty('success');
        expect(responseBody).toHaveProperty('metadata');
        expect(responseBody.metadata).toHaveProperty('requestId');
        expect(responseBody.metadata).toHaveProperty('processingTime');
        expect(responseBody.metadata).toHaveProperty('platform');
        expect(responseBody.metadata).toHaveProperty('extractedFields');

        if (responseBody.success) {
          expect(responseBody).toHaveProperty('data');
        } else {
          expect(responseBody).toHaveProperty('error');
        }
      }
    });
  });
});
