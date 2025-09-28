/**
 * Unit Test: Extraction Types Validation
 *
 * 추출 타입들의 검증 로직을 테스트합니다.
 * 이 테스트는 구현 전에 작성되어 실패해야 합니다.
 */

import { describe, it, expect } from 'vitest';

// 구현 예정: 타입 정의와 검증 스키마
import {
  ContentPlatform,
  ExtractionStatus,
  type YouTubeContent,
  type NaverBlogContent,
  type ExtractionResponse,
  // 검증 스키마들
  ExtractionRequestSchema,
  YouTubeContentSchema,
  NaverBlogContentSchema,
  ExtractedContentSchema,
  ExtractionResponseSchema,
} from './extraction';

describe('Extraction Types Validation', () => {
  describe('ContentPlatform enum', () => {
    it('should have correct platform values', () => {
      expect(ContentPlatform.YOUTUBE).toBe('youtube');
      expect(ContentPlatform.NAVER_BLOG).toBe('naver_blog');
    });

    it('should only allow defined platform values', () => {
      const validPlatforms = Object.values(ContentPlatform);
      expect(validPlatforms).toEqual(['youtube', 'naver_blog']);
    });
  });

  describe('ExtractionStatus enum', () => {
    it('should have correct status values', () => {
      expect(ExtractionStatus.SUCCESS).toBe('success');
      expect(ExtractionStatus.PARTIAL).toBe('partial');
      expect(ExtractionStatus.FAILED).toBe('failed');
    });
  });

  describe('ExtractionRequest validation', () => {
    it('should validate valid request', () => {
      const validRequest = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          includeTags: true,
          timeout: 5000,
        },
      };

      const result = ExtractionRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidRequest = {
        url: 'not-a-url',
      };

      const result = ExtractionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('유효한 URL');
    });

    it('should reject timeout out of range', () => {
      const invalidRequest = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          timeout: 50000, // 최대 30초 초과
        },
      };

      const result = ExtractionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject maxContentLength out of range', () => {
      const invalidRequest = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        options: {
          maxContentLength: 500, // 최소 1KB 미만
        },
      };

      const result = ExtractionRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });
  });

  describe('YouTubeContent validation', () => {
    it('should validate complete YouTube content', () => {
      const youtubeContent: YouTubeContent = {
        id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        platform: ContentPlatform.YOUTUBE,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up',
        extractedAt: Date.now(),
        status: ExtractionStatus.SUCCESS,
        videoId: 'dQw4w9WgXcQ',
        description: 'The official video for Rick Astley...',
        thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        channelName: 'Rick Astley',
        channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
        uploadDate: 1256428800000,
        duration: 'PT3M33S',
        viewCount: 1500000000,
        likeCount: 15000000,
        tags: ['rick astley', 'never gonna give you up', '80s'],
      };

      const result = YouTubeContentSchema.safeParse(youtubeContent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid video ID', () => {
      const invalidContent = {
        id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        platform: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
        extractedAt: Date.now(),
        status: 'success',
        videoId: 'invalid', // 11자가 아님
        description: 'Test description',
        thumbnailUrl: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
        channelName: 'Test Channel',
        channelId: 'UCtest',
        uploadDate: Date.now(),
        duration: 'PT3M33S',
      };

      const result = YouTubeContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid duration format', () => {
      const invalidContent = {
        id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        platform: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
        extractedAt: Date.now(),
        status: 'success',
        videoId: 'dQw4w9WgXcQ',
        description: 'Test description',
        thumbnailUrl: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
        channelName: 'Test Channel',
        channelId: 'UCtest',
        uploadDate: Date.now(),
        duration: '3:33', // ISO 8601 형식이 아님
      };

      const result = YouTubeContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it('should reject too many tags', () => {
      const invalidContent = {
        id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        platform: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
        extractedAt: Date.now(),
        status: 'success',
        videoId: 'dQw4w9WgXcQ',
        description: 'Test description',
        thumbnailUrl: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
        channelName: 'Test Channel',
        channelId: 'UCtest',
        uploadDate: Date.now(),
        duration: 'PT3M33S',
        tags: Array(25).fill('tag'), // 최대 20개 초과
      };

      const result = YouTubeContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });
  });

  describe('NaverBlogContent validation', () => {
    it('should validate complete Naver blog content', () => {
      const naverContent: NaverBlogContent = {
        id: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        platform: ContentPlatform.NAVER_BLOG,
        url: 'https://blog.naver.com/example_user/123456789',
        title: '맛있는 파스타 레시피',
        extractedAt: Date.now(),
        status: ExtractionStatus.SUCCESS,
        postId: '123456789',
        content: '오늘은 간단하면서도 맛있는 파스타 레시피를 소개해드릴게요...',
        authorName: '요리하는 사람',
        authorId: 'example_user',
        publishDate: 1727364000000,
        category: '요리',
        imageUrls: ['https://blogfiles.naver.net/example1.jpg'],
        summary: '오늘은 간단하면서도 맛있는 파스타 레시피를 소개해드릴게요.',
      };

      const result = NaverBlogContentSchema.safeParse(naverContent);
      expect(result.success).toBe(true);
    });

    it('should reject invalid post ID', () => {
      const invalidContent = {
        id: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        platform: 'naver_blog',
        url: 'https://blog.naver.com/example_user/123456789',
        title: '테스트 포스트',
        extractedAt: Date.now(),
        status: 'success',
        postId: 'not-a-number', // 숫자가 아님
        content: '테스트 내용',
        authorName: '테스트 작성자',
        authorId: 'test_user',
        publishDate: Date.now(),
      };

      const result = NaverBlogContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it('should reject content too large', () => {
      const invalidContent = {
        id: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        platform: 'naver_blog',
        url: 'https://blog.naver.com/example_user/123456789',
        title: '테스트 포스트',
        extractedAt: Date.now(),
        status: 'success',
        postId: '123456789',
        content: 'x'.repeat(52000), // 50KB 초과
        authorName: '테스트 작성자',
        authorId: 'test_user',
        publishDate: Date.now(),
      };

      const result = NaverBlogContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it('should reject too many images', () => {
      const invalidContent = {
        id: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        platform: 'naver_blog',
        url: 'https://blog.naver.com/example_user/123456789',
        title: '테스트 포스트',
        extractedAt: Date.now(),
        status: 'success',
        postId: '123456789',
        content: '테스트 내용',
        authorName: '테스트 작성자',
        authorId: 'test_user',
        publishDate: Date.now(),
        imageUrls: Array(55).fill('https://example.com/image.jpg'), // 최대 50개 초과
      };

      const result = NaverBlogContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });
  });

  describe('ExtractedContent union validation', () => {
    it('should validate YouTube content as ExtractedContent', () => {
      const youtubeContent = {
        id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        platform: 'youtube',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
        extractedAt: Date.now(),
        status: 'success',
        videoId: 'dQw4w9WgXcQ',
        description: 'Test description',
        thumbnailUrl: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
        channelName: 'Test Channel',
        channelId: 'UCtest',
        uploadDate: Date.now(),
        duration: 'PT3M33S',
      };

      const result = ExtractedContentSchema.safeParse(youtubeContent);
      expect(result.success).toBe(true);
    });

    it('should validate Naver blog content as ExtractedContent', () => {
      const naverContent = {
        id: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
        platform: 'naver_blog',
        url: 'https://blog.naver.com/example_user/123456789',
        title: '테스트 포스트',
        extractedAt: Date.now(),
        status: 'success',
        postId: '123456789',
        content: '테스트 내용',
        authorName: '테스트 작성자',
        authorId: 'test_user',
        publishDate: Date.now(),
      };

      const result = ExtractedContentSchema.safeParse(naverContent);
      expect(result.success).toBe(true);
    });

    it('should reject unknown platform content', () => {
      const unknownContent = {
        id: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
        platform: 'unknown_platform',
        url: 'https://unknown.com/content/123',
        title: '알 수 없는 콘텐츠',
        extractedAt: Date.now(),
        status: 'success',
      };

      const result = ExtractedContentSchema.safeParse(unknownContent);
      expect(result.success).toBe(false);
    });
  });

  describe('ExtractionResponse validation', () => {
    it('should validate successful response', () => {
      const successResponse: ExtractionResponse = {
        success: true,
        data: {
          id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          platform: ContentPlatform.YOUTUBE,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          extractedAt: Date.now(),
          status: ExtractionStatus.SUCCESS,
          videoId: 'dQw4w9WgXcQ',
          description: 'Test description',
          thumbnailUrl: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
          channelName: 'Test Channel',
          channelId: 'UCtest',
          uploadDate: Date.now(),
          duration: 'PT3M33S',
        },
        metadata: {
          requestId: 'req_123456789',
          processingTime: 2500,
          platform: ContentPlatform.YOUTUBE,
          extractedFields: ['title', 'description', 'thumbnailUrl'],
          timestamp: '2023-12-01T10:00:00.000Z',
        },
      };

      const result = ExtractionResponseSchema.safeParse(successResponse);
      expect(result.success).toBe(true);
    });

    it('should validate error response', () => {
      const errorResponse = {
        success: false,
        error: {
          type: 'INVALID_URL',
          message: '유효하지 않은 URL입니다.',
          retryable: false,
        },
        metadata: {
          requestId: 'req_error_123',
          processingTime: 50,
          platform: 'unknown',
          extractedFields: [],
          timestamp: '2023-12-01T10:00:00.000Z',
        },
      };

      const result = ExtractionResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response without metadata', () => {
      const invalidResponse = {
        success: true,
        data: {
          id: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          platform: 'youtube',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          extractedAt: Date.now(),
          status: 'success',
          videoId: 'dQw4w9WgXcQ',
          description: 'Test description',
          thumbnailUrl: 'https://i.ytimg.com/vi/test/maxresdefault.jpg',
          channelName: 'Test Channel',
          channelId: 'UCtest',
          uploadDate: Date.now(),
          duration: 'PT3M33S',
        },
        // metadata 누락
      };

      const result = ExtractionResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });
});
