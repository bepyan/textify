// Unit tests for text cleaner utility
import { describe, expect, test } from 'bun:test';
import {
  cleanText,
  countWords,
  extractPreview,
  normalizeWhitespace,
  removeExcessiveLineBreaks,
  removeHtmlTags,
} from './text-cleaner';

describe('Text Cleaner', () => {
  describe('cleanText', () => {
    test('should clean HTML and normalize whitespace', () => {
      const input =
        '<p>Hello   <strong>world</strong>!</p>\n\n\n<div>Test</div>';
      const result = cleanText(input);

      expect(result.content).toBe('Hello world! Test');
      expect(result.wordCount).toBe(3);
      expect(result.characterCount).toBe(17);
    });

    test('should handle empty string', () => {
      const result = cleanText('');
      expect(result).toEqual({
        content: '',
        wordCount: 0,
        characterCount: 0,
      });
    });

    test('should handle null/undefined input', () => {
      const result1 = cleanText(null as any);
      const result2 = cleanText(undefined as any);

      expect(result1).toEqual({ content: '', wordCount: 0, characterCount: 0 });
      expect(result2).toEqual({ content: '', wordCount: 0, characterCount: 0 });
    });
  });

  describe('removeHtmlTags', () => {
    test('should remove HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = removeHtmlTags(input);
      expect(result).toBe('Hello world!');
    });

    test('should handle self-closing tags', () => {
      const input = "Line 1<br/>Line 2<img src='test.jpg'/>";
      const result = removeHtmlTags(input);
      expect(result).toBe('Line 1Line 2');
    });

    test('should handle nested tags', () => {
      const input = '<div><p><span>Nested</span> content</p></div>';
      const result = removeHtmlTags(input);
      expect(result).toBe('Nested content');
    });
  });

  describe('normalizeWhitespace', () => {
    test('should normalize multiple spaces', () => {
      const input = 'Hello    world   test';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Hello world test');
    });

    test('should normalize tabs and newlines', () => {
      const input = 'Hello\t\tworld\n\ntest';
      const result = normalizeWhitespace(input);
      expect(result).toBe('Hello world test');
    });
  });

  describe('removeExcessiveLineBreaks', () => {
    test('should remove excessive line breaks', () => {
      const input = 'Line 1\n\n\n\n\nLine 2\n\nLine 3';
      const result = removeExcessiveLineBreaks(input);
      expect(result).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    test('should preserve double line breaks', () => {
      const input = 'Line 1\n\nLine 2';
      const result = removeExcessiveLineBreaks(input);
      expect(result).toBe('Line 1\n\nLine 2');
    });
  });

  describe('countWords', () => {
    test('should count words correctly', () => {
      expect(countWords('Hello world')).toBe(2);
      expect(countWords('  Hello   world  test  ')).toBe(3);
      expect(countWords('')).toBe(0);
      expect(countWords('   ')).toBe(0);
      expect(countWords('Single')).toBe(1);
    });

    test('should handle special characters', () => {
      expect(countWords('Hello, world! How are you?')).toBe(5);
      expect(countWords('test@example.com')).toBe(1);
    });
  });

  describe('extractPreview', () => {
    test('should return full text if under limit', () => {
      const text = 'Short text';
      const result = extractPreview(text, 50);
      expect(result).toBe('Short text');
    });

    test('should truncate at word boundary', () => {
      const text =
        'This is a very long text that should be truncated at a word boundary';
      const result = extractPreview(text, 30);
      expect(result).toBe('This is a very long text that...');
    });

    test('should handle text without spaces', () => {
      const text = 'Verylongtextwithoutspaces';
      const result = extractPreview(text, 10);
      expect(result).toBe('Verylongte...');
    });

    test('should use default length', () => {
      const text = 'A'.repeat(300);
      const result = extractPreview(text);
      expect(result.length).toBeLessThanOrEqual(203); // 200 + "..."
    });
  });
});
