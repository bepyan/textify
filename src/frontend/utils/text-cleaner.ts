// Text cleaning utilities for extracted content
export interface CleanedText {
  content: string;
  wordCount: number;
  characterCount: number;
}

/**
 * Clean and normalize extracted text content
 */
export function cleanText(rawText: string): CleanedText {
  if (!rawText || typeof rawText !== 'string') {
    return { content: '', wordCount: 0, characterCount: 0 };
  }

  // Remove HTML tags
  let cleaned = removeHtmlTags(rawText);

  // Normalize whitespace
  cleaned = normalizeWhitespace(cleaned);

  // Remove excessive line breaks
  cleaned = removeExcessiveLineBreaks(cleaned);

  // Trim and final cleanup
  cleaned = cleaned.trim();

  return {
    content: cleaned,
    wordCount: countWords(cleaned),
    characterCount: cleaned.length,
  };
}

/**
 * Remove HTML tags from text
 */
export function removeHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Normalize whitespace characters
 */
export function normalizeWhitespace(text: string): string {
  // Replace multiple spaces, tabs, and other whitespace with single space
  return text.replace(/\s+/g, ' ');
}

/**
 * Remove excessive line breaks (more than 2 consecutive)
 */
export function removeExcessiveLineBreaks(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  if (!text.trim()) return 0;

  // Split by whitespace and filter out empty strings
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Extract preview text (first N characters)
 */
export function extractPreview(text: string, maxLength: number = 200): string {
  if (text.length <= maxLength) return text;

  // Find the last complete word within the limit
  const truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');

  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }

  return truncated + '...';
}
