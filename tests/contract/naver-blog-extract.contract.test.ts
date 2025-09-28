/**
 * Contract Test: Naver Blog Content Extraction API
 *
 * 네이버 블로그 콘텐츠 추출 API의 계약을 검증합니다.
 * 이 테스트는 실제 구현 전에 작성되어 실패해야 합니다.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';

// API 클라이언트 (구현 예정)
interface ApiClient {
  post(path: string, body: unknown): Promise<Response>;
}

// 스키마 정의 (data-model.md 기반) - Zod v4 최적화 문법
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

const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: NaverBlogContentSchema.optional(),
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

describe('Naver Blog Content Extraction API Contract', () => {
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

  describe('POST /extract/naver-blog', () => {
    it('should extract Naver blog post content successfully', async () => {
      // Given: 유효한 네이버 블로그 URL
      const request = {
        url: 'https://blog.naver.com/example_user/123456789',
        options: {
          includeImages: true,
          maxContentLength: 30720,
        },
      };

      // When: 네이버 블로그 추출 API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 성공 응답 및 스키마 검증
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      const validationResult = ExtractionResponseSchema.safeParse(responseBody);

      expect(validationResult.success).toBe(true);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data).toBeDefined();
      expect(responseBody.data.platform).toBe('naver_blog');
      expect(responseBody.data.postId).toBe('123456789');
      expect(responseBody.metadata.platform).toBe('naver_blog');
      expect(responseBody.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should handle different Naver blog URL formats', async () => {
      const testUrls = [
        'https://blog.naver.com/example_user/123456789',
        'http://blog.naver.com/example_user/123456789',
        'blog.naver.com/example_user/123456789',
      ];

      for (const url of testUrls) {
        const request = { url };
        const response = await apiClient.post('/extract/naver-blog', request);

        expect(response.status).toBe(200);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(true);
        expect(responseBody.data.postId).toBe('123456789');
        expect(responseBody.data.authorId).toBe('example_user');
      }
    });

    it('should return 400 for invalid Naver blog URL', async () => {
      // Given: 유효하지 않은 URL 형식들
      const invalidUrls = [
        'https://blog.naver.com/user', // postId 누락
        'https://blog.naver.com/user/invalid', // 숫자가 아닌 postId
        'https://blog.naver.com//123456789', // userId 누락
        'https://other-blog.com/user/123456789', // 다른 도메인
      ];

      for (const url of invalidUrls) {
        const request = { url };
        const response = await apiClient.post('/extract/naver-blog', request);

        expect(response.status).toBe(400);

        const responseBody = await response.json();
        expect(responseBody.success).toBe(false);
        expect(responseBody.error).toBeDefined();
        expect(responseBody.error.type).toBe('INVALID_URL');
        expect(responseBody.error.retryable).toBe(false);
      }
    });

    it('should return 404 for non-existent blog post', async () => {
      // Given: 존재하지 않는 블로그 포스트
      const request = {
        url: 'https://blog.naver.com/nonexistent_user/999999999',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 404 에러 응답
      expect(response.status).toBe(404);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.type).toBe('CONTENT_NOT_FOUND');
    });

    it('should return 403 for private blog post', async () => {
      // Given: 비공개 블로그 포스트 (접근 불가)
      const request = {
        url: 'https://blog.naver.com/private_user/123456789',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 403 접근 거부 응답
      expect(response.status).toBe(403);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.type).toBe('ACCESS_DENIED');
      expect(responseBody.error.retryable).toBe(false);
    });

    it('should strip HTML tags from content', async () => {
      // Given: HTML 태그가 포함된 블로그 포스트
      const request = {
        url: 'https://blog.naver.com/html_user/123456789',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: HTML 태그가 제거된 순수 텍스트
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.content).toBeDefined();

      // HTML 태그가 없어야 함
      expect(responseBody.data.content).not.toMatch(/<[^>]*>/);

      // 기본적인 텍스트 내용은 있어야 함
      expect(responseBody.data.content.length).toBeGreaterThan(0);
    });

    it('should include images when requested', async () => {
      // Given: 이미지 포함 요청
      const request = {
        url: 'https://blog.naver.com/image_user/123456789',
        options: {
          includeImages: true,
        },
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 이미지 URL 포함 확인
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);

      if (responseBody.data.imageUrls) {
        expect(Array.isArray(responseBody.data.imageUrls)).toBe(true);
        expect(responseBody.data.imageUrls.length).toBeLessThanOrEqual(50);

        // 모든 이미지 URL이 유효한지 확인
        for (const imageUrl of responseBody.data.imageUrls) {
          expect(imageUrl).toMatch(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i);
        }
      }
    });

    it('should respect content length limits', async () => {
      // Given: 콘텐츠 길이 제한 설정
      const request = {
        url: 'https://blog.naver.com/long_content_user/123456789',
        options: {
          maxContentLength: 10240, // 10KB 제한
        },
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 성공 응답 및 길이 제한 준수
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.content.length).toBeLessThanOrEqual(10240);
    });

    it('should return 413 for content too large', async () => {
      // Given: 매우 작은 콘텐츠 길이 제한
      const request = {
        url: 'https://blog.naver.com/large_content_user/123456789',
        options: {
          maxContentLength: 100, // 100바이트 제한 (매우 작음)
        },
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 413 콘텐츠 크기 초과 응답
      expect(response.status).toBe(413);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(responseBody.error.type).toBe('CONTENT_TOO_LARGE');
    });

    it('should generate summary when content is long', async () => {
      // Given: 긴 콘텐츠를 가진 블로그 포스트
      const request = {
        url: 'https://blog.naver.com/long_post_user/123456789',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 요약 생성 확인
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);

      if (responseBody.data.content.length > 200) {
        expect(responseBody.data.summary).toBeDefined();
        expect(responseBody.data.summary.length).toBeLessThanOrEqual(200);
        expect(responseBody.data.summary.length).toBeGreaterThan(0);
      }
    });

    it('should validate required fields are present', async () => {
      // Given: 유효한 블로그 URL
      const request = {
        url: 'https://blog.naver.com/test_user/123456789',
      };

      // When: API 호출
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 필수 필드 존재 확인
      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(true);

      const requiredFields = [
        'id',
        'platform',
        'url',
        'title',
        'extractedAt',
        'status',
        'postId',
        'content',
        'authorName',
        'authorId',
        'publishDate',
      ];

      for (const field of requiredFields) {
        expect(responseBody.data).toHaveProperty(field);
        expect(responseBody.data[field]).toBeDefined();
      }
    });

    it('should handle network errors gracefully', async () => {
      // Given: 네트워크 오류 시뮬레이션을 위한 잘못된 URL
      const request = {
        url: 'https://blog.naver.com/network_error_user/123456789',
        options: {
          timeout: 1000,
        },
      };

      // When: API 호출 (네트워크 오류 발생 가정)
      const response = await apiClient.post('/extract/naver-blog', request);

      // Then: 적절한 에러 응답
      expect([502, 504]).toContain(response.status);

      const responseBody = await response.json();
      expect(responseBody.success).toBe(false);
      expect(['NETWORK_ERROR', 'TIMEOUT']).toContain(responseBody.error.type);
      expect(responseBody.error.retryable).toBe(true);
    });

    it('should return consistent response structure', async () => {
      // Given: 여러 다른 요청 (성공/실패 케이스)
      const requests = [
        { url: 'https://blog.naver.com/valid_user/123456789' }, // 성공 케이스
        { url: 'https://blog.naver.com/invalid' }, // 실패 케이스
      ];

      for (const request of requests) {
        // When: API 호출
        const response = await apiClient.post('/extract/naver-blog', request);

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
          expect(responseBody.data.platform).toBe('naver_blog');
        } else {
          expect(responseBody).toHaveProperty('error');
          expect(responseBody.error).toHaveProperty('type');
          expect(responseBody.error).toHaveProperty('message');
          expect(responseBody.error).toHaveProperty('retryable');
        }
      }
    });
  });
});
