// Naver Blog Content Extractor for Textify
// Extracts clean content from Naver blog posts using HTML parsing

import type {
  ContentExtractor,
  ExtractionResult,
  NaverExtractorOptions,
  ExtractedContent,
  ExtractionError,
  NaverBlogInfo,
  NaverBlogContent,
} from '../../types';
import { parseHTML } from '../utils/html-parser';

export class NaverExtractor implements ContentExtractor<NaverExtractorOptions> {
  /**
   * Validate if URL is a valid Naver blog URL
   */
  async validate(url: string): Promise<boolean> {
    try {
      const { blogId, postId } = this.extractIds(url);
      return blogId !== null && postId !== null && /^\d+$/.test(postId);
    } catch {
      return false;
    }
  }

  /**
   * Extract blog ID and post ID from Naver blog URL
   */
  extractIds(url: string): { blogId: string | null; postId: string | null } {
    if (!url || typeof url !== 'string') {
      return { blogId: null, postId: null };
    }

    // Standard Naver blog URL: https://blog.naver.com/blogId/postId
    const match = url.match(/blog\.naver\.com\/([^\/]+)\/(\d+)/);
    if (match) {
      return {
        blogId: match[1],
        postId: match[2],
      };
    }

    return { blogId: null, postId: null };
  }

  /**
   * Extract content from Naver blog post
   */
  async extract(
    url: string,
    options: NaverExtractorOptions = {},
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      // Validate URL
      const { blogId, postId } = this.extractIds(url);
      if (!blogId || !postId) {
        return this.createErrorResult(
          'INVALID_URL',
          'Invalid Naver blog URL format',
          startTime,
        );
      }

      // Fetch blog post HTML
      const html = await this.fetchBlogPost(url);
      if (!html) {
        return this.createErrorResult(
          'CONTENT_NOT_FOUND',
          'Blog post not found or private',
          startTime,
        );
      }

      // Extract blog info
      const blogInfo = this.extractBlogInfo(html, blogId, postId);

      // Extract content
      const blogContent = await this.extractContent(html, options);
      if (!blogContent.content) {
        return this.createErrorResult(
          'EXTRACTION_FAILED',
          'Failed to extract blog content',
          startTime,
        );
      }

      // Create extracted content
      const extractedContent: ExtractedContent = {
        id: crypto.randomUUID(),
        sourceUrl: url,
        sourceType: 'naver',
        title: blogContent.title || blogInfo.title || 'Untitled',
        content: blogContent.content,
        timestamp: new Date(),
        metadata: {
          blogId: blogInfo.blogId,
          postId: blogInfo.postId,
          author: blogContent.author || blogInfo.author,
          publishDate: blogContent.publishDate || blogInfo.publishDate,
          extractionMethod: 'naver-scraping',
          processingTime: Date.now() - startTime,
          contentLength: blogContent.content.length,
        },
      };

      return {
        success: true,
        data: extractedContent,
        processingTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Naver extraction error:', error);

      if (error.message.includes('timeout')) {
        return this.createErrorResult(
          'TIMEOUT',
          'Request timed out',
          startTime,
          true,
        );
      }

      if (error.message.includes('rate limit')) {
        return this.createErrorResult(
          'RATE_LIMITED',
          'Too many requests',
          startTime,
          true,
        );
      }

      return this.createErrorResult(
        'EXTRACTION_FAILED',
        'Failed to extract content',
        startTime,
        false,
        error.message,
      );
    }
  }

  /**
   * Fetch blog post HTML
   */
  private async fetchBlogPost(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          DNT: '1',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Post not found
        }
        if (response.status === 403) {
          return null; // Private post
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // Check if post is private or deleted
      if (
        html.includes('비공개') ||
        html.includes('삭제된') ||
        html.includes('존재하지 않는')
      ) {
        return null;
      }

      return html;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }
  }

  /**
   * Extract blog information from HTML
   */
  private extractBlogInfo(
    html: string,
    blogId: string,
    postId: string,
  ): NaverBlogInfo {
    const parsed = parseHTML(html);

    return {
      blogId,
      postId,
      title: parsed.title,
      author: parsed.metadata.author,
      publishDate: parsed.metadata.publishDate,
    };
  }

  /**
   * Extract blog content from HTML
   */
  async extractContent(
    html: string,
    options: NaverExtractorOptions,
  ): Promise<NaverBlogContent> {
    const { format = 'plain' } = options;

    // Parse HTML with Naver-specific cleaning
    const parsed = parseHTML(html, {
      removeAds: true,
      removeNavigation: true,
      preserveFormatting: format === 'markdown',
    });

    let content = parsed.content;

    // Additional Naver-specific cleaning
    content = this.cleanNaverSpecificElements(content);

    // Format content based on requested format
    if (format === 'markdown') {
      content = this.convertToMarkdown(content);
    }

    return {
      title: parsed.title,
      content,
      author: parsed.metadata.author,
      publishDate: parsed.metadata.publishDate,
    };
  }

  /**
   * Extract title from HTML
   */
  async extractTitle(url: string): Promise<string> {
    try {
      const html = await this.fetchBlogPost(url);
      if (!html) return '';

      const parsed = parseHTML(html);
      return parsed.title;
    } catch {
      return '';
    }
  }

  /**
   * Extract author from HTML
   */
  async extractAuthor(url: string): Promise<string | null> {
    try {
      const html = await this.fetchBlogPost(url);
      if (!html) return null;

      const parsed = parseHTML(html);
      return parsed.metadata.author || null;
    } catch {
      return null;
    }
  }

  /**
   * Extract publish date from HTML
   */
  async extractPublishDate(url: string): Promise<Date | null> {
    try {
      const html = await this.fetchBlogPost(url);
      if (!html) return null;

      const parsed = parseHTML(html);
      return parsed.metadata.publishDate || null;
    } catch {
      return null;
    }
  }

  /**
   * Clean Naver-specific elements
   */
  private cleanNaverSpecificElements(content: string): string {
    let cleaned = content;

    // Remove common Naver blog artifacts
    const naverArtifacts = [
      /\[출처\].*$/gm,
      /\[링크\].*$/gm,
      /본 포스팅은.*$/gm,
      /이 포스트는.*$/gm,
      /네이버 블로그.*$/gm,
      /공감\s*\d+/g,
      /댓글\s*\d+/g,
      /스크랩\s*\d+/g,
      /조회\s*\d+/g,
    ];

    for (const pattern of naverArtifacts) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Clean up excessive whitespace
    cleaned = cleaned
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double
      .replace(/^\s+|\s+$/g, '') // Trim
      .replace(/[ \t]+/g, ' '); // Multiple spaces to single

    return cleaned;
  }

  /**
   * Convert content to markdown format
   */
  private convertToMarkdown(content: string): string {
    // Basic markdown conversion
    let markdown = content;

    // Convert line breaks to markdown paragraphs
    markdown = markdown.replace(/\n\n+/g, '\n\n');

    // Add basic formatting (this is a simplified version)
    // In a real implementation, you might want more sophisticated HTML to Markdown conversion

    return markdown;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    code: ExtractionError['code'],
    message: string,
    startTime: number,
    retryable: boolean = false,
    details?: string,
  ): ExtractionResult {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        retryable,
      },
      processingTime: Date.now() - startTime,
      timestamp: new Date(),
    };
  }
}
