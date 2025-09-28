/**
 * HTML Parsing Utilities
 *
 * HTML 파싱 및 콘텐츠 추출 유틸리티 함수들
 */

import { decode } from 'html-entities';
import { parseHTML } from 'linkedom';

// linkedom 타입 정의 - 다른 파일에서 재사용 가능하도록 export
export interface LinkedomDocument {
  querySelector(selector: string): LinkedomElement | null;
  querySelectorAll(selector: string): LinkedomElement[];
  body?: LinkedomElement;
  head?: LinkedomElement;
  title?: string;
  documentElement?: LinkedomElement;
  textContent?: string | null;
}

export interface LinkedomElement {
  textContent?: string | null;
  outerHTML?: string;
  getAttribute(name: string): string | null;
  querySelector(selector: string): LinkedomElement | null;
  querySelectorAll(selector: string): LinkedomElement[];
  remove(): void;
}

export interface LinkedomWindow {
  document: LinkedomDocument;
}

// 타입 별칭 - 다른 파일에서 재사용 가능하도록 export
export type Document = LinkedomDocument;
export type Element = LinkedomElement;

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
    return (parseHTML('<html><head></head><body></body></html>') as LinkedomWindow).document;
  }

  try {
    const { document } = parseHTML(html) as LinkedomWindow;
    return document;
  } catch {
    // 파싱 실패 시 빈 문서 반환
    return (parseHTML('<html><head></head><body></body></html>') as LinkedomWindow).document;
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
    scriptsAndStyles.forEach((element: LinkedomElement) => element.remove());

    let text = '';

    if (options.preserveLineBreaks) {
      // 정규식을 사용해서 블록 요소를 줄바꿈으로 변환하고 HTML 태그 제거
      let textWithBreaks = html;

      // script와 style 태그 제거
      textWithBreaks = textWithBreaks.replace(
        /<script[^>]*>[\s\S]*?<\/script>/gi,
        '',
      );
      textWithBreaks = textWithBreaks.replace(
        /<style[^>]*>[\s\S]*?<\/style>/gi,
        '',
      );

      // 블록 요소들을 줄바꿈으로 변환
      textWithBreaks = textWithBreaks.replace(/<\/p>/gi, '\n');
      textWithBreaks = textWithBreaks.replace(/<\/div>/gi, '\n');
      textWithBreaks = textWithBreaks.replace(/<\/h[1-6]>/gi, '\n');
      textWithBreaks = textWithBreaks.replace(/<\/li>/gi, '\n');
      textWithBreaks = textWithBreaks.replace(/<br\s*\/?>/gi, '\n');
      textWithBreaks = textWithBreaks.replace(/<\/tr>/gi, '\n');
      textWithBreaks = textWithBreaks.replace(/<\/td>/gi, ' ');

      // 모든 HTML 태그 제거
      textWithBreaks = textWithBreaks.replace(/<[^>]*>/g, '');

      // HTML 엔티티 디코딩
      textWithBreaks = textWithBreaks.replace(/&lt;/g, '<');
      textWithBreaks = textWithBreaks.replace(/&gt;/g, '>');
      textWithBreaks = textWithBreaks.replace(/&amp;/g, '&');
      textWithBreaks = textWithBreaks.replace(/&quot;/g, '"');
      textWithBreaks = textWithBreaks.replace(/&#39;/g, "'");
      textWithBreaks = textWithBreaks.replace(/&nbsp;/g, ' ');

      text = textWithBreaks;

      // 연속된 줄바꿈을 최대 2개로 제한
      text = text.replace(/\n{3,}/g, '\n\n');

      // 시작과 끝의 줄바꿈 제거
      text = text.replace(/^\n+|\n+$/g, '');
    } else {
      // body가 있으면 body에서, 없으면 전체 문서에서 텍스트 추출
      text =
        doc.body?.textContent ||
        doc.documentElement?.textContent ||
        doc.textContent ||
        '';
    }

    return sanitizeText(text, {
      ...options,
      preserveLineBreaks: options.preserveLineBreaks,
    });
  } catch {
    return '';
  }
}

export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // linkedom이 self-closing 태그를 제대로 처리하지 못하는 경우가 있으므로
    // 정규식으로 먼저 처리
    let cleanHtml = html.replace(/<[^>]*>/g, '');

    // HTML 엔티티 디코딩
    cleanHtml = cleanHtml.replace(/&lt;/g, '<');
    cleanHtml = cleanHtml.replace(/&gt;/g, '>');
    cleanHtml = cleanHtml.replace(/&amp;/g, '&');
    cleanHtml = cleanHtml.replace(/&quot;/g, '"');
    cleanHtml = cleanHtml.replace(/&#39;/g, "'");
    cleanHtml = cleanHtml.replace(/&nbsp;/g, ' ');

    return cleanHtml.trim();
  } catch {
    // 파싱 실패 시 정규식으로 태그 제거
    return html.replace(/<[^>]*>/g, '').trim();
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

    metaTags.forEach((meta: LinkedomElement) => {
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

    scripts.forEach((script: LinkedomElement) => {
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

  // 여러 공백을 하나로 합치기 (줄바꿈 보존 옵션 고려)
  if (options.preserveLineBreaks) {
    // 줄바꿈은 보존하고 다른 공백만 합치기
    result = result.replace(/[ \t]+/g, ' ');
  } else {
    result = result.replace(/\s+/g, ' ');
  }

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
    scriptsAndStyles.forEach((element: LinkedomElement) => element.remove());
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
