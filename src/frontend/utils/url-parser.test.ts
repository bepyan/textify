// Unit tests for URL parser utility
import { describe, expect, test } from 'bun:test';
import { parseUrl } from './url-parser';

describe('URL Parser', () => {
  describe('YouTube URLs', () => {
    test('should parse standard YouTube watch URL', () => {
      const result = parseUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        platform: 'youtube',
        id: 'dQw4w9WgXcQ',
        isValid: true,
      });
    });

    test('should parse YouTube short URL', () => {
      const result = parseUrl('https://youtu.be/dQw4w9WgXcQ');
      expect(result).toEqual({
        platform: 'youtube',
        id: 'dQw4w9WgXcQ',
        isValid: true,
      });
    });

    test('should handle YouTube URL with additional parameters', () => {
      const result = parseUrl(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
      );
      expect(result).toEqual({
        platform: 'youtube',
        id: 'dQw4w9WgXcQ',
        isValid: true,
      });
    });

    test('should reject YouTube URL with invalid video ID', () => {
      const result = parseUrl('https://www.youtube.com/watch?v=invalid');
      expect(result.platform).toBe('youtube');
      expect(result.isValid).toBe(false);
    });

    test('should reject YouTube URL without video ID', () => {
      const result = parseUrl('https://www.youtube.com/watch');
      expect(result.platform).toBe('youtube');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Naver Blog URLs', () => {
    test('should parse valid Naver blog URL', () => {
      const result = parseUrl('https://blog.naver.com/testuser/123456789');
      expect(result).toEqual({
        platform: 'naver',
        id: '123456789',
        isValid: true,
      });
    });

    test('should reject Naver blog URL with non-numeric post ID', () => {
      const result = parseUrl('https://blog.naver.com/testuser/invalid-id');
      expect(result.platform).toBe('naver');
      expect(result.isValid).toBe(false);
    });

    test('should reject incomplete Naver blog URL', () => {
      const result = parseUrl('https://blog.naver.com/testuser');
      expect(result.platform).toBe('naver');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Unknown URLs', () => {
    test('should handle unknown platform', () => {
      const result = parseUrl('https://example.com/some-content');
      expect(result).toEqual({
        platform: 'unknown',
        id: null,
        isValid: false,
      });
    });

    test('should handle invalid URL', () => {
      const result = parseUrl('not-a-url');
      expect(result).toEqual({
        platform: 'unknown',
        id: null,
        isValid: false,
      });
    });

    test('should handle empty string', () => {
      const result = parseUrl('');
      expect(result).toEqual({
        platform: 'unknown',
        id: null,
        isValid: false,
      });
    });
  });
});
