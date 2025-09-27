# Quickstart: Content Extraction API

**Feature**: Content Extraction API  
**Date**: 2025-09-27  
**Status**: Ready for Implementation  

## Overview

이 가이드는 Content Extraction API의 빠른 시작을 위한 단계별 지침입니다. API 구현, 테스트, 배포까지의 전체 과정을 다룹니다.

## Prerequisites

- Bun 1.0+ 설치 (Node.js 18+ 호환)
- Cloudflare Workers 계정  
- Wrangler CLI 설치 (`bun add -g wrangler`)
- 기존 Textify 프로젝트 환경 (이미 bun 설정 완료)

> **참고**: 프로젝트에 `bun.lock` 파일이 있어 bun 패키지 매니저를 사용합니다. 모든 의존성 설치와 스크립트 실행은 bun을 통해 수행됩니다.

## Quick Setup

### 1. 의존성 설치

```bash
# 프로젝트 루트에서 실행
cd /Users/edward.kk/vscode/textify

# 기존 의존성 설치 (bun.lock 기반)
bun install

# HTML 파싱 라이브러리 설치
bun add linkedom html-entities

# 개발 의존성 (테스트용)
bun add -D @types/html-entities
```

> **Bun + Vitest 사용 팁**: 
> - `bun install`은 `npm install`보다 훨씬 빠름
> - `bun run` 대신 `bun` 명령어만으로도 스크립트 실행 가능 (예: `bun dev`, `bun test`)
> - `bun test`는 `vitest run`을 실행 (전체 테스트 1회 실행)
> - `bun test:watch`는 `vitest`를 실행 (와치 모드)
> - 특정 파일/디렉토리 테스트 (1회 실행): `bun vitest run <path>`
> - **Worker 테스트**: `src/worker/**/*.test.ts` 파일들은 Node.js 환경에서 실행
> - **Frontend 테스트**: `src/frontend/**/*.test.(ts|tsx)` 파일들은 브라우저 환경에서 실행
> - 모든 Node.js 호환 패키지가 bun에서 정상 작동

### 2. 환경 변수 설정

```bash
# .env.local 파일 생성 (선택적)
echo "YOUTUBE_API_KEY=your_youtube_api_key_here" >> .env.local
```

### 3. 기본 구조 생성

```bash
# 필요한 디렉토리 생성 (기존 src/worker 구조 확장)
mkdir -p src/worker/extractors
mkdir -p src/worker/types  
mkdir -p src/worker/utils
mkdir -p tests/contract

# 기존 구조 확인
ls -la src/worker/routes/  # index.ts, api.ts 존재 확인
ls -la src/worker/         # index.ts 존재 확인

# 계약 테스트 파일 복사 준비
mkdir -p tests/contract
```

**현재 구조 상태**:
- ✅ `src/worker/index.ts` - Worker 진입점 (기존)
- ✅ `src/worker/routes/index.ts` - CORS 및 라우팅 (기존)  
- ✅ `src/worker/routes/api.ts` - Swagger UI 및 헬스체크 (기존)
- 🆕 `src/worker/extractors/` - 새로 생성 필요
- 🆕 `src/worker/types/` - 새로 생성 필요
- 🆕 `src/worker/utils/` - 새로 생성 필요
- 🆕 `src/worker/routes/extract.ts` - 새로 생성 필요

## Implementation Steps

### Step 1: 기본 타입 정의

**참조**: `data-model.md` 섹션 2 "Core Entities" (라인 13-46)  
**계약 테스트**: `auto-extract.contract.test.ts` 라인 17-82  
**검증**: Zod 스키마가 모든 타입을 올바르게 검증해야 함  
**파일**: `@be/types/extraction.ts`

```typescript
export enum ContentPlatform {
  YOUTUBE = 'youtube',
  NAVER_BLOG = 'naver_blog'
}

export enum ExtractionStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed'
}

export interface ExtractedContent {
  id: string;
  platform: ContentPlatform;
  url: string;
  title: string;
  extractedAt: string;
  status: ExtractionStatus;
}

export interface YouTubeContent extends ExtractedContent {
  platform: ContentPlatform.YOUTUBE;
  videoId: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  uploadDate: string;
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
  publishDate: string;
  category?: string;
  imageUrls?: string[];
  summary?: string;
}
```

### Step 2: 에러 타입 정의

**참조**: `data-model.md` 섹션 "Error Models" (라인 154-189)  
**계약 테스트**: 모든 contract 테스트의 에러 응답 검증  
**검증**: 모든 에러 타입이 올바른 HTTP 상태 코드와 매핑되어야 함  
**파일**: `@be/types/errors.ts`

```typescript
export enum ExtractionErrorType {
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

export class ContentExtractionError extends Error {
  constructor(
    public type: ExtractionErrorType,
    public message: string,
    public retryable: boolean = false,
    public details?: string
  ) {
    super(message);
    this.name = 'ContentExtractionError';
  }
}
```

### Step 3: URL 파서 유틸리티

**참조**: `data-model.md` 섹션 "URL Pattern Mapping" (라인 237-266)  
**계약 테스트**: `auto-extract.contract.test.ts` 라인 166-186 (다양한 URL 형식 테스트)  
**검증**: 모든 YouTube/네이버 블로그 URL 패턴을 올바르게 파싱해야 함  
**파일**: `@be/utils/url-parser.ts`

```typescript
import { ContentPlatform } from '@be/types/extraction';
import { ContentExtractionError, ExtractionErrorType } from '@be/types/errors';

const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
];

const NAVER_BLOG_PATTERN = /(?:https?:\/\/)?blog\.naver\.com\/([^\/]+)\/(\d+)/;

export interface ParsedUrl {
  platform: ContentPlatform;
  id: string;
  userId?: string;
  originalUrl: string;
}

export function parseUrl(url: string): ParsedUrl {
  // YouTube URL 파싱
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        platform: ContentPlatform.YOUTUBE,
        id: match[1],
        originalUrl: url
      };
    }
  }

  // 네이버 블로그 URL 파싱
  const naverMatch = url.match(NAVER_BLOG_PATTERN);
  if (naverMatch) {
    return {
      platform: ContentPlatform.NAVER_BLOG,
      id: naverMatch[2],
      userId: naverMatch[1],
      originalUrl: url
    };
  }

  throw new ContentExtractionError(
    ExtractionErrorType.UNSUPPORTED_PLATFORM,
    '지원하지 않는 플랫폼입니다. YouTube 또는 네이버 블로그 URL을 사용해주세요.',
    false
  );
}
```

### Step 4: 기본 추출기 클래스

**참조**: `data-model.md` 섹션 "Request/Response Models" (라인 109-152)  
**계약 테스트**: 모든 추출기가 일관된 응답 구조를 반환해야 함  
**검증**: 타임아웃, 메모리 제한, ID 생성 로직이 올바르게 작동해야 함  
**파일**: `@be/extractors/base-extractor.ts`

```typescript
import { ExtractedContent } from '@be/types/extraction';

export interface ExtractionOptions {
  includeImages?: boolean;
  includeTags?: boolean;
  maxContentLength?: number;
  timeout?: number;
}

export abstract class BaseExtractor {
  protected readonly timeout: number;
  protected readonly maxContentLength: number;

  constructor(options: ExtractionOptions = {}) {
    this.timeout = options.timeout || 5000;
    this.maxContentLength = options.maxContentLength || 51200;
  }

  abstract extract(url: string, options?: ExtractionOptions): Promise<ExtractedContent>;

  protected generateId(url: string): string {
    // URL 기반 해시 생성 (32자)
    return Array.from(
      new TextEncoder().encode(url + Date.now())
    ).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
  }

  protected async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TextifyBot/1.0)'
        }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
```

### Step 5: API 라우트 구현

**참조**: `openapi.yaml` 전체 스키마, `data-model.md` 섹션 "Validation Schema"  
**계약 테스트**: 모든 contract 테스트 파일들 (`*-extract.contract.test.ts`)  
**검증**: OpenAPI 스키마와 완전히 일치하는 API 응답 구조  
**파일**: `@be/routes/extract.ts`

```typescript
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { z } from 'zod';
import { parseUrl } from '@be/utils/url-parser';
import { ContentPlatform } from '@be/types/extraction';

const app = new Hono();

// Zod v4 최적화된 요청 스키마
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

// YouTube 추출 엔드포인트
app.post('/youtube', 
  validator('json', ExtractionRequestSchema),
  async (c) => {
    try {
      const { url, options } = c.req.valid('json');
      
      // TODO: YouTubeExtractor 구현 후 사용
      // const extractor = new YouTubeExtractor(options);
      // const result = await extractor.extract(url, options);
      
      return c.json({
        success: true,
        data: null, // TODO: 실제 추출 결과
        metadata: {
          requestId: crypto.randomUUID(),
          processingTime: 0,
          platform: ContentPlatform.YOUTUBE,
          extractedFields: []
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          type: 'PARSING_ERROR',
          message: '추출 중 오류가 발생했습니다.',
          retryable: true
        },
        metadata: {
          requestId: crypto.randomUUID(),
          processingTime: 0,
          platform: ContentPlatform.YOUTUBE,
          extractedFields: []
        }
      }, 500);
    }
  }
);

// 네이버 블로그 추출 엔드포인트
app.post('/naver-blog',
  validator('json', ExtractionRequestSchema),
  async (c) => {
    // TODO: NaverBlogExtractor 구현
    return c.json({ message: 'Not implemented yet' }, 501);
  }
);

// 자동 감지 엔드포인트
app.post('/auto',
  validator('json', ExtractionRequestSchema),
  async (c) => {
    try {
      const { url, options } = c.req.valid('json');
      const parsed = parseUrl(url);
      
      // 감지된 플랫폼에 따라 적절한 엔드포인트로 리다이렉트
      if (parsed.platform === ContentPlatform.YOUTUBE) {
        // TODO: YouTube 추출 로직 호출
      } else if (parsed.platform === ContentPlatform.NAVER_BLOG) {
        // TODO: 네이버 블로그 추출 로직 호출
      }
      
      return c.json({ message: 'Not implemented yet' }, 501);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          type: 'UNSUPPORTED_PLATFORM',
          message: error.message,
          retryable: false
        },
        metadata: {
          requestId: crypto.randomUUID(),
          processingTime: 0,
          platform: 'unknown',
          extractedFields: []
        }
      }, 400);
    }
  }
);

export default app;
```

### Step 6: 기존 API에 통합

**참조**: 현재 `src/worker/routes/api.ts` 구조  
**계약 테스트**: 통합 후 모든 엔드포인트가 올바르게 라우팅되는지 확인  
**검증**: `/api/extract/*` 경로가 올바르게 작동하고 기존 API와 충돌하지 않음  
**파일**: `@be/routes/api.ts` (기존 파일 수정)

**현재 구조 분석**: 
- 기존 `api.ts`는 Swagger UI와 기본 헬스체크 엔드포인트만 포함
- `index.ts`에서 `/api/*` 경로로 CORS와 함께 라우팅
- 새로운 `/extract` 라우트를 기존 구조에 추가 필요

```typescript
// src/worker/routes/api.ts 수정
import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { openAPIRouteHandler } from 'hono-openapi';
import extract from './extract'; // 새로 추가

const app = new Hono();

// 기존 라우트들...
app.get('/', (c) => c.json({ name: 'Textify API' }));
app.get('/health', (c) => c.text('OK'));

// 새로운 추출 API 라우트 추가
app.route('/extract', extract);

// Swagger 문서화 (기존)
app.get('/docs', swaggerUI({ url: '/api/schema' }));
app.get('/schema', openAPIRouteHandler(app, {
  documentation: {
    info: {
      title: 'Textify API',
      version: '1.0.0', // 버전 업데이트
      description: 'Content Extraction API with YouTube and Naver Blog support',
    },
    servers: [
      { url: 'https://textify.bepyan.me/api' },
      { url: 'http://localhost:8787/api' },
    ],
  },
}));

export default app;
```

## Implementation Checkpoints

각 주요 구현 단계마다 다음 체크포인트를 통과해야 합니다:

### 체크포인트 1: Foundation Layer 완성
**완료 기준**:
- [ ] `ExtractionRequestSchema` Zod 검증이 모든 케이스 통과
- [ ] `YouTubeContentSchema`, `NaverBlogContentSchema` 타입 검증 통과
- [ ] 모든 에러 타입이 올바른 HTTP 상태 코드와 매핑됨
- [ ] `@be/types/extraction.test.ts`, `@be/types/errors.test.ts` 단위 테스트 통과

**검증 명령어**:
```bash
# 전체 테스트 실행 (vitest run)
bun test

# 특정 디렉토리 테스트 (1회 실행)
bun vitest run src/worker/types/

# 와치 모드로 테스트
bun test:watch
```

### 체크포인트 2: Utility Layer 완성
**완료 기준**:
- [ ] YouTube URL 패턴 모든 케이스 (youtube.com, youtu.be, m.youtube.com) 파싱 성공
- [ ] 네이버 블로그 URL 파싱 정확성 (사용자 ID, 포스트 ID 추출)
- [ ] 지원하지 않는 플랫폼에 대한 적절한 에러 처리
- [ ] `@be/utils/url-parser.test.ts` 모든 테스트 통과

**검증 명령어**:
```bash
# 특정 파일 테스트 (1회 실행)
bun vitest run src/worker/utils/url-parser.test.ts

# URL 파서 관련 모든 테스트 (1회 실행)
bun vitest run src/worker/utils/
```

### 체크포인트 3: Extractor Layer 완성
**완료 기준**:
- [ ] `BaseExtractor` 추상 클래스의 공통 기능 (타임아웃, ID 생성) 정상 작동
- [ ] YouTube/네이버 블로그 추출기의 단위 테스트 통과
- [ ] 메모리 제한 및 콘텐츠 크기 제한 준수
- [ ] 에러 상황 (네트워크 오류, 파싱 실패) 적절한 처리

**검증 명령어**:
```bash
# 추출기 관련 모든 테스트 (1회 실행)
bun vitest run src/worker/extractors/

# 특정 추출기 테스트 (1회 실행)
bun vitest run src/worker/extractors/youtube-extractor.test.ts
bun vitest run src/worker/extractors/naver-blog-extractor.test.ts
```

### 체크포인트 4: API Layer 완성
**완료 기준**:
- [ ] 모든 API 엔드포인트 (`/extract/youtube`, `/extract/naver-blog`, `/extract/auto`) 정상 작동
- [ ] OpenAPI 스키마와 완전히 일치하는 응답 구조
- [ ] 모든 계약 테스트 (`tests/contract/*.contract.test.ts`) 통과
- [ ] 기존 API와의 통합 후 충돌 없음

**검증 명령어**:
```bash
# 계약 테스트 실행 (1회 실행)
bun vitest run tests/contract/

# 전체 테스트 실행
bun test

# 로컬 서버 실행 후 수동 테스트
bun dev:cf
```

## Testing

> **Vitest 프로젝트 구조**: 
> - **Worker 테스트**: `src/worker/**/*.test.ts` (Node.js 환경)
> - **Frontend 테스트**: `src/frontend/**/*.test.(ts|tsx)` (브라우저 환경)  
> - **Contract 테스트**: `tests/contract/**/*.test.ts` (별도 관리)
> - **E2E 테스트**: `tests/e2e/**/*.test.ts` (별도 관리)

### 1. 계약 테스트 실행

```bash
# 계약 테스트 파일 복사
cp specs/002-content-extraction-api/contracts/*.test.ts tests/contract/

# 테스트 실행 (실패 예상 - 구현 전) - 1회 실행
bun vitest run tests/contract/

# 전체 테스트 실행
bun test
```

### 2. 단위 테스트 작성

**파일**: `tests/unit/utils/url-parser.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { parseUrl } from '@be/utils/url-parser';
import { ContentPlatform } from '@be/types/extraction';

describe('URL Parser', () => {
  it('should parse YouTube URLs correctly', () => {
    const testCases = [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ'
    ];

    testCases.forEach(url => {
      const result = parseUrl(url);
      expect(result.platform).toBe(ContentPlatform.YOUTUBE);
      expect(result.id).toBe('dQw4w9WgXcQ');
    });
  });

  it('should parse Naver blog URLs correctly', () => {
    const url = 'https://blog.naver.com/example_user/123456789';
    const result = parseUrl(url);
    
    expect(result.platform).toBe(ContentPlatform.NAVER_BLOG);
    expect(result.id).toBe('123456789');
    expect(result.userId).toBe('example_user');
  });

  it('should throw error for unsupported platforms', () => {
    const unsupportedUrl = 'https://www.instagram.com/p/example/';
    
    expect(() => parseUrl(unsupportedUrl)).toThrow();
  });
});
```

### 3. 통합 테스트 준비

**파일**: `tests/integration/extraction-flow.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Content Extraction Flow', () => {
  it('should handle end-to-end YouTube extraction', async () => {
    // TODO: 전체 플로우 테스트 구현
    expect(true).toBe(true); // 플레이스홀더
  });

  it('should handle end-to-end Naver blog extraction', async () => {
    // TODO: 전체 플로우 테스트 구현
    expect(true).toBe(true); // 플레이스홀더
  });
});
```

## Development Workflow

### 1. TDD 사이클

```bash
# 1. 테스트 작성 (실패)
bun test:watch
# 또는 특정 파일 와치
bun vitest --watch src/worker/types/

# UI 모드로 테스트 (브라우저에서 테스트 결과 확인)
bun vitest --ui

# 1회성 테스트 실행
bun vitest run src/worker/types/

# 2. 최소 구현 (테스트 통과)
# 코드 작성...

# 3. 리팩토링
# 코드 개선...

# 4. 반복
```

**유용한 Vitest 명령어들**:
```bash
# 커버리지 포함 테스트 (1회 실행)
bun vitest run --coverage

# 특정 패턴 매칭 테스트 (1회 실행)
bun vitest run --grep "YouTube"

# 변경된 파일만 테스트 (1회 실행)
bun vitest run --changed
```

### 2. 로컬 개발 서버

```bash
# Cloudflare Workers 로컬 개발 (API 서버)
bun dev:cf
# 또는 bun run dev:cf
# → http://localhost:8787 에서 API 서버 실행

# Vite 개발 서버 (프론트엔드)
bun dev  
# 또는 bun run dev
# → http://localhost:5173 에서 프론트엔드 실행

# 타입 생성 (필요시)
bun gen:cf
# 또는 bun run gen:cf
```

### 3. API 테스트

```bash
# YouTube 추출 테스트
curl -X POST http://localhost:8787/api/extract/youtube \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# 자동 감지 테스트
curl -X POST http://localhost:8787/api/extract/auto \
  -H "Content-Type: application/json" \
  -d '{"url": "https://youtu.be/dQw4w9WgXcQ"}'
```

## Deployment

### 1. 빌드 및 배포

```bash
# 프로덕션 빌드 (프론트엔드 + 워커)
bun build

# Cloudflare Workers 배포
bun deploy

# 린트 검사 (배포 전 권장)
bun lint
```

### 2. 환경 변수 설정 (선택적)

```bash
# YouTube API 키 설정 (선택적)
wrangler secret put YOUTUBE_API_KEY
```

### 3. 배포 확인

```bash
# API 상태 확인
curl https://textify.bepyan.me/api/health

# 추출 API 테스트
curl -X POST https://textify.bepyan.me/api/extract/auto \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## Monitoring & Debugging

### 1. 로그 확인

```bash
# Cloudflare Workers 로그
wrangler tail

# 특정 요청 추적
wrangler tail --format=pretty
```

### 2. 성능 모니터링

- Cloudflare Analytics 대시보드 확인
- 응답 시간 및 에러율 모니터링
- CPU 사용량 및 메모리 사용량 추적

### 3. 디버깅 팁

```typescript
// 구조화된 로깅 사용
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  requestId: 'req_123',
  action: 'youtube_extract',
  url: 'https://youtube.com/...',
  duration: 1500,
  success: true
}));
```

## Next Steps

1. **YouTube 추출기 구현**: `YouTubeExtractor` 클래스 완성
2. **네이버 블로그 추출기 구현**: `NaverBlogExtractor` 클래스 완성
3. **HTML 파싱 로직**: linkedom을 사용한 파싱 구현
4. **에러 처리 강화**: 더 세밀한 에러 분류 및 처리
5. **캐싱 구현**: Cloudflare KV를 사용한 결과 캐싱
6. **레이트 리밋**: IP별 요청 제한 구현
7. **모니터링 강화**: 상세한 메트릭 수집 및 알림

## Troubleshooting

### 일반적인 문제들

1. **CORS 에러**: `cors()` 미들웨어가 올바르게 설정되었는지 확인
2. **타임아웃**: 네트워크 요청 타임아웃 설정 확인
3. **메모리 부족**: 대용량 콘텐츠 처리 시 스트리밍 사용
4. **파싱 실패**: HTML 구조 변경 시 선택자 업데이트 필요

### 디버깅 체크리스트

- [ ] URL 형식이 올바른가?
- [ ] 네트워크 연결이 정상인가?
- [ ] HTML 구조가 예상과 같은가?
- [ ] 타임아웃 설정이 적절한가?
- [ ] 에러 로그에 유용한 정보가 있는가?

이 가이드를 따라 단계별로 구현하면 안정적이고 확장 가능한 콘텐츠 추출 API를 구축할 수 있습니다.
