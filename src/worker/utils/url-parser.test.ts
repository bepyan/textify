/**
 * Unit Test: URL Parsing Logic
 *
 * URL 파싱 및 플랫폼 감지 로직을 테스트합니다.
 * 이 테스트는 구현 전에 작성되어 실패해야 합니다.
 */

import { describe, it, expect } from 'vitest';

// 구현 예정: URL 파싱 유틸리티
import {
  parseUrl,
  detectPlatform,
  extractVideoId,
  extractPostInfo,
  isValidYouTubeUrl,
  isValidNaverBlogUrl,
  normalizeUrl,
  type PlatformInfo,
} from './url-parser';
import { ContentPlatform } from '../types/extraction';

describe('URL Parsing Logic', () => {
  describe('detectPlatform', () => {
    it('should detect YouTube platform from various URL formats', () => {
      const youtubeUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmRdnEQy8VXJJJy8qJGGGGGGGGGGG',
      ];

      youtubeUrls.forEach((url) => {
        expect(detectPlatform(url)).toBe(ContentPlatform.YOUTUBE);
      });
    });

    it('should detect Naver blog platform from various URL formats', () => {
      const naverUrls = [
        'https://blog.naver.com/example_user/123456789',
        'http://blog.naver.com/example_user/123456789',
        'blog.naver.com/example_user/123456789',
        'https://blog.naver.com/user123/987654321',
      ];

      naverUrls.forEach((url) => {
        expect(detectPlatform(url)).toBe(ContentPlatform.NAVER_BLOG);
      });
    });

    it('should return null for unsupported platforms', () => {
      const unsupportedUrls = [
        'https://www.instagram.com/p/example/',
        'https://twitter.com/user/status/123456789',
        'https://www.facebook.com/video/123456789',
        'https://vimeo.com/123456789',
        'https://www.tiktok.com/@user/video/123456789',
        'https://www.google.com',
        'https://example.com/content',
      ];

      unsupportedUrls.forEach((url) => {
        expect(detectPlatform(url)).toBeNull();
      });
    });

    it('should return null for invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        'ftp://example.com',
        'mailto:test@example.com',
        '',
        null,
        undefined,
      ];

      invalidUrls.forEach((url) => {
        expect(detectPlatform(url as string)).toBeNull();
      });
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from YouTube URLs', () => {
      const testCases = [
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ',
        },
        { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
        {
          url: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'dQw4w9WgXcQ',
        },
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
          expected: 'dQw4w9WgXcQ',
        },
        {
          url: 'https://www.youtube.com/watch?v=abc123DEF45&list=PLtest',
          expected: 'abc123DEF45',
        },
      ];

      testCases.forEach(({ url, expected }) => {
        expect(extractVideoId(url)).toBe(expected);
      });
    });

    it('should return null for invalid YouTube URLs', () => {
      const invalidUrls = [
        'https://www.youtube.com/channel/UCexample',
        'https://www.youtube.com/user/example',
        'https://www.youtube.com/playlist?list=PLexample',
        'https://www.youtube.com/watch?v=',
        'https://www.youtube.com/watch',
        'https://youtu.be/',
        'https://www.youtube.com/watch?v=invalid-id-too-long',
      ];

      invalidUrls.forEach((url) => {
        expect(extractVideoId(url)).toBeNull();
      });
    });
  });

  describe('extractPostInfo', () => {
    it('should extract post info from Naver blog URLs', () => {
      const testCases = [
        {
          url: 'https://blog.naver.com/example_user/123456789',
          expected: { authorId: 'example_user', postId: '123456789' },
        },
        {
          url: 'http://blog.naver.com/test123/987654321',
          expected: { authorId: 'test123', postId: '987654321' },
        },
        {
          url: 'blog.naver.com/user_name/555666777',
          expected: { authorId: 'user_name', postId: '555666777' },
        },
      ];

      testCases.forEach(({ url, expected }) => {
        const result = extractPostInfo(url);
        expect(result).toEqual(expected);
      });
    });

    it('should return null for invalid Naver blog URLs', () => {
      const invalidUrls = [
        'https://blog.naver.com/user',
        'https://blog.naver.com/user/',
        'https://blog.naver.com//123456789',
        'https://blog.naver.com/user/not-a-number',
        'https://blog.naver.com/user/123/extra',
        'https://other-blog.com/user/123456789',
      ];

      invalidUrls.forEach((url) => {
        expect(extractPostInfo(url)).toBeNull();
      });
    });
  });

  describe('isValidYouTubeUrl', () => {
    it('should validate correct YouTube URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
      ];

      validUrls.forEach((url) => {
        expect(isValidYouTubeUrl(url)).toBe(true);
      });
    });

    it('should reject invalid YouTube URLs', () => {
      const invalidUrls = [
        'https://www.youtube.com/channel/UCexample',
        'https://www.youtube.com/watch?v=invalid',
        'https://www.youtube.com/watch?v=',
        'https://youtu.be/',
        'https://fake-youtube.com/watch?v=dQw4w9WgXcQ',
        'not-a-url',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidYouTubeUrl(url)).toBe(false);
      });
    });
  });

  describe('isValidNaverBlogUrl', () => {
    it('should validate correct Naver blog URLs', () => {
      const validUrls = [
        'https://blog.naver.com/example_user/123456789',
        'http://blog.naver.com/example_user/123456789',
        'blog.naver.com/example_user/123456789',
      ];

      validUrls.forEach((url) => {
        expect(isValidNaverBlogUrl(url)).toBe(true);
      });
    });

    it('should reject invalid Naver blog URLs', () => {
      const invalidUrls = [
        'https://blog.naver.com/user',
        'https://blog.naver.com/user/not-a-number',
        'https://blog.naver.com//123456789',
        'https://fake-naver.com/user/123456789',
        'not-a-url',
      ];

      invalidUrls.forEach((url) => {
        expect(isValidNaverBlogUrl(url)).toBe(false);
      });
    });
  });

  describe('normalizeUrl', () => {
    it('should normalize URLs by adding protocol', () => {
      const testCases = [
        {
          input: 'youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          input: 'blog.naver.com/user/123',
          expected: 'https://blog.naver.com/user/123',
        },
        {
          input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          expected: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        {
          input: 'http://blog.naver.com/user/123',
          expected: 'http://blog.naver.com/user/123',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(normalizeUrl(input)).toBe(expected);
      });
    });

    it('should handle edge cases', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('not-a-url')).toBe('https://not-a-url');
      expect(normalizeUrl('ftp://example.com')).toBe('ftp://example.com');
    });
  });

  describe('parseUrl', () => {
    it('should parse YouTube URL completely', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const result = parseUrl(url);

      expect(result.success).toBe(true);
      expect(result.platform).toBe(ContentPlatform.YOUTUBE);
      expect(result.normalizedUrl).toBe(url);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.postInfo).toBeNull();
    });

    it('should parse Naver blog URL completely', () => {
      const url = 'https://blog.naver.com/example_user/123456789';
      const result = parseUrl(url);

      expect(result.success).toBe(true);
      expect(result.platform).toBe(ContentPlatform.NAVER_BLOG);
      expect(result.normalizedUrl).toBe(url);
      expect(result.videoId).toBeNull();
      expect(result.postInfo).toEqual({
        authorId: 'example_user',
        postId: '123456789',
      });
    });

    it('should return failure for unsupported URLs', () => {
      const url = 'https://www.instagram.com/p/example/';
      const result = parseUrl(url);

      expect(result.success).toBe(false);
      expect(result.platform).toBeNull();
      expect(result.error).toBe('UNSUPPORTED_PLATFORM');
    });

    it('should return failure for invalid URLs', () => {
      const url = 'not-a-url';
      const result = parseUrl(url);

      expect(result.success).toBe(false);
      expect(result.platform).toBeNull();
      expect(result.error).toBe('INVALID_URL');
    });
  });

  describe('PlatformInfo interface', () => {
    it('should provide platform information', () => {
      const youtubePlatform: PlatformInfo = {
        platform: ContentPlatform.YOUTUBE,
        patterns: [
          /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
          /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
        ],
        extractor: 'YouTubeExtractor',
      };

      expect(youtubePlatform.platform).toBe('youtube');
      expect(youtubePlatform.patterns).toHaveLength(2);
      expect(youtubePlatform.extractor).toBe('YouTubeExtractor');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed URLs gracefully', () => {
      const malformedUrls = [
        'https://youtube.com/watch?v=',
        'https://blog.naver.com/',
        'https://youtube.com/watch?v=dQw4w9WgXcQ&v=another',
        'https://blog.naver.com/user/123/456',
      ];

      malformedUrls.forEach((url) => {
        expect(() => parseUrl(url)).not.toThrow();
      });
    });

    it('should handle special characters in URLs', () => {
      const specialUrls = [
        'https://blog.naver.com/user_name-123/123456789',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be',
        'https://blog.naver.com/한글사용자/123456789', // 한글 사용자명
      ];

      specialUrls.forEach((url) => {
        expect(() => parseUrl(url)).not.toThrow();
      });
    });

    it('should handle very long URLs', () => {
      const longUrl =
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&' +
        'list=PLrAXtmRdnEQy8VXJJJy8qJGGGGGGGGGGG&' +
        'index=1&t=10s&feature=youtu.be&' +
        'utm_source=test&utm_medium=test&utm_campaign=test&' +
        'very_long_parameter=' +
        'x'.repeat(1000);

      expect(() => parseUrl(longUrl)).not.toThrow();
      const result = parseUrl(longUrl);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });
  });
});
