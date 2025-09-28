/**
 * Contract Test: Auto Content Extraction API
 *
 * 자동 플랫폼 감지 및 콘텐츠 추출 API의 계약을 검증합니다.
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

const NaverBlogContentSchema = z.object({
  id: z.string().length(32, 'ID는 32자 해시여야 합니다'), // 또는 z.nanoid() 사용 가능
  platform: z.literal('naver_blog'),
  url: z.url('유효한 URL이어야 합니다'),
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  extractedAt: z.number().int().min(0, '유효한 밀리초 타임스탬프여야 합니다'),
  status: z.enum(['success', 'partial', 'failed']),
  postId: z
    .string()
    .regex(/^\d+$/, '포스트 ID는 숫자여야 합니다')
    .min(1, '포스트 ID는 필수입니다'),
  content: z
    .string()
    .max(51200, '본문은 50KB를 초과할 수 없습니다')
    .min(1, '본문 내용은 필수입니다'),
  authorName: z
    .string()
    .min(1, '작성자명은 필수입니다')
    .max(50, '작성자명은 50자를 초과할 수 없습니다'),
  authorId: z.string().min(1, '작성자 ID는 필수입니다'),
  publishDate: z.number().int().min(0, '유효한 작성 타임스탬프여야 합니다'),
  category: z
    .string()
    .min(1, '카테고리는 비어있을 수 없습니다')
    .max(30, '카테고리는 30자를 초과할 수 없습니다')
    .optional(),
  imageUrls: z
    .array(z.url('유효한 이미지 URL이어야 합니다'))
    .max(50, '이미지는 최대 50개까지 허용됩니다')
    .optional(),
  summary: z.string().max(200, '요약은 200자를 초과할 수 없습니다').optional(),
});

const ExtractedContentSchema = z.union([
  YouTubeContentSchema,
  NaverBlogContentSchema,
]);

const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: ExtractedContentSchema.optional(),
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
    platform: z.enum(['youtube', 'naver_blog', 'unknown']),
    extractedFields: z.array(z.string()),
  }),
});

describe('Auto Content Extraction API Contract', () => {
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

  describe('POST /extract/auto', () => {
    it('should detect and extract YouTube content automatically', async () => {
      // Given: YouTube URL (플랫폼 명시하지 않음)
      const request = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };

      // When: 자동 추출 API 호출
      const response = await apiClient.post('/extract/auto', request);

      // Then: YouTube로 감지되고 성공적으로 추출
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const validationResult = ExtractionResponseSchema.safeParse(responseBody);

      expect(validationResult.success).toBe(true);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.platform).toBe('youtube');
      expect(responseBody.data.videoId).toBe('dQw4w9WgXcQ');
      expect(responseBody.metadata.platform).toBe('youtube');
    });

    it('should detect and extract Naver blog content automatically', async () => {
      // Given: 네이버 블로그 URL (플랫폼 명시하지 않음)
      const request = {
        url: 'https://blog.naver.com/example_user/123456789',
      };

      // When: 자동 추출 API 호출
      const response = await apiClient.post('/extract/auto', request);

      // Then: 네이버 블로그로 감지되고 성공적으로 추출
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.platform).toBe('naver_blog');
      expect(responseBody.data.postId).toBe('123456789');
      expect(responseBody.data.authorId).toBe('example_user');
      expect(responseBody.metadata.platform).toBe('naver_blog');
    });

    it('should handle various YouTube URL formats automatically', async () => {
      const youtubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
      ];

      for (const url of youtubeUrls) {
        const request = { url };
        const response = await apiClient.post('/extract/auto', request);

        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(true);
        expect(responseBody.data.platform).toBe('youtube');
        expect(responseBody.data.videoId).toBe('dQw4w9WgXcQ');
        expect(responseBody.metadata.platform).toBe('youtube');
      }
    });

    it('should return 400 for unsupported platforms', async () => {
      // Given: 지원하지 않는 플랫폼 URL들
      const unsupportedUrls = [
        'https://www.instagram.com/p/example/',
        'https://twitter.com/user/status/123456789',
        'https://www.facebook.com/video/123456789',
        'https://vimeo.com/123456789',
        'https://www.tiktok.com/@user/video/123456789',
      ];

      for (const url of unsupportedUrls) {
        // When: 자동 추출 API 호출
        const request = { url };
        const response = await apiClient.post('/extract/auto', request);

        // Then: 지원하지 않는 플랫폼 에러
        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(false);
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.type).toBe('UNSUPPORTED_PLATFORM');
        expect(responseBody.error.retryable).toBe(false);
        expect(responseBody.metadata.platform).toBe('unknown');
      }
    });

    it('should return 400 for invalid URLs', async () => {
      // Given: 유효하지 않은 URL들
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        'ftp://example.com',
        'mailto:test@example.com',
        '',
      ];

      for (const url of invalidUrls) {
        // When: 자동 추출 API 호출
        const request = { url };
        const response = await apiClient.post('/extract/auto', request);

        // Then: 유효하지 않은 URL 에러
        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(false);
        expect(responseBody.error.type).toBe('INVALID_URL');
        expect(responseBody.error.retryable).toBe(false);
      }
    });

    it('should preserve extraction options for detected platform', async () => {
      // Given: YouTube URL과 추출 옵션
      const request = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          includeTags: true,
          timeout: 3000,
        },
      };

      // When: 자동 추출 API 호출
      const response = await apiClient.post('/extract/auto', request);

      // Then: 옵션이 적용된 YouTube 추출 결과
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.platform).toBe('youtube');
      expect(responseBody.data.tags).toBeDefined(); // includeTags 옵션 적용
      expect(responseBody.metadata.processingTime).toBeLessThan(3000);
    });

    it('should preserve extraction options for Naver blog', async () => {
      // Given: 네이버 블로그 URL과 추출 옵션
      const request = {
        url: 'https://blog.naver.com/example_user/123456789',
        options: {
          includeImages: true,
          maxContentLength: 20480,
        },
      };

      // When: 자동 추출 API 호출
      const response = await apiClient.post('/extract/auto', request);

      // Then: 옵션이 적용된 네이버 블로그 추출 결과
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.platform).toBe('naver_blog');
      expect(responseBody.data.content.length).toBeLessThanOrEqual(20480);

      if (responseBody.data.imageUrls) {
        expect(Array.isArray(responseBody.data.imageUrls)).toBe(true);
      }
    });

    it('should handle platform detection edge cases', async () => {
      // Given: 플랫폼 감지가 애매한 URL들
      const edgeCaseUrls = [
        'https://youtube.com.fake-site.com/watch?v=dQw4w9WgXcQ', // 가짜 YouTube 도메인
        'https://blog.naver.com.fake.com/user/123456789', // 가짜 네이버 도메인
        'https://www.youtube.com/channel/UCexample', // YouTube 채널 URL (비디오 아님)
        'https://blog.naver.com/user', // 포스트 ID 없는 네이버 블로그
      ];

      for (const url of edgeCaseUrls) {
        // When: 자동 추출 API 호출
        const request = { url };
        const response = await apiClient.post('/extract/auto', request);

        // Then: 적절한 에러 응답
        expect([400, 404]).toContain(response.status);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(false);
        expect(responseBody.error).toBeDefined();
        expect([
          'INVALID_URL',
          'UNSUPPORTED_PLATFORM',
          'CONTENT_NOT_FOUND',
        ]).toContain(responseBody.error.type);
      }
    });

    it('should return consistent metadata for platform detection', async () => {
      // Given: 다양한 플랫폼 URL들
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expectedPlatform: 'youtube',
        },
        {
          url: 'https://blog.naver.com/example_user/123456789',
          expectedPlatform: 'naver_blog',
        },
        {
          url: 'https://unsupported-platform.com/content/123',
          expectedPlatform: 'unknown',
        },
      ];

      for (const testCase of testCases) {
        // When: 자동 추출 API 호출
        const request = { url: testCase.url };
        const response = await apiClient.post('/extract/auto', request);

        // Then: 메타데이터에 올바른 플랫폼 정보
        const responseBody = await response.json();

        expect(responseBody.metadata).toBeDefined();
        expect(responseBody.metadata.platform).toBe(testCase.expectedPlatform);
        expect(responseBody.metadata.requestId).toBeDefined();
        expect(responseBody.metadata.processingTime).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(responseBody.metadata.extractedFields)).toBe(true);
      }
    });

    it('should handle concurrent auto-detection requests', async () => {
      // Given: 동시에 여러 플랫폼 요청
      const concurrentRequests = [
        { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
        { url: 'https://blog.naver.com/user1/123456789' },
        { url: 'https://youtu.be/dQw4w9WgXcQ' },
        { url: 'https://blog.naver.com/user2/987654321' },
      ];

      // When: 동시 API 호출
      const responses = await Promise.all(
        concurrentRequests.map((request) =>
          apiClient.post('/extract/auto', request),
        ),
      );

      // Then: 모든 요청이 올바르게 처리됨
      expect(responses).toHaveLength(4);

      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody.success).toBe(true);

        // 각 요청의 고유한 requestId 확인
        expect(responseBody.metadata.requestId).toBeDefined();

        // 플랫폼별 올바른 감지 확인
        if (
          concurrentRequests[i].url.includes('youtube') ||
          concurrentRequests[i].url.includes('youtu.be')
        ) {
          expect(responseBody.data.platform).toBe('youtube');
        } else if (concurrentRequests[i].url.includes('blog.naver.com')) {
          expect(responseBody.data.platform).toBe('naver_blog');
        }
      }
    });

    it('should maintain response structure consistency across platforms', async () => {
      // Given: 다른 플랫폼 URL들
      const platformUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://blog.naver.com/example_user/123456789',
      ];

      for (const url of platformUrls) {
        // When: 자동 추출 API 호출
        const request = { url };
        const response = await apiClient.post('/extract/auto', request);

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
          expect(responseBody.data).toHaveProperty('id');
          expect(responseBody.data).toHaveProperty('platform');
          expect(responseBody.data).toHaveProperty('url');
          expect(responseBody.data).toHaveProperty('title');
          expect(responseBody.data).toHaveProperty('extractedAt');
          expect(responseBody.data).toHaveProperty('status');
        } else {
          expect(responseBody).toHaveProperty('error');
        }
      }
    });
  });
});
