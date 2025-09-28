/**
 * HTML Parsing Utilities
 *
 * HTML 파싱 및 콘텐츠 추출 유틸리티 함수들
 */

import { decode } from 'html-entities';
import { parseHTML } from 'linkedom';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface HtmlParseOptions {
  extractImages?: boolean;
  extractMetaTags?: boolean;
  extractJsonLd?: boolean;
  maxImages?: number;
  maxLength?: number;
  sanitizeText?: boolean;
  preserveLineBreaks?: boolean;
  decodeEntities?: boolean;
  filterValidUrls?: boolean;
  includeDataUrls?: boolean;
}

export interface ParsedDocument {
  title: string;
  text: string;
  images?: ImageInfo[];
  metaTags?: Record<string, string>;
  jsonLd?: unknown[];
}

export interface ImageInfo {
  src: string;
  alt: string;
}

// ============================================================================
// Core Functions
// ============================================================================

export function parseDocument(html: string): Document {
  if (!html || typeof html !== 'string') {
    // 빈 HTML 문서 생성
    return parseHTML('<html><head></head><body></body></html>').document;
  }

  try {
    const { document } = parseHTML(html);
    return document;
  } catch {
    // 파싱 실패 시 빈 문서 반환
    return parseHTML('<html><head></head><body></body></html>').document;
  }
}

export function extractText(
  html: string,
  options: HtmlParseOptions = {},
): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const doc = parseDocument(html);

    // script와 style 태그 제거
    const scriptsAndStyles = doc.querySelectorAll('script, style');
    scriptsAndStyles.forEach((element) => element.remove());

    let text = '';

    if (options.preserveLineBreaks) {
      // 블록 요소들을 줄바꿈으로 변환 (간단한 방법)
      let htmlWithBreaks = html;
      htmlWithBreaks = htmlWithBreaks.replace(/<\/p>/gi, '</p>\n');
      htmlWithBreaks = htmlWithBreaks.replace(/<\/div>/gi, '</div>\n');
      htmlWithBreaks = htmlWithBreaks.replace(/<br\s*\/?>/gi, '\n');
      htmlWithBreaks = htmlWithBreaks.replace(
        /<\/h[1-6]>/gi,
        (match) => match + '\n',
      );

      const tempDoc = parseDocument(htmlWithBreaks);
      const scriptsAndStyles = tempDoc.querySelectorAll('script, style');
      scriptsAndStyles.forEach((element) => element.remove());
      text =
        tempDoc.body?.textContent ||
        tempDoc.documentElement?.textContent ||
        tempDoc.textContent ||
        '';
    } else {
      // body가 있으면 body에서, 없으면 전체 문서에서 텍스트 추출
      text =
        doc.body?.textContent ||
        doc.documentElement?.textContent ||
        doc.textContent ||
        '';
    }

    return sanitizeText(text, options);
  } catch {
    return '';
  }
}

export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const doc = parseDocument(html);
    return (
      doc.body?.textContent ||
      doc.documentElement?.textContent ||
      doc.textContent ||
      ''
    );
  } catch {
    // 파싱 실패 시 정규식으로 태그 제거
    return html.replace(/<[^>]*>/g, '');
  }
}

export function extractImages(
  html: string,
  options: HtmlParseOptions = {},
): ImageInfo[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  try {
    const doc = parseDocument(html);
    const images = doc.querySelectorAll('img');
    const result: ImageInfo[] = [];

    const maxImages = options.maxImages || 50;

    for (let i = 0; i < images.length && result.length < maxImages; i++) {
      const img = images[i];
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';

      if (src) {
        // URL 필터링
        if (options.filterValidUrls) {
          if (!options.includeDataUrls && src.startsWith('data:')) {
            continue;
          }
          if (
            !src.startsWith('http') &&
            !src.startsWith('https') &&
            !src.startsWith('data:')
          ) {
            continue;
          }
        }

        result.push({ src, alt });
      }
    }

    return result;
  } catch {
    return [];
  }
}

export function extractMetaTags(html: string): Record<string, string> {
  if (!html || typeof html !== 'string') {
    return {};
  }

  try {
    const doc = parseDocument(html);
    const metaTags = doc.querySelectorAll('meta');
    const result: Record<string, string> = {};

    metaTags.forEach((meta) => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');

      if (name && content) {
        result[name] = content;
      }
    });

    return result;
  } catch {
    return {};
  }
}

export function extractJsonLd(html: string): any[] {
  if (!html || typeof html !== 'string') {
    return [];
  }

  try {
    const doc = parseDocument(html);
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const result: any[] = [];

    scripts.forEach((script) => {
      try {
        const content = script.textContent || '';
        if (content.trim()) {
          const jsonData = JSON.parse(content);
          result.push(jsonData);
        }
      } catch {
        // JSON 파싱 실패 시 무시
      }
    });

    return result;
  } catch {
    return [];
  }
}

export function findElementBySelector(
  doc: Document,
  selector: string,
): Element | null {
  try {
    return doc.querySelector(selector);
  } catch {
    return null;
  }
}

export function findElementsBySelector(
  doc: Document,
  selector: string,
): Element[] {
  try {
    return Array.from(doc.querySelectorAll(selector));
  } catch {
    return [];
  }
}

export function extractAttribute(
  element: Element,
  attribute: string,
): string | null {
  try {
    const value = element.getAttribute(attribute);
    return value === '' ? null : value;
  } catch {
    return null;
  }
}

export function sanitizeText(
  text: string,
  options: HtmlParseOptions = {},
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  let result = text;

  // HTML 엔티티 디코딩
  if (options.decodeEntities) {
    result = decode(result);
  }

  // 여러 공백을 하나로 합치기
  result = result.replace(/\s+/g, ' ');

  // 앞뒤 공백 제거
  result = result.trim();

  // 길이 제한
  if (options.maxLength && result.length > options.maxLength) {
    result = result.substring(0, options.maxLength - 3) + '...';
  }

  return result;
}

export function parseHtml(
  html: string,
  options: HtmlParseOptions = {},
): ParsedDocument {
  if (!html || typeof html !== 'string') {
    return {
      title: '',
      text: '',
      images: [],
      metaTags: {},
      jsonLd: [],
    };
  }

  try {
    const doc = parseDocument(html);

    // 제목 추출
    const titleElement = doc.querySelector('title');
    const title = titleElement?.textContent || '';

    // 텍스트 추출
    const text = extractText(html, options);

    const result: ParsedDocument = {
      title: sanitizeText(title, options),
      text: sanitizeText(text, options),
    };

    // 선택적 데이터 추출
    if (options.extractImages) {
      result.images = extractImages(html, options);
    }

    if (options.extractMetaTags) {
      result.metaTags = extractMetaTags(html);
    }

    if (options.extractJsonLd) {
      result.jsonLd = extractJsonLd(html);
    }

    return result;
  } catch {
    return {
      title: '',
      text: '',
      images: [],
      metaTags: {},
      jsonLd: [],
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function extractTextFromElement(element: Element): string {
  try {
    return element.textContent || '';
  } catch {
    return '';
  }
}

export function removeScriptsAndStyles(doc: Document): void {
  try {
    const scriptsAndStyles = doc.querySelectorAll('script, style');
    scriptsAndStyles.forEach((element) => element.remove());
  } catch {
    // 무시
  }
}

export function getDocumentTitle(doc: Document): string {
  try {
    const titleElement = doc.querySelector('title');
    return titleElement?.textContent || '';
  } catch {
    return '';
  }
}

export function extractContentFromSelector(
  doc: Document,
  selector: string,
): string {
  try {
    const element = doc.querySelector(selector);
    return element?.textContent || '';
  } catch {
    return '';
  }
}
