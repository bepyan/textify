/**
 * Naver Blog Content Extractor
 *
 * 네이버 블로그 콘텐츠 추출기
 */

import { BaseExtractor } from './base-extractor';
import { ContentExtractionError, ExtractionErrorType } from '../types/errors';
import {
  ContentPlatform,
  type NaverBlogContent,
  type ExtractionOptions,
  ExtractionStatus,
} from '../types/extraction';
import {
  parseDocument,
  extractText,
  extractImages,
  extractMetaTags,
} from '../utils/html-parser';
import { extractPostInfo } from '../utils/url-parser';

// ============================================================================
// Naver Blog Extractor Implementation
// ============================================================================

export class NaverBlogExtractor extends BaseExtractor {
  constructor() {
    super(ContentPlatform.NAVER_BLOG, 5000, 3);
  }

  protected validateUrl(url: string): void {
    const postInfo = extractPostInfo(url);
    if (!postInfo) {
      throw new ContentExtractionError(
        ExtractionErrorType.INVALID_URL,
        '유효한 네이버 블로그 URL이 아닙니다.',
        `URL: ${url}`,
      );
    }
  }

  protected getDefaultOptions(): ExtractionOptions {
    return {
      includeImages: false,
      timeout: 5000,
      maxContentLength: 51200, // 50KB
    };
  }

  protected async performExtraction(
    url: string,
    options: ExtractionOptions,
  ): Promise<NaverBlogContent> {
    const postInfo = extractPostInfo(url);
    if (!postInfo) {
      throw new ContentExtractionError(
        ExtractionErrorType.INVALID_URL,
        '포스트 정보를 추출할 수 없습니다.',
      );
    }

    // 네이버 블로그는 iframe 구조를 사용하므로 실제 콘텐츠 URL로 변환
    const contentUrl = this.buildContentUrl(postInfo.authorId, postInfo.postId);

    // 블로그 콘텐츠 HTML 가져오기
    const html = await this.fetchHtmlContent(contentUrl);

    // 메타데이터 추출
    const metadata = await this.extractBlogMetadata(html, postInfo, options);

    return {
      id: this.generateContentId(url),
      platform: ContentPlatform.NAVER_BLOG,
      url,
      title: metadata.title,
      extractedAt: Date.now(),
      status: ExtractionStatus.SUCCESS,
      postId: postInfo.postId,
      content: this.limitTextLength(metadata.content, options.maxContentLength),
      authorName: metadata.authorName,
      authorId: postInfo.authorId,
      publishDate: metadata.publishDate,
      category: metadata.category,
      imageUrls: options.includeImages ? metadata.imageUrls : undefined,
      summary:
        metadata.content.length > 200
          ? this.generateSummary(metadata.content)
          : undefined,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private buildContentUrl(authorId: string, postId: string): string {
    // 네이버 블로그의 실제 콘텐츠 URL 구성
    // iframe 내부의 실제 콘텐츠를 가져오기 위한 URL
    return `https://blog.naver.com/PostView.naver?blogId=${authorId}&logNo=${postId}&redirect=Dlog&widgetTypeCall=true&directAccess=false`;
  }

  private async extractBlogMetadata(
    html: string,
    postInfo: { authorId: string; postId: string },
    options: ExtractionOptions,
  ) {
    const doc = parseDocument(html);
    const metaTags = extractMetaTags(html);

    // 기본 메타데이터 추출
    const title = this.extractTitle(doc, metaTags);
    const content = this.extractContent(doc);
    const authorName = this.extractAuthorName(doc, metaTags, postInfo.authorId);
    const publishDate = this.extractPublishDate(doc, metaTags);
    const category = this.extractCategory(doc);
    const imageUrls = options.includeImages
      ? this.extractImageUrls(html)
      : undefined;

    return {
      title,
      content,
      authorName,
      publishDate,
      category,
      imageUrls,
    };
  }

  private extractTitle(
    doc: Document,
    metaTags: Record<string, string>,
  ): string {
    // 우선순위: og:title > meta title > document title > 본문에서 첫 번째 제목
    let title = metaTags['og:title'] || metaTags['title'] || doc.title || '';

    // 네이버 블로그 제목에서 불필요한 부분 제거
    title = title.replace(/ : 네이버 블로그$/, '').trim();

    // 제목이 없으면 본문에서 첫 번째 헤딩 태그 찾기
    if (!title) {
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      for (const heading of headings) {
        const headingText = heading.textContent?.trim();
        if (headingText && headingText.length > 0) {
          title = headingText;
          break;
        }
      }
    }

    if (!title) {
      throw new ContentExtractionError(
        ExtractionErrorType.PARSING_ERROR,
        '블로그 포스트 제목을 찾을 수 없습니다.',
      );
    }

    return title;
  }

  private extractContent(doc: Document): string {
    // 네이버 블로그의 본문 콘텐츠 선택자들
    const contentSelectors = [
      '.se-main-container', // 스마트에디터 3.0
      '.se-component', // 스마트에디터 구성요소
      '#postViewArea', // 구 버전
      '.post-view', // 일반적인 포스트 뷰
      '.blog-content', // 블로그 콘텐츠
      'div[class*="content"]', // 콘텐츠 관련 div
      'article', // 아티클 태그
      'main', // 메인 태그
    ];

    let content = '';

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        // script와 style 태그 제거
        const scripts = element.querySelectorAll('script, style');
        scripts.forEach((script) => script.remove());

        // 텍스트 추출
        content = extractText(element.outerHTML, {
          preserveLineBreaks: true,
          decodeEntities: true,
        });

        if (content.trim().length > 0) {
          break;
        }
      }
    }

    // 콘텐츠를 찾지 못한 경우 전체 body에서 추출
    if (!content.trim()) {
      content = extractText(doc.body?.outerHTML || '', {
        preserveLineBreaks: true,
        decodeEntities: true,
      });
    }

    if (!content.trim()) {
      throw new ContentExtractionError(
        ExtractionErrorType.PARSING_ERROR,
        '블로그 포스트 내용을 찾을 수 없습니다.',
      );
    }

    return content.trim();
  }

  private extractAuthorName(
    doc: Document,
    metaTags: Record<string, string>,
    authorId: string,
  ): string {
    // 다양한 방법으로 작성자명 추출
    let authorName = '';

    // 메타 태그에서 찾기
    authorName = metaTags['author'] || metaTags['article:author'] || '';

    // DOM에서 찾기
    if (!authorName) {
      const authorSelectors = [
        '.blog_author',
        '.author-name',
        '[class*="author"]',
        '.nick',
        '.nickname',
      ];

      for (const selector of authorSelectors) {
        const element = doc.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text && text.length > 0) {
            authorName = text;
            break;
          }
        }
      }
    }

    // 기본값으로 authorId 사용
    return authorName || authorId;
  }

  private extractPublishDate(
    doc: Document,
    metaTags: Record<string, string>,
  ): number {
    // 메타 태그에서 날짜 찾기
    const dateFields = [
      'article:published_time',
      'datePublished',
      'date',
      'pubdate',
    ];

    for (const field of dateFields) {
      const dateStr = metaTags[field];
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }

    // DOM에서 날짜 찾기
    const dateSelectors = ['.date', '.publish-date', '[class*="date"]', 'time'];

    for (const selector of dateSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const dateStr =
          element.getAttribute('datetime') || element.textContent || '';
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }

    // 기본값: 현재 시간
    return Date.now();
  }

  private extractCategory(doc: Document): string | undefined {
    // 카테고리 추출
    const categorySelectors = [
      '.category',
      '.blog-category',
      '[class*="category"]',
      '.breadcrumb a:last-child',
    ];

    for (const selector of categorySelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const category = element.textContent?.trim();
        if (category && category.length > 0) {
          return category;
        }
      }
    }

    return undefined;
  }

  private extractImageUrls(html: string): string[] | undefined {
    const images = extractImages(html, {
      filterValidUrls: true,
      includeDataUrls: false,
      maxImages: 50,
    });

    if (images.length === 0) {
      return undefined;
    }

    // 네이버 블로그 이미지 URL 필터링 및 정리
    const validImages = images
      .map((img) => img.src)
      .filter((src) => {
        // 네이버 블로그 이미지 도메인 확인
        return (
          src.includes('blogfiles.naver.net') ||
          src.includes('postfiles.naver.net') ||
          src.includes('storep-phinf.pstatic.net') ||
          (src.startsWith('http') && this.isValidImageUrl(src))
        );
      })
      .slice(0, 50); // 최대 50개

    return validImages.length > 0 ? validImages : undefined;
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      return validExtensions.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }
}
