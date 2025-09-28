/**
 * YouTube Content Extractor
 *
 * YouTube 비디오 메타데이터 추출기
 */

import { BaseExtractor } from './base-extractor';
import { ContentExtractionError, ExtractionErrorType } from '../types/errors';
import {
  ContentPlatform,
  type YouTubeContent,
  type ExtractionOptions,
  ExtractionStatus,
} from '../types/extraction';
import {
  parseDocument,
  extractMetaTags,
  extractJsonLd,
} from '../utils/html-parser';
import { extractVideoId } from '../utils/url-parser';

// linkedom 타입 정의
interface Document {
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): Element[];
  body?: Element;
  head?: Element;
  title?: string;
  documentElement?: Element;
  textContent?: string | null;
}

interface Element {
  textContent?: string | null;
  outerHTML?: string;
  getAttribute(name: string): string | null;
  querySelector(selector: string): Element | null;
  querySelectorAll(selector: string): Element[];
  remove(): void;
}

// ============================================================================
// YouTube Extractor Implementation
// ============================================================================

export class YouTubeExtractor extends BaseExtractor {
  constructor() {
    super(ContentPlatform.YOUTUBE, 5000, 3);
  }

  protected validateUrl(url: string): void {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new ContentExtractionError(
        ExtractionErrorType.INVALID_URL,
        '유효한 YouTube URL이 아닙니다.',
        `URL: ${url}`,
      );
    }
  }

  protected getDefaultOptions(): ExtractionOptions {
    return {
      includeTags: false,
      timeout: 5000,
      maxContentLength: 5120, // 5KB
    };
  }

  protected async performExtraction(
    url: string,
    options: ExtractionOptions,
  ): Promise<YouTubeContent> {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new ContentExtractionError(
        ExtractionErrorType.INVALID_URL,
        '비디오 ID를 추출할 수 없습니다.',
      );
    }

    // YouTube 페이지 HTML 가져오기
    const html = await this.fetchHtmlContent(url);

    // 메타데이터 추출
    const metadata = await this.extractVideoMetadata(html, videoId, options);

    // 비디오 존재 여부 확인
    if (!metadata.title || metadata.title.trim() === '') {
      throw new ContentExtractionError(
        ExtractionErrorType.CONTENT_NOT_FOUND,
        '비디오를 찾을 수 없습니다.',
        `비디오 ID: ${videoId}`,
      );
    }

    return {
      id: this.generateContentId(url),
      platform: ContentPlatform.YOUTUBE,
      url,
      title: metadata.title,
      extractedAt: Date.now(),
      status: ExtractionStatus.SUCCESS,
      videoId,
      description: this.limitTextLength(
        metadata.description,
        options.maxContentLength,
      ),
      thumbnailUrl: metadata.thumbnailUrl,
      channelName: metadata.channelName,
      channelId: metadata.channelId,
      uploadDate: metadata.uploadDate,
      duration: metadata.duration,
      viewCount: metadata.viewCount,
      likeCount: metadata.likeCount,
      tags: options.includeTags ? metadata.tags : undefined,
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async extractVideoMetadata(
    html: string,
    videoId: string,
    options: ExtractionOptions,
  ) {
    const doc = parseDocument(html);
    const metaTags = extractMetaTags(html);
    const jsonLdData = extractJsonLd(html);

    // 기본 메타데이터 추출
    const title = this.extractTitle(doc, metaTags);
    const description = this.extractDescription(doc, metaTags);
    const thumbnailUrl = this.extractThumbnailUrl(metaTags, videoId);
    const channelInfo = this.extractChannelInfo(doc, metaTags);
    const uploadDate = this.extractUploadDate(doc, metaTags, jsonLdData);
    const duration = this.extractDuration(doc, metaTags, jsonLdData);
    const viewCount = this.extractViewCount(doc);
    const likeCount = this.extractLikeCount(doc);
    const tags = options.includeTags
      ? this.extractTags(doc, metaTags)
      : undefined;

    return {
      title,
      description,
      thumbnailUrl,
      channelName: channelInfo.name,
      channelId: channelInfo.id,
      uploadDate,
      duration,
      viewCount,
      likeCount,
      tags,
    };
  }

  private extractTitle(
    doc: Document,
    metaTags: Record<string, string>,
  ): string {
    // 우선순위: og:title > meta title > document title
    const title = metaTags['og:title'] || metaTags['title'] || doc.title || '';

    if (!title) {
      throw new ContentExtractionError(
        ExtractionErrorType.PARSING_ERROR,
        '비디오 제목을 찾을 수 없습니다.',
      );
    }

    // YouTube 제목에서 " - YouTube" 제거
    return title.replace(/ - YouTube$/, '').trim();
  }

  private extractDescription(
    _doc: Document,
    metaTags: Record<string, string>,
  ): string {
    // 우선순위: og:description > meta description
    const description =
      metaTags['og:description'] || metaTags['description'] || '';

    return description.trim();
  }

  private extractThumbnailUrl(
    metaTags: Record<string, string>,
    videoId: string,
  ): string {
    // 우선순위: og:image > 기본 썸네일 URL
    const thumbnailUrl =
      metaTags['og:image'] ||
      `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

    return thumbnailUrl;
  }

  private extractChannelInfo(
    doc: Document,
    _metaTags: Record<string, string>,
  ): { name: string; id: string } {
    // 채널명 추출
    let channelName = '';

    // 다양한 방법으로 채널명 시도
    const channelNameSelectors = [
      'meta[itemprop="name"]',
      'link[itemprop="name"]',
      '[class*="channel-name"]',
      '[class*="owner-name"]',
    ];

    for (const selector of channelNameSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        channelName =
          element.getAttribute('content') || element.textContent || '';
        if (channelName.trim()) break;
      }
    }

    // 채널 ID 추출 (URL에서)
    let channelId = '';
    const channelLinks = doc.querySelectorAll(
      'a[href*="/channel/"], a[href*="/@"]',
    );
    for (const link of channelLinks) {
      const href = link.getAttribute('href') || '';
      const channelMatch = href.match(/\/channel\/([^/?]+)/);
      const handleMatch = href.match(/\/@([^/?]+)/);

      if (channelMatch) {
        channelId = channelMatch[1];
        break;
      } else if (handleMatch) {
        channelId = handleMatch[1];
        break;
      }
    }

    return {
      name: channelName || 'Unknown Channel',
      id: channelId || 'unknown',
    };
  }

  private extractUploadDate(
    _doc: Document,
    metaTags: Record<string, string>,
    jsonLdData: any[],
  ): number {
    // JSON-LD에서 업로드 날짜 찾기
    for (const data of jsonLdData) {
      if (data.uploadDate) {
        const date = new Date(data.uploadDate);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      }
    }

    // meta 태그에서 찾기
    const datePublished =
      metaTags['datePublished'] || metaTags['article:published_time'];
    if (datePublished) {
      const date = new Date(datePublished);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
    }

    // 기본값: 현재 시간
    return Date.now();
  }

  private extractDuration(
    _doc: Document,
    metaTags: Record<string, string>,
    jsonLdData: any[],
  ): string {
    // JSON-LD에서 duration 찾기
    for (const data of jsonLdData) {
      if (data.duration) {
        return data.duration;
      }
    }

    // meta 태그에서 찾기
    const duration = metaTags['duration'] || metaTags['video:duration'];
    if (duration) {
      // 초 단위를 ISO 8601 duration으로 변환
      const seconds = parseInt(duration);
      if (!isNaN(seconds)) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let result = 'PT';
        if (hours > 0) result += `${hours}H`;
        if (minutes > 0) result += `${minutes}M`;
        if (remainingSeconds > 0) result += `${remainingSeconds}S`;

        return result;
      }
    }

    // 기본값
    return 'PT0S';
  }

  private extractViewCount(doc: Document): number | undefined {
    // 다양한 선택자로 조회수 찾기
    const viewSelectors = [
      '[class*="view-count"]',
      '[class*="views"]',
      'meta[itemprop="interactionCount"]',
    ];

    for (const selector of viewSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const viewText =
          element.getAttribute('content') || element.textContent || '';
        const viewMatch = viewText.match(/[\d,]+/);
        if (viewMatch) {
          const viewCount = parseInt(viewMatch[0].replace(/,/g, ''));
          if (!isNaN(viewCount)) {
            return viewCount;
          }
        }
      }
    }

    return undefined;
  }

  private extractLikeCount(doc: Document): number | undefined {
    // 좋아요 수 추출 (YouTube의 구조 변경으로 인해 어려울 수 있음)
    const likeSelectors = [
      '[class*="like-count"]',
      '[class*="likes"]',
      'button[aria-label*="like"] span',
    ];

    for (const selector of likeSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        const likeText = element.textContent || '';
        const likeMatch = likeText.match(/[\d,]+/);
        if (likeMatch) {
          const likeCount = parseInt(likeMatch[0].replace(/,/g, ''));
          if (!isNaN(likeCount)) {
            return likeCount;
          }
        }
      }
    }

    return undefined;
  }

  private extractTags(
    doc: Document,
    metaTags: Record<string, string>,
  ): string[] | undefined {
    const tags: string[] = [];

    // meta keywords에서 태그 추출
    const keywords = metaTags['keywords'];
    if (keywords) {
      const keywordTags = keywords
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      tags.push(...keywordTags);
    }

    // video:tag meta 태그들에서 추출
    const videoTags = doc.querySelectorAll('meta[property="video:tag"]');
    videoTags.forEach((tag: Element) => {
      const content = tag.getAttribute('content');
      if (content && content.trim()) {
        tags.push(content.trim());
      }
    });

    // 중복 제거 및 길이 제한
    const uniqueTags = [...new Set(tags)];
    return uniqueTags.length > 0 ? uniqueTags.slice(0, 20) : undefined;
  }
}
