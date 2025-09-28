/**
 * Unit Test: HTML Parsing Utilities
 *
 * HTML 파싱 유틸리티 함수들을 테스트합니다.
 * 이 테스트는 구현 전에 작성되어 실패해야 합니다.
 */

import { describe, it, expect } from 'vitest';

// 구현 예정: HTML 파싱 유틸리티
import {
  parseHtml,
  extractText,
  extractImages,
  extractMetaTags,
  extractJsonLd,
  stripHtmlTags,
  sanitizeText,
  findElementBySelector,
  findElementsBySelector,
  extractAttribute,
  parseDocument,
  type HtmlParseOptions,
} from './html-parser';

describe('HTML Parsing Utilities', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>테스트 페이지</title>
      <meta name="description" content="테스트 설명">
      <meta property="og:title" content="OG 제목">
      <meta property="og:description" content="OG 설명">
      <meta property="og:image" content="https://example.com/image.jpg">
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "JSON-LD 제목",
          "description": "JSON-LD 설명"
        }
      </script>
    </head>
    <body>
      <h1>메인 제목</h1>
      <p>첫 번째 단락입니다.</p>
      <p>두 번째 <strong>강조된</strong> 단락입니다.</p>
      <img src="https://example.com/image1.jpg" alt="이미지 1">
      <img src="https://example.com/image2.png" alt="이미지 2">
      <div class="content">
        <span>내용 영역</span>
      </div>
    </body>
    </html>
  `;

  describe('parseDocument', () => {
    it('should parse HTML document successfully', () => {
      const doc = parseDocument(sampleHtml);

      expect(doc).toBeDefined();
      expect(doc.title || '').toBe('테스트 페이지');
    });

    it('should handle malformed HTML gracefully', () => {
      const malformedHtml =
        '<html><head><title>테스트</title><body><p>내용</p></html>';

      expect(() => parseDocument(malformedHtml)).not.toThrow();
      const doc = parseDocument(malformedHtml);
      expect(doc).toBeDefined();
    });

    it('should handle empty HTML', () => {
      expect(() => parseDocument('')).not.toThrow();
      expect(() => parseDocument('<html></html>')).not.toThrow();
    });
  });

  describe('extractText', () => {
    it('should extract plain text from HTML', () => {
      const html = '<p>첫 번째 <strong>강조된</strong> 단락입니다.</p>';
      const text = extractText(html);

      expect(text).toBe('첫 번째 강조된 단락입니다.');
    });

    it('should handle nested tags', () => {
      const html =
        '<div><p>외부 <span>내부 <em>깊은</em> 내용</span> 텍스트</p></div>';
      const text = extractText(html);

      expect(text).toBe('외부 내부 깊은 내용 텍스트');
    });

    it('should preserve line breaks when specified', () => {
      const html = '<p>첫 줄</p><p>둘째 줄</p>';
      const text = extractText(html, { preserveLineBreaks: true });

      expect(text).toContain('\n');
    });

    it('should handle empty or whitespace-only HTML', () => {
      expect(extractText('')).toBe('');
      expect(extractText('   ')).toBe('');
      expect(extractText('<p></p>')).toBe('');
      expect(extractText('<p>   </p>')).toBe('');
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove all HTML tags', () => {
      const html = '<p>텍스트 <strong>강조</strong> <a href="#">링크</a></p>';
      const text = stripHtmlTags(html);

      expect(text).toBe('텍스트 강조 링크');
    });

    it('should handle self-closing tags', () => {
      const html = '이미지: <img src="test.jpg" alt="테스트"> 끝';
      const text = stripHtmlTags(html);

      expect(text).toBe('이미지:  끝');
    });

    it('should handle malformed tags', () => {
      const html = '<p>시작 <strong>미완성 태그 <em>내용</p>';

      expect(() => stripHtmlTags(html)).not.toThrow();
    });
  });

  describe('extractImages', () => {
    it('should extract image URLs from HTML', () => {
      const images = extractImages(sampleHtml);

      expect(images).toHaveLength(2);
      expect(images[0]).toEqual({
        src: 'https://example.com/image1.jpg',
        alt: '이미지 1',
      });
      expect(images[1]).toEqual({
        src: 'https://example.com/image2.png',
        alt: '이미지 2',
      });
    });

    it('should handle images without alt text', () => {
      const html = '<img src="https://example.com/test.jpg">';
      const images = extractImages(html);

      expect(images).toHaveLength(1);
      expect(images[0].alt).toBe('');
    });

    it('should filter out invalid image URLs', () => {
      const html = `
        <img src="https://example.com/valid.jpg" alt="유효">
        <img src="data:image/gif;base64,..." alt="데이터 URL">
        <img src="/relative/path.jpg" alt="상대 경로">
        <img alt="src 없음">
      `;

      const images = extractImages(html, {
        filterValidUrls: true,
        includeDataUrls: false,
      });

      expect(images).toHaveLength(1);
      expect(images[0].src).toBe('https://example.com/valid.jpg');
    });

    it('should limit number of extracted images', () => {
      const html = Array(10)
        .fill('<img src="https://example.com/test.jpg">')
        .join('');
      const images = extractImages(html, { maxImages: 5 });

      expect(images).toHaveLength(5);
    });
  });

  describe('extractMetaTags', () => {
    it('should extract meta tags from HTML', () => {
      const metaTags = extractMetaTags(sampleHtml);

      expect(metaTags.description).toBe('테스트 설명');
      expect(metaTags['og:title']).toBe('OG 제목');
      expect(metaTags['og:description']).toBe('OG 설명');
      expect(metaTags['og:image']).toBe('https://example.com/image.jpg');
    });

    it('should handle missing meta tags', () => {
      const html = '<html><head><title>제목만</title></head></html>';
      const metaTags = extractMetaTags(html);

      expect(metaTags).toEqual({});
    });

    it('should prioritize Open Graph tags', () => {
      const html = `
        <meta name="description" content="일반 설명">
        <meta property="og:description" content="OG 설명">
      `;

      const metaTags = extractMetaTags(html);
      expect(metaTags.description).toBe('일반 설명');
      expect(metaTags['og:description']).toBe('OG 설명');
    });
  });

  describe('extractJsonLd', () => {
    it('should extract JSON-LD structured data', () => {
      const jsonLd = extractJsonLd(sampleHtml);

      expect(jsonLd).toHaveLength(1);
      expect(jsonLd[0]['@type']).toBe('Article');
      expect(jsonLd[0].headline).toBe('JSON-LD 제목');
      expect(jsonLd[0].description).toBe('JSON-LD 설명');
    });

    it('should handle multiple JSON-LD scripts', () => {
      const html = `
        <script type="application/ld+json">
          {"@type": "Article", "headline": "첫 번째"}
        </script>
        <script type="application/ld+json">
          {"@type": "Person", "name": "두 번째"}
        </script>
      `;

      const jsonLd = extractJsonLd(html);
      expect(jsonLd).toHaveLength(2);
    });

    it('should handle invalid JSON gracefully', () => {
      const html = `
        <script type="application/ld+json">
          {invalid json}
        </script>
      `;

      expect(() => extractJsonLd(html)).not.toThrow();
      const jsonLd = extractJsonLd(html);
      expect(jsonLd).toHaveLength(0);
    });
  });

  describe('findElementBySelector', () => {
    it('should find element by CSS selector', () => {
      const doc = parseDocument(sampleHtml);
      const element = findElementBySelector(doc, 'h1');

      expect(element).toBeDefined();
      expect(extractText(element!.outerHTML || '')).toBe('메인 제목');
    });

    it('should return null for non-existent selector', () => {
      const doc = parseDocument(sampleHtml);
      const element = findElementBySelector(doc, '.non-existent');

      expect(element).toBeNull();
    });
  });

  describe('findElementsBySelector', () => {
    it('should find multiple elements by CSS selector', () => {
      const doc = parseDocument(sampleHtml);
      const elements = findElementsBySelector(doc, 'p');

      expect(elements).toHaveLength(2);
    });

    it('should return empty array for non-existent selector', () => {
      const doc = parseDocument(sampleHtml);
      const elements = findElementsBySelector(doc, '.non-existent');

      expect(elements).toHaveLength(0);
    });
  });

  describe('extractAttribute', () => {
    it('should extract attribute value from element', () => {
      const html = '<img src="https://example.com/test.jpg" alt="테스트">';
      const doc = parseDocument(html);
      const img = findElementBySelector(doc, 'img');

      expect(extractAttribute(img!, 'src')).toBe(
        'https://example.com/test.jpg',
      );
      expect(extractAttribute(img!, 'alt')).toBe('테스트');
    });

    it('should return null for non-existent attribute', () => {
      const html = '<div>내용</div>';
      const doc = parseDocument(html);
      const div = findElementBySelector(doc, 'div');

      expect(extractAttribute(div!, 'class')).toBeNull();
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize text by removing extra whitespace', () => {
      const text = '  여러   공백이   있는   텍스트  \n\n  ';
      const sanitized = sanitizeText(text);

      expect(sanitized).toBe('여러 공백이 있는 텍스트');
    });

    it('should handle special characters', () => {
      const text = 'HTML &amp; entities &lt;test&gt;';
      const sanitized = sanitizeText(text, { decodeEntities: true });

      expect(sanitized).toBe('HTML & entities <test>');
    });

    it('should truncate text when specified', () => {
      const text = '매우 긴 텍스트입니다. 이 텍스트는 잘려야 합니다.';
      const sanitized = sanitizeText(text, { maxLength: 20 });

      expect(sanitized.length).toBeLessThanOrEqual(20);
      expect(sanitized).toContain('...');
    });
  });

  describe('parseHtml with options', () => {
    it('should parse HTML with custom options', () => {
      const options: HtmlParseOptions = {
        extractImages: true,
        extractMetaTags: true,
        extractJsonLd: true,
        maxImages: 10,
        sanitizeText: true,
      };

      const result = parseHtml(sampleHtml, options);

      expect(result.text).toBeDefined();
      expect(result.images).toBeDefined();
      expect(result.metaTags).toBeDefined();
      expect(result.jsonLd).toBeDefined();
    });

    it('should respect maxLength option', () => {
      const options: HtmlParseOptions = {
        maxLength: 50,
      };

      const result = parseHtml(sampleHtml, options);
      expect(result.text.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle extremely large HTML documents', () => {
      const largeHtml = '<p>' + 'x'.repeat(100000) + '</p>';

      expect(() => parseHtml(largeHtml)).not.toThrow();
    });

    it('should handle HTML with unusual encoding', () => {
      const encodedHtml = '<p>한글 텍스트 &amp; 특수문자 &lt;&gt;</p>';

      expect(() => parseHtml(encodedHtml)).not.toThrow();
      const result = parseHtml(encodedHtml);
      expect(result.text).toContain('한글');
    });

    it('should handle deeply nested HTML', () => {
      const deepHtml = '<div>'.repeat(100) + '내용' + '</div>'.repeat(100);

      expect(() => parseHtml(deepHtml)).not.toThrow();
    });

    it('should handle HTML with script and style tags', () => {
      const html = `
        <html>
        <head>
          <style>body { color: red; }</style>
          <script>console.log('test');</script>
        </head>
        <body>
          <p>실제 내용</p>
        </body>
        </html>
      `;

      const result = parseHtml(html);
      expect(result.text).toBe('실제 내용');
      expect(result.text).not.toContain('color: red');
      expect(result.text).not.toContain('console.log');
    });
  });
});
