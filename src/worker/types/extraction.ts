/**
 * Extraction Types and Validation Schemas
 *
 * 콘텐츠 추출 관련 타입 정의와 Zod 검증 스키마
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export enum ContentPlatform {
  YOUTUBE = 'youtube',
  NAVER_BLOG = 'naver_blog',
}

export enum ExtractionStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

// ============================================================================
// Base Interfaces
// ============================================================================

export interface ExtractedContent {
  id: string;
  platform: ContentPlatform;
  url: string;
  title: string;
  extractedAt: number;
  status: ExtractionStatus;
}

export interface YouTubeContent extends ExtractedContent {
  platform: ContentPlatform.YOUTUBE;
  videoId: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  uploadDate: number;
  duration: string;
  viewCount?: number;
  likeCount?: number;
  tags?: string[];
}

export interface NaverBlogContent extends ExtractedContent {
  platform: ContentPlatform.NAVER_BLOG;
  postId: string;
  content: string;
  authorName: string;
  authorId: string;
  publishDate: number;
  category?: string;
  imageUrls?: string[];
  summary?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ExtractionOptions {
  includeImages?: boolean;
  includeTags?: boolean;
  maxContentLength?: number;
  timeout?: number;
}

export interface ExtractionRequest {
  url: string;
  options?: ExtractionOptions;
}

export interface ResponseMetadata {
  requestId: string;
  processingTime: number;
  platform: ContentPlatform | 'unknown';
  extractedFields: string[];
}

export interface ExtractionResponse {
  success: boolean;
  data?: ExtractedContent;
  error?: {
    type: string;
    message: string;
    details?: string;
    retryable: boolean;
  };
  metadata: ResponseMetadata;
}

// ============================================================================
// Validation Schemas
// ============================================================================

// Base schemas
const ContentPlatformSchema = z.enum(['youtube', 'naver_blog']);
const ExtractionStatusSchema = z.enum(['success', 'partial', 'failed']);

// Request schema
export const ExtractionRequestSchema = z.object({
  url: z.url('유효한 URL을 입력해주세요'),
  options: z
    .object({
      includeImages: z.boolean().optional(),
      includeTags: z.boolean().optional(),
      maxContentLength: z
        .number()
        .min(1024, '최소 1KB 이상이어야 합니다')
        .max(102400, '최대 100KB까지 허용됩니다')
        .optional(),
      timeout: z
        .number()
        .min(1000, '최소 1초 이상이어야 합니다')
        .max(30000, '최대 30초까지 허용됩니다')
        .optional(),
    })
    .optional(),
});

// YouTube content schema
export const YouTubeContentSchema = z.object({
  id: z.string().length(32, 'ID는 32자 해시여야 합니다'),
  platform: z.literal('youtube'),
  url: z.url('유효한 URL이어야 합니다'),
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  extractedAt: z.number().int().min(0, '유효한 밀리초 타임스탬프여야 합니다'),
  status: ExtractionStatusSchema,
  videoId: z
    .string()
    .length(11, 'YouTube 비디오 ID는 11자여야 합니다')
    .regex(/^[a-zA-Z0-9_-]+$/, '유효한 YouTube 비디오 ID 형식이어야 합니다'),
  description: z.string().max(5120, '설명은 5KB를 초과할 수 없습니다'),
  thumbnailUrl: z.url('유효한 썸네일 URL이어야 합니다'),
  channelName: z
    .string()
    .min(1, '채널명은 필수입니다')
    .max(100, '채널명은 100자를 초과할 수 없습니다'),
  channelId: z.string().min(1, '채널 ID는 필수입니다'),
  uploadDate: z.number().int().min(0, '유효한 업로드 타임스탬프여야 합니다'),
  duration: z
    .string()
    .regex(/^PT(\d+H)?(\d+M)?(\d+S)?$/, 'ISO 8601 duration 형식이어야 합니다'),
  viewCount: z.number().min(0, '조회수는 0 이상이어야 합니다').optional(),
  likeCount: z.number().min(0, '좋아요 수는 0 이상이어야 합니다').optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, '태그는 비어있을 수 없습니다')
        .max(50, '태그는 50자를 초과할 수 없습니다'),
    )
    .max(20, '태그는 최대 20개까지 허용됩니다')
    .optional(),
});

// Naver blog content schema
export const NaverBlogContentSchema = z.object({
  id: z.string().length(32, 'ID는 32자 해시여야 합니다'),
  platform: z.literal('naver_blog'),
  url: z.url('유효한 URL이어야 합니다'),
  title: z
    .string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  extractedAt: z.number().int().min(0, '유효한 밀리초 타임스탬프여야 합니다'),
  status: ExtractionStatusSchema,
  postId: z
    .string()
    .regex(/^\d+$/, '포스트 ID는 숫자여야 합니다')
    .min(1, '포스트 ID는 필수입니다'),
  content: z
    .string()
    .max(51200, '본문은 50KB를 초과할 수 없습니다')
    .min(1, '본문 내용은 필수입니다'),
  authorName: z
    .string()
    .min(1, '작성자명은 필수입니다')
    .max(50, '작성자명은 50자를 초과할 수 없습니다'),
  authorId: z.string().min(1, '작성자 ID는 필수입니다'),
  publishDate: z.number().int().min(0, '유효한 작성 타임스탬프여야 합니다'),
  category: z
    .string()
    .min(1, '카테고리는 비어있을 수 없습니다')
    .max(30, '카테고리는 30자를 초과할 수 없습니다')
    .optional(),
  imageUrls: z
    .array(z.url('유효한 이미지 URL이어야 합니다'))
    .max(50, '이미지는 최대 50개까지 허용됩니다')
    .optional(),
  summary: z.string().max(200, '요약은 200자를 초과할 수 없습니다').optional(),
});

// Union schema for extracted content
export const ExtractedContentSchema = z.union([
  YouTubeContentSchema,
  NaverBlogContentSchema,
]);

// Response schema
export const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: ExtractedContentSchema.optional(),
  error: z
    .object({
      type: z.string(),
      message: z.string(),
      details: z.string().optional(),
      retryable: z.boolean(),
    })
    .optional(),
  metadata: z.object({
    requestId: z.string(),
    processingTime: z.number().min(0),
    platform: z.enum(['youtube', 'naver_blog', 'unknown']),
    extractedFields: z.array(z.string()),
  }),
});

// ============================================================================
// Type Guards
// ============================================================================

export function isYouTubeContent(
  content: ExtractedContent,
): content is YouTubeContent {
  return content.platform === ContentPlatform.YOUTUBE;
}

export function isNaverBlogContent(
  content: ExtractedContent,
): content is NaverBlogContent {
  return content.platform === ContentPlatform.NAVER_BLOG;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function generateContentId(url: string): string {
  // URL을 기반으로 32자 해시 생성 (간단한 구현)
  const hash = Array.from(url).reduce((hash, char) => {
    const charCode = char.charCodeAt(0);
    hash = (hash << 5) - hash + charCode;
    return hash & hash; // 32bit integer로 변환
  }, 0);

  return Math.abs(hash).toString(16).padStart(32, '0').slice(0, 32);
}

export function createResponseMetadata(
  requestId: string,
  processingTime: number,
  platform: ContentPlatform | 'unknown',
  extractedFields: string[],
): ResponseMetadata {
  return {
    requestId,
    processingTime,
    platform,
    extractedFields,
  };
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
