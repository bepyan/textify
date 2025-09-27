# Data Model: Content Extraction API

**Feature**: Content Extraction API  
**Date**: 2025-09-27  
**Status**: Complete  

## Overview

콘텐츠 추출 API의 데이터 모델 정의입니다. 추출된 콘텐츠의 구조, 검증 규칙, 상태 전이를 포함합니다.

## Core Entities

### 1. ExtractedContent (Base Entity)

공통 추출 콘텐츠 기본 구조입니다.

```typescript
interface ExtractedContent {
  id: string;                    // 고유 식별자 (URL 해시 기반)
  platform: ContentPlatform;    // 플랫폼 타입
  url: string;                   // 원본 URL
  title: string;                 // 콘텐츠 제목
  extractedAt: number;          // 추출 시간 (JavaScript 타임스탬프)
  status: ExtractionStatus;     // 추출 상태
}

enum ContentPlatform {
  YOUTUBE = 'youtube',
  NAVER_BLOG = 'naver_blog'
}

enum ExtractionStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',          // 일부 데이터만 추출됨
  FAILED = 'failed'
}
```

**Validation Rules**:
- `id`: 필수, 32자 해시 문자열
- `platform`: 필수, ContentPlatform enum 값
- `url`: 필수, 유효한 URL 형식
- `title`: 필수, 1-200자
- `extractedAt`: 필수, JavaScript 타임스탬프 (밀리초)
- `status`: 필수, ExtractionStatus enum 값

### 2. YouTubeContent (Specialized Entity)

YouTube 콘텐츠 특화 데이터 구조입니다.

```typescript
interface YouTubeContent extends ExtractedContent {
  platform: ContentPlatform.YOUTUBE;
  videoId: string;              // YouTube 비디오 ID
  description: string;          // 비디오 설명
  thumbnailUrl: string;         // 썸네일 이미지 URL
  channelName: string;          // 채널명
  channelId: string;           // 채널 ID
  uploadDate: number;          // 업로드 날짜 (JavaScript 타임스탬프)
  duration: string;            // 비디오 길이 (ISO 8601 duration)
  viewCount?: number;          // 조회수 (선택적)
  likeCount?: number;          // 좋아요 수 (선택적)
  tags?: string[];             // 태그 목록 (선택적)
}
```

**Validation Rules**:
- `videoId`: 필수, 11자 YouTube 비디오 ID 형식
- `description`: 필수, 최대 5KB
- `thumbnailUrl`: 필수, 유효한 이미지 URL
- `channelName`: 필수, 1-100자
- `channelId`: 필수, YouTube 채널 ID 형식
- `uploadDate`: 필수, JavaScript 타임스탬프 (밀리초)
- `duration`: 필수, ISO 8601 duration 형식 (PT#M#S)
- `viewCount`: 선택적, 0 이상 정수
- `likeCount`: 선택적, 0 이상 정수
- `tags`: 선택적, 각 태그 1-50자, 최대 20개

### 3. NaverBlogContent (Specialized Entity)

네이버 블로그 콘텐츠 특화 데이터 구조입니다.

```typescript
interface NaverBlogContent extends ExtractedContent {
  platform: ContentPlatform.NAVER_BLOG;
  postId: string;              // 블로그 포스트 ID
  content: string;             // 본문 내용 (HTML 태그 제거됨)
  authorName: string;          // 작성자명
  authorId: string;           // 작성자 ID
  publishDate: number;        // 작성일 (JavaScript 타임스탬프)
  category?: string;          // 카테고리 (선택적)
  imageUrls?: string[];       // 이미지 URL 목록 (선택적)
  summary?: string;           // 요약 (선택적, 처음 200자)
}
```

**Validation Rules**:
- `postId`: 필수, 숫자 문자열
- `content`: 필수, 최대 50KB, HTML 태그 제거됨
- `authorName`: 필수, 1-50자
- `authorId`: 필수, 네이버 사용자 ID 형식
- `publishDate`: 필수, JavaScript 타임스탬프 (밀리초)
- `category`: 선택적, 1-30자
- `imageUrls`: 선택적, 각 URL 유효한 이미지 URL, 최대 50개
- `summary`: 선택적, 최대 200자

## Request/Response Models

### 1. Extraction Request

API 요청 데이터 구조입니다.

```typescript
interface ExtractionRequest {
  url: string;                 // 추출할 콘텐츠 URL
  options?: ExtractionOptions; // 추출 옵션 (선택적)
}

interface ExtractionOptions {
  includeImages?: boolean;     // 이미지 URL 포함 여부 (기본: false)
  includeTags?: boolean;       // 태그 포함 여부 (기본: false)
  maxContentLength?: number;   // 최대 콘텐츠 길이 (기본: 플랫폼별 제한)
  timeout?: number;           // 타임아웃 (ms, 기본: 5000)
}
```

**Validation Rules**:
- `url`: 필수, 유효한 URL, 지원되는 플랫폼 도메인
- `includeImages`: 선택적, boolean
- `includeTags`: 선택적, boolean
- `maxContentLength`: 선택적, 1KB-100KB 범위
- `timeout`: 선택적, 1000-30000ms 범위

### 2. Extraction Response

API 응답 데이터 구조입니다.

```typescript
interface ExtractionResponse {
  success: boolean;            // 성공 여부
  data?: ExtractedContent;     // 추출된 데이터 (성공 시)
  error?: ExtractionError;     // 에러 정보 (실패 시)
  metadata: ResponseMetadata;  // 응답 메타데이터
}

interface ResponseMetadata {
  requestId: string;           // 요청 고유 ID
  processingTime: number;      // 처리 시간 (ms)
  platform: ContentPlatform;  // 감지된 플랫폼
  extractedFields: string[];   // 성공적으로 추출된 필드 목록
}
```

### 3. Error Models

에러 응답 데이터 구조입니다.

```typescript
interface ExtractionError {
  type: ExtractionErrorType;   // 에러 타입
  message: string;             // 사용자 친화적 메시지
  details?: string;            // 상세 정보 (선택적)
  retryable: boolean;         // 재시도 가능 여부
}

enum ExtractionErrorType {
  INVALID_URL = 'INVALID_URL',
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  TIMEOUT = 'TIMEOUT',
  CONTENT_TOO_LARGE = 'CONTENT_TOO_LARGE',
  ACCESS_DENIED = 'ACCESS_DENIED'
}
```

**Error Type Mappings**:
- `INVALID_URL` → 400 Bad Request
- `UNSUPPORTED_PLATFORM` → 400 Bad Request
- `NETWORK_ERROR` → 502 Bad Gateway
- `PARSING_ERROR` → 500 Internal Server Error
- `CONTENT_NOT_FOUND` → 404 Not Found
- `RATE_LIMITED` → 429 Too Many Requests
- `TIMEOUT` → 504 Gateway Timeout
- `CONTENT_TOO_LARGE` → 413 Payload Too Large
- `ACCESS_DENIED` → 403 Forbidden

## State Transitions

### Extraction Process States

추출 프로세스의 상태 전이도입니다.

```
[REQUEST] → [VALIDATING] → [DETECTING_PLATFORM] → [FETCHING] → [PARSING] → [SUCCESS]
     ↓           ↓                ↓                  ↓           ↓
   [ERROR]    [ERROR]          [ERROR]           [ERROR]    [ERROR]
```

**State Descriptions**:
1. **REQUEST**: 초기 요청 수신
2. **VALIDATING**: URL 및 옵션 검증
3. **DETECTING_PLATFORM**: 플랫폼 자동 감지
4. **FETCHING**: 외부 콘텐츠 페치
5. **PARSING**: 콘텐츠 파싱 및 추출
6. **SUCCESS**: 성공적 완료
7. **ERROR**: 에러 발생 (모든 단계에서 가능)

### Content Status Transitions

추출된 콘텐츠의 상태 전이입니다.

```
[EXTRACTING] → [SUCCESS] / [PARTIAL] / [FAILED]
```

**Status Descriptions**:
- **SUCCESS**: 모든 필수 필드 추출 성공
- **PARTIAL**: 일부 필드만 추출 (선택적 필드 실패)
- **FAILED**: 필수 필드 추출 실패

## Data Relationships

### Platform-Content Mapping

플랫폼별 콘텐츠 타입 매핑입니다.

```typescript
type PlatformContentMap = {
  [ContentPlatform.YOUTUBE]: YouTubeContent;
  [ContentPlatform.NAVER_BLOG]: NaverBlogContent;
};
```

### URL Pattern Mapping

URL 패턴과 플랫폼 매핑입니다.

```typescript
interface PlatformPattern {
  platform: ContentPlatform;
  patterns: RegExp[];
  extractor: string;          // 추출기 클래스명
}

const PLATFORM_PATTERNS: PlatformPattern[] = [
  {
    platform: ContentPlatform.YOUTUBE,
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
    ],
    extractor: 'YouTubeExtractor'
  },
  {
    platform: ContentPlatform.NAVER_BLOG,
    patterns: [
      /(?:https?:\/\/)?blog\.naver\.com\/([^\/]+)\/(\d+)/
    ],
    extractor: 'NaverBlogExtractor'
  }
];
```

## Validation Schema (Zod v4)

런타임 검증을 위한 Zod v4 스키마입니다.

```typescript
import { z } from 'zod';

// Base schemas - Zod v4 최적화
const ContentPlatformSchema = z.enum(['youtube', 'naver_blog']);
const ExtractionStatusSchema = z.enum(['success', 'partial', 'failed']);

// Request schema with improved validation
const ExtractionRequestSchema = z.object({
  url: z.url('유효한 URL을 입력해주세요'),
  options: z.object({
    includeImages: z.boolean().optional(),
    includeTags: z.boolean().optional(),
    maxContentLength: z.number()
      .min(1024, '최소 1KB 이상이어야 합니다')
      .max(102400, '최대 100KB까지 허용됩니다')
      .optional(),
    timeout: z.number()
      .min(1000, '최소 1초 이상이어야 합니다')
      .max(30000, '최대 30초까지 허용됩니다')
      .optional()
  }).optional()
});

// YouTube content schema with enhanced validation
const YouTubeContentSchema = z.object({
  id: z.string().length(32, 'ID는 32자 해시여야 합니다'), // 또는 z.nanoid() 사용 가능
  platform: z.literal('youtube'),
  url: z.url('유효한 URL이어야 합니다'),
  title: z.string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  extractedAt: z.number().int().min(0, '유효한 밀리초 타임스탬프여야 합니다'),
  status: ExtractionStatusSchema,
  videoId: z.string()
    .length(11, 'YouTube 비디오 ID는 11자여야 합니다')
    .regex(/^[a-zA-Z0-9_-]+$/, '유효한 YouTube 비디오 ID 형식이어야 합니다'),
  description: z.string().max(5120, '설명은 5KB를 초과할 수 없습니다'),
  thumbnailUrl: z.url('유효한 썸네일 URL이어야 합니다'),
  channelName: z.string()
    .min(1, '채널명은 필수입니다')
    .max(100, '채널명은 100자를 초과할 수 없습니다'),
  channelId: z.string().min(1, '채널 ID는 필수입니다'),
  uploadDate: z.number().int().min(0, '유효한 업로드 타임스탬프여야 합니다'),
  duration: z.iso.duration('ISO 8601 duration 형식이어야 합니다'),
  viewCount: z.number()
    .min(0, '조회수는 0 이상이어야 합니다')
    .optional(),
  likeCount: z.number()
    .min(0, '좋아요 수는 0 이상이어야 합니다')
    .optional(),
  tags: z.array(
    z.string()
      .min(1, '태그는 비어있을 수 없습니다')
      .max(50, '태그는 50자를 초과할 수 없습니다')
  ).max(20, '태그는 최대 20개까지 허용됩니다').optional()
});

// Naver blog content schema with enhanced validation
const NaverBlogContentSchema = z.object({
  id: z.string().length(32, 'ID는 32자 해시여야 합니다'), // 또는 z.nanoid() 사용 가능
  platform: z.literal('naver_blog'),
  url: z.url('유효한 URL이어야 합니다'),
  title: z.string()
    .min(1, '제목은 필수입니다')
    .max(200, '제목은 200자를 초과할 수 없습니다'),
  extractedAt: z.number().int().min(0, '유효한 밀리초 타임스탬프여야 합니다'),
  status: ExtractionStatusSchema,
  postId: z.string()
    .regex(/^\d+$/, '포스트 ID는 숫자여야 합니다')
    .min(1, '포스트 ID는 필수입니다'),
  content: z.string()
    .max(51200, '본문은 50KB를 초과할 수 없습니다')
    .min(1, '본문 내용은 필수입니다'),
  authorName: z.string()
    .min(1, '작성자명은 필수입니다')
    .max(50, '작성자명은 50자를 초과할 수 없습니다'),
  authorId: z.string().min(1, '작성자 ID는 필수입니다'),
  publishDate: z.number().int().min(0, '유효한 작성 타임스탬프여야 합니다'),
  category: z.string()
    .min(1, '카테고리는 비어있을 수 없습니다')
    .max(30, '카테고리는 30자를 초과할 수 없습니다')
    .optional(),
  imageUrls: z.array(
    z.url('유효한 이미지 URL이어야 합니다')
  ).max(50, '이미지는 최대 50개까지 허용됩니다').optional(),
  summary: z.string()
    .max(200, '요약은 200자를 초과할 수 없습니다')
    .optional()
});

// Union schema for extracted content
const ExtractedContentSchema = z.union([
  YouTubeContentSchema,
  NaverBlogContentSchema
]);

// Response schema with discriminated union
const ExtractionResponseSchema = z.object({
  success: z.boolean(),
  data: ExtractedContentSchema.optional(),
  error: z.object({
    type: z.enum([
      'INVALID_URL',
      'UNSUPPORTED_PLATFORM', 
      'NETWORK_ERROR',
      'PARSING_ERROR',
      'CONTENT_NOT_FOUND',
      'RATE_LIMITED',
      'TIMEOUT',
      'CONTENT_TOO_LARGE',
      'ACCESS_DENIED'
    ]),
    message: z.string().min(1, '에러 메시지는 필수입니다'),
    details: z.string().optional(),
    retryable: z.boolean()
  }).optional(),
  metadata: z.object({
    requestId: z.string().min(1, '요청 ID는 필수입니다'),
    processingTime: z.number().min(0, '처리 시간은 0 이상이어야 합니다'),
    platform: ContentPlatformSchema.or(z.literal('unknown')),
    extractedFields: z.array(z.string())
  })
});
```

## Performance Considerations

### Memory Optimization

- **Streaming Processing**: 대용량 HTML을 청크 단위로 처리
- **Early Termination**: 필요한 데이터 추출 즉시 파싱 중단
- **Selective Parsing**: 필요한 필드만 추출하여 메모리 사용량 최소화

### Size Limits

- **YouTube Description**: 5KB 제한
- **Naver Blog Content**: 50KB 제한
- **Image URLs**: 최대 50개
- **Tags**: 최대 20개

### Caching Strategy (Future)

```typescript
interface CacheKey {
  platform: ContentPlatform;
  contentId: string;         // videoId 또는 postId
  version: string;           // 콘텐츠 버전 (해시)
}

interface CacheEntry {
  data: ExtractedContent;
  cachedAt: string;
  expiresAt: string;
  hitCount: number;
}
```

## Conclusion

데이터 모델이 완전히 정의되었으며, 타입 안전성과 검증 규칙이 설정되었습니다. 이 모델을 기반으로 API 계약과 구현체를 개발할 수 있습니다.
