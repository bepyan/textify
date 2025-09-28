/**
 * URL Parsing Utilities
 *
 * URL 파싱 및 플랫폼 감지 유틸리티 함수들
 */

import { ContentPlatform } from '../types/extraction';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PlatformInfo {
  platform: ContentPlatform;
  patterns: RegExp[];
  extractor: string;
}

export interface PostInfo {
  authorId: string;
  postId: string;
}

export interface UrlParseResult {
  success: boolean;
  platform: ContentPlatform | null;
  normalizedUrl: string;
  videoId: string | null;
  postInfo: PostInfo | null;
  error?: 'INVALID_URL' | 'UNSUPPORTED_PLATFORM';
}

// ============================================================================
// Platform Patterns
// ============================================================================

const PLATFORM_PATTERNS: PlatformInfo[] = [
  {
    platform: ContentPlatform.YOUTUBE,
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
      /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
      /^(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
    ],
    extractor: 'YouTubeExtractor',
  },
  {
    platform: ContentPlatform.NAVER_BLOG,
    patterns: [
      /^(?:https?:\/\/)?blog\.naver\.com\/([^/\s]+)\/(\d+)(?:\?.*)?$/,
      /^(?:https?:\/\/)?blog\.naver\.com\/([^/\s]+)\/(\d+)\/.*$/,
      /^(?:https?:\/\/)?blog\.naver\.com\/PostView\.naver\?blogId=([^&\s]+)&logNo=(\d+)(?:&.*)?$/,
    ],
    extractor: 'NaverBlogExtractor',
  },
];

// ============================================================================
// Core Functions
// ============================================================================

export function detectPlatform(url: string): ContentPlatform | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const normalizedUrl = normalizeUrl(url);

    for (const platformInfo of PLATFORM_PATTERNS) {
      for (const pattern of platformInfo.patterns) {
        if (pattern.test(normalizedUrl)) {
          return platformInfo.platform;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const normalizedUrl = normalizeUrl(url);

    // YouTube URL 패턴들 - 정확히 11자 비디오 ID만 매치
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&|$)/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?|$)/,
      /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})(?:&|$)/,
    ];

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        // 유효한 YouTube 비디오 ID인지 추가 검증
        if (/^[a-zA-Z0-9_-]{11}$/.test(match[1])) {
          return match[1];
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function extractPostInfo(url: string): PostInfo | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const normalizedUrl = normalizeUrl(url);

    // 네이버 블로그 패턴들 - 더 엄격한 검증
    const patterns = [
      // 기본 형태: blog.naver.com/authorId/postId (정확히 끝나야 함)
      /^(?:https?:\/\/)?blog\.naver\.com\/([^/\s]+)\/(\d+)(?:\?.*)?$/,
      // PostView 형태: blog.naver.com/PostView.naver?blogId=authorId&logNo=postId
      /^(?:https?:\/\/)?blog\.naver\.com\/PostView\.naver\?blogId=([^&\s]+)&logNo=(\d+)(?:&.*)?$/,
    ];

    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);

      if (match && match[1] && match[2]) {
        const authorId = match[1];
        const postId = match[2];

        // 더 엄격한 검증
        if (
          authorId.length > 0 &&
          authorId !== '' &&
          !authorId.includes('/') &&
          !authorId.includes('?') &&
          !authorId.includes('&') &&
          /^[a-zA-Z0-9_-]+$/.test(authorId) && // authorId는 영숫자, 언더스코어, 하이픈만 허용
          /^\d+$/.test(postId) &&
          postId.length >= 1 && postId.length <= 20 // postId 길이 제한
        ) {
          return {
            authorId,
            postId,
          };
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const platform = detectPlatform(url);
    const videoId = extractVideoId(url);

    return platform === ContentPlatform.YOUTUBE && videoId !== null;
  } catch {
    return false;
  }
}

export function isValidNaverBlogUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const platform = detectPlatform(url);
    const postInfo = extractPostInfo(url);

    return platform === ContentPlatform.NAVER_BLOG && postInfo !== null;
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // 이미 프로토콜이 있는 경우 그대로 반환
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('ftp://')
  ) {
    return url;
  }

  // 프로토콜이 없는 경우 https 추가
  return `https://${url}`;
}

export function parseUrl(url: string): UrlParseResult {
  if (!url || typeof url !== 'string') {
    return {
      success: false,
      platform: null,
      normalizedUrl: '',
      videoId: null,
      postInfo: null,
      error: 'INVALID_URL',
    };
  }

  try {
    // 먼저 기본적인 URL 형식 검증
    if (!isValidUrl(url)) {
      return {
        success: false,
        platform: null,
        normalizedUrl: url,
        videoId: null,
        postInfo: null,
        error: 'INVALID_URL',
      };
    }

    const normalizedUrl = normalizeUrl(url);
    const platform = detectPlatform(normalizedUrl);

    if (!platform) {
      return {
        success: false,
        platform: null,
        normalizedUrl,
        videoId: null,
        postInfo: null,
        error: 'UNSUPPORTED_PLATFORM',
      };
    }

    let videoId: string | null = null;
    let postInfo: PostInfo | null = null;

    if (platform === ContentPlatform.YOUTUBE) {
      videoId = extractVideoId(normalizedUrl);
      if (!videoId) {
        return {
          success: false,
          platform: null,
          normalizedUrl,
          videoId: null,
          postInfo: null,
          error: 'INVALID_URL',
        };
      }
    } else if (platform === ContentPlatform.NAVER_BLOG) {
      postInfo = extractPostInfo(normalizedUrl);
      if (!postInfo) {
        return {
          success: false,
          platform: null,
          normalizedUrl,
          videoId: null,
          postInfo: null,
          error: 'INVALID_URL',
        };
      }
    }

    return {
      success: true,
      platform,
      normalizedUrl,
      videoId,
      postInfo,
    };
  } catch {
    return {
      success: false,
      platform: null,
      normalizedUrl: url,
      videoId: null,
      postInfo: null,
      error: 'INVALID_URL',
    };
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);

    // 기본적인 URL 형식 검증
    // 도메인이 있어야 하고, 최소한의 구조를 가져야 함
    if (!urlObj.hostname || urlObj.hostname.length < 3) {
      return false;
    }

    // 도메인에 최소한 하나의 점이 있어야 함 (예: example.com)
    if (!urlObj.hostname.includes('.')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isSupportedPlatform(url: string): boolean {
  return detectPlatform(url) !== null;
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getPlatformInfo(
  platform: ContentPlatform,
): PlatformInfo | null {
  return PLATFORM_PATTERNS.find((info) => info.platform === platform) || null;
}

export function getAllSupportedPlatforms(): ContentPlatform[] {
  return PLATFORM_PATTERNS.map((info) => info.platform);
}

export function getExtractorName(platform: ContentPlatform): string | null {
  const info = getPlatformInfo(platform);
  return info ? info.extractor : null;
}
