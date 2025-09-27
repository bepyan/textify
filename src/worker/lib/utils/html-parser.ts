// HTML Parser Utility for Textify Content Extraction Tool
// Cloudflare Workers-compatible HTML parsing utilities

import type { ParsedContent, HTMLParserOptions } from '../../types';

/**
 * Parse HTML content and extract clean text
 */
export function parseHTML(
  html: string,
  options: HTMLParserOptions = {},
): ParsedContent {
  if (!html || typeof html !== 'string') {
    return {
      title: '',
      content: '',
      metadata: {},
    };
  }

  const {
    removeAds = true,
    removeNavigation = true,
    preserveFormatting = false,
  } = options;

  try {
    // Extract title
    const title = extractTitle(html);

    // Clean HTML content
    let cleanedHtml = html;

    if (removeAds) {
      cleanedHtml = removeAdBlocks(cleanedHtml);
    }

    if (removeNavigation) {
      cleanedHtml = removeNavigationElements(cleanedHtml);
    }

    // Extract main content
    const content = extractMainContent(cleanedHtml, preserveFormatting);

    // Extract metadata
    const metadata = extractMetadata(html);

    return {
      title,
      content,
      metadata,
    };
  } catch (error) {
    throw new Error(`HTML parsing failed: ${error.message}`);
  }
}

/**
 * Extract plain text content from HTML
 */
export function extractTextContent(html: string): string {
  if (!html) return '';

  // Remove HTML tags using regex (simple approach for Cloudflare Workers)
  let text = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = decodeHtmlEntities(text);

  // Normalize whitespace
  text = normalizeWhitespace(text);

  return text.trim();
}

/**
 * Remove advertisement blocks from HTML
 */
function removeAdBlocks(html: string): string {
  const adSelectors = [
    // Generic ad classes
    /class="[^"]*ad[^"]*"/gi,
    /class="[^"]*advertisement[^"]*"/gi,
    /class="[^"]*banner[^"]*"/gi,

    // Naver-specific ad classes
    /class="[^"]*area_ad[^"]*"/gi,
    /class="[^"]*ad_area[^"]*"/gi,

    // Common ad patterns
    /<div[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/div>/gis,
    /<aside[^>]*class="[^"]*ad[^"]*"[^>]*>.*?<\/aside>/gis,
  ];

  let cleaned = html;

  for (const selector of adSelectors) {
    cleaned = cleaned.replace(selector, '');
  }

  return cleaned;
}

/**
 * Remove navigation elements from HTML
 */
function removeNavigationElements(html: string): string {
  const navSelectors = [
    // Navigation tags
    /<nav[^>]*>.*?<\/nav>/gis,
    /<header[^>]*>.*?<\/header>/gis,
    /<footer[^>]*>.*?<\/footer>/gis,

    // Navigation classes
    /<div[^>]*class="[^"]*nav[^"]*"[^>]*>.*?<\/div>/gis,
    /<div[^>]*class="[^"]*menu[^"]*"[^>]*>.*?<\/div>/gis,
    /<div[^>]*class="[^"]*sidebar[^"]*"[^>]*>.*?<\/div>/gis,

    // Naver-specific navigation
    /<div[^>]*class="[^"]*navigation[^"]*"[^>]*>.*?<\/div>/gis,
  ];

  let cleaned = html;

  for (const selector of navSelectors) {
    cleaned = cleaned.replace(selector, '');
  }

  return cleaned;
}

/**
 * Extract main content from HTML
 */
function extractMainContent(html: string, preserveFormatting: boolean): string {
  // Look for main content containers
  const contentSelectors = [
    // Naver blog specific
    /<div[^>]*class="[^"]*se-main-container[^"]*"[^>]*>(.*?)<\/div>/gis,
    /<div[^>]*class="[^"]*se-component se-text[^"]*"[^>]*>(.*?)<\/div>/gis,

    // Generic content selectors
    /<main[^>]*>(.*?)<\/main>/gis,
    /<article[^>]*>(.*?)<\/article>/gis,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>(.*?)<\/div>/gis,
    /<div[^>]*class="[^"]*post[^"]*"[^>]*>(.*?)<\/div>/gis,
  ];

  let content = '';

  // Try to find content using selectors
  for (const selector of contentSelectors) {
    const matches = html.match(selector);
    if (matches && matches.length > 0) {
      content = matches
        .map((match) => {
          // Extract content from match
          const contentMatch = match.match(selector);
          return contentMatch ? contentMatch[1] : '';
        })
        .join('\n');
      break;
    }
  }

  // If no specific content found, use the whole HTML
  if (!content) {
    content = html;
  }

  // Convert to plain text
  const textContent = extractTextContent(content);

  if (preserveFormatting) {
    return preserveBasicFormatting(textContent);
  }

  return textContent;
}

/**
 * Extract title from HTML
 */
function extractTitle(html: string): string {
  // Try to extract title from <title> tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  if (titleMatch) {
    return extractTextContent(titleMatch[1]);
  }

  // Try to extract from h1 tag
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  if (h1Match) {
    return extractTextContent(h1Match[1]);
  }

  // Try Naver blog specific title
  const naverTitleMatch = html.match(
    /<div[^>]*class="[^"]*se-title[^"]*"[^>]*>(.*?)<\/div>/is,
  );
  if (naverTitleMatch) {
    return extractTextContent(naverTitleMatch[1]);
  }

  return '';
}

/**
 * Extract metadata from HTML
 */
function extractMetadata(html: string): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Extract author
  const authorSelectors = [
    /<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i,
    /<div[^>]*class="[^"]*author[^"]*"[^>]*>(.*?)<\/div>/is,
    /<span[^>]*class="[^"]*nick[^"]*"[^>]*>(.*?)<\/span>/is,
  ];

  for (const selector of authorSelectors) {
    const match = html.match(selector);
    if (match) {
      metadata.author = extractTextContent(match[1]);
      break;
    }
  }

  // Extract publish date
  const dateSelectors = [
    /<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i,
    /<time[^>]*datetime="([^"]*)"[^>]*>/i,
    /<span[^>]*class="[^"]*date[^"]*"[^>]*>(.*?)<\/span>/is,
  ];

  for (const selector of dateSelectors) {
    const match = html.match(selector);
    if (match) {
      const dateStr = extractTextContent(match[1]);
      const date = parseDate(dateStr);
      if (date) {
        metadata.publishDate = date;
      }
      break;
    }
  }

  return metadata;
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  };

  let decoded = text;

  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
    return String.fromCharCode(parseInt(num, 10));
  });

  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Normalize whitespace
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newline
    .trim();
}

/**
 * Preserve basic formatting
 */
function preserveBasicFormatting(text: string): string {
  // Add line breaks for paragraph separation
  return text
    .replace(/\.\s+/g, '.\n') // Add newline after sentences
    .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
    .trim();
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  try {
    // Try ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try Korean date format (YYYY.MM.DD)
    const koreanMatch = dateStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (koreanMatch) {
      const [, year, month, day] = koreanMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return null;
  } catch {
    return null;
  }
}
