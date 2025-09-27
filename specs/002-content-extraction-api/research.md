# Research: Content Extraction API

**Feature**: Content Extraction API  
**Date**: 2025-09-27  
**Status**: Complete  

## Research Overview

Cloudflare Workers 환경에서 YouTube와 네이버 블로그 콘텐츠를 추출하는 API를 구현하기 위한 기술 연구 결과입니다.

## HTML 파싱 라이브러리 선택

### Decision: linkedom 사용

**Rationale**: 
- Cloudflare Workers 환경에서 DOM API 호환성 제공
- 가벼운 크기로 Workers 번들 크기 제약에 적합
- jsdom보다 성능이 우수하고 메모리 효율적
- Node.js 의존성 없이 순수 JavaScript로 구현

**Alternatives considered**:
- **jsdom**: 너무 무겁고 Node.js 의존성 있음
- **cheerio**: 서버 사이드 jQuery 스타일이지만 DOM API 미지원
- **parse5**: HTML 파싱만 지원, DOM 조작 기능 부족

**Implementation**: `bun add linkedom`

## YouTube 데이터 추출 전략

### Decision: 웹 스크래핑 우선, YouTube Data API는 fallback

**Rationale**:
- YouTube Data API는 API 키 필요 및 할당량 제한
- 웹 스크래핑으로 기본 메타데이터 추출 가능
- API 키 없이도 동작하는 서비스 제공
- 할당량 초과 시 API로 fallback 가능

**Alternatives considered**:
- **YouTube Data API 우선**: API 키 관리 복잡성, 할당량 제한
- **yt-dlp 사용**: Cloudflare Workers에서 실행 불가
- **youtube-dl**: Python 기반으로 Workers 환경 부적합

**Implementation**:
1. 웹 스크래핑으로 `<script>` 태그에서 `ytInitialData` 추출
2. JSON 파싱하여 메타데이터 획득
3. 실패 시 YouTube Data API 사용 (환경변수로 API 키 제공 시)

## 네이버 블로그 스크래핑 전략

### Decision: iframe URL 직접 구성 및 콘텐츠 접근

**Rationale**:
- 네이버 블로그는 iframe으로 실제 콘텐츠 로드
- iframe URL 패턴: `https://blog.naver.com/PostView.naver?blogId={userId}&logNo={postId}`
- 기존 블로그 URL에서 blogId와 logNo 추출하여 iframe URL 직접 구성 가능
- iframe 내부 HTML에서 실제 포스트 내용 파싱

**URL 변환 로직**:
- 입력: `https://blog.naver.com/{userId}/{postId}`
- 추출: `userId` → `blogId`, `postId` → `logNo`
- 구성: `https://blog.naver.com/PostView.naver?blogId={blogId}&logNo={logNo}`

**Alternatives considered**:
- **메인 페이지에서 iframe src 추출**: 추가 HTTP 요청 필요, 성능상 비효율적
- **모바일 버전 사용**: 구조가 다르고 불안정
- **RSS 피드 사용**: 전체 콘텐츠 제공하지 않음

**Implementation**:
1. 블로그 URL에서 정규식으로 blogId와 logNo 추출
2. iframe URL 직접 구성: `PostView.naver?blogId={blogId}&logNo={logNo}`
3. iframe 페이지 요청하여 실제 HTML 획득
4. 제목, 본문, 작성일, 작성자 정보 파싱

## URL 파싱 패턴

### Decision: 정규식 기반 URL 패턴 매칭

**YouTube URL 패턴**:
```typescript
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:m\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
];
```

**네이버 블로그 URL 패턴**:
```typescript
const NAVER_BLOG_PATTERN = /(?:https?:\/\/)?blog\.naver\.com\/([^\/]+)\/(\d+)/;

// URL 변환 함수
function convertToIframeUrl(blogId: string, logNo: string): string {
  return `https://blog.naver.com/PostView.naver?blogId=${blogId}&logNo=${logNo}`;
}
```

**Rationale**:
- 다양한 URL 형식 지원 (http/https, www 유무, 모바일 버전)
- 정규식으로 빠른 매칭 및 파라미터 추출 (blogId, logNo)
- iframe URL 직접 구성으로 성능 최적화 (메인 페이지 요청 생략)
- URL 정규화를 통한 일관된 처리

## 에러 처리 전략

### Decision: 계층적 에러 처리 및 사용자 친화적 메시지

**Error Types**:
```typescript
enum ExtractionErrorType {
  INVALID_URL = 'INVALID_URL',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  CONTENT_NOT_FOUND = 'CONTENT_NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  TIMEOUT = 'TIMEOUT'
}
```

**Rationale**:
- 에러 타입별 적절한 HTTP 상태 코드 매핑
- 사용자에게 명확한 에러 메시지 제공
- 내부 로깅용 상세 정보와 외부 응답 분리
- 재시도 가능한 에러와 영구적 에러 구분

## 성능 최적화 전략

### Decision: 스트리밍 및 조기 종료 패턴

**Strategies**:
1. **스트리밍 응답 처리**: 대용량 HTML 페이지 메모리 효율적 처리
2. **조기 종료**: 필요한 데이터 추출 즉시 파싱 중단
3. **타임아웃 설정**: 5초 타임아웃으로 Workers 제한 준수
4. **콘텐츠 크기 제한**: YouTube 설명 5KB, 블로그 본문 50KB 제한
5. **네이버 블로그 최적화**: iframe URL 직접 구성으로 메인 페이지 요청 생략

**Rationale**:
- Cloudflare Workers CPU 시간 50ms 제한 준수
- 메모리 사용량 최적화로 안정성 확보
- 사용자 경험 향상 (빠른 응답)

## 보안 고려사항

### Decision: 입력 검증 및 새니타이제이션

**Security Measures**:
1. **URL 검증**: 허용된 도메인만 접근 (youtube.com, naver.com)
2. **입력 새니타이제이션**: XSS 방지를 위한 HTML 이스케이프
3. **CORS 정책**: 적절한 CORS 헤더 설정
4. **레이트 리밋**: IP별 요청 제한 (향후 구현)

**Rationale**:
- SSRF 공격 방지
- XSS 공격 방지
- 서비스 남용 방지

## 의존성 추가 계획

### Required Dependencies

```json
{
  "linkedom": "^0.16.0",
  "html-entities": "^2.4.0"
}
```

**linkedom**: DOM API 호환 HTML 파싱  
**html-entities**: HTML 엔티티 디코딩

### Optional Dependencies (환경변수 기반)

```json
{
  "@google-cloud/youtube": "^4.0.0"
}
```

**@google-cloud/youtube**: YouTube Data API 클라이언트 (API 키 있을 때만)

## 모니터링 및 로깅

### Decision: 구조화된 JSON 로깅

**Log Structure**:
```typescript
interface LogEntry {
  timestamp: string;
  requestId: string;
  level: 'info' | 'warn' | 'error';
  action: string;
  platform: 'youtube' | 'naver-blog';
  url: string;
  duration: number;
  success: boolean;
  error?: string;
}
```

**Rationale**:
- 요청별 추적 가능
- 성능 모니터링 데이터 수집
- 에러 패턴 분석 가능
- Cloudflare Analytics와 연동 가능

## 캐싱 전략 (향후 구현)

### Decision: Cloudflare KV 사용 (Phase 2)

**Caching Strategy**:
- YouTube 메타데이터: 1시간 캐시
- 네이버 블로그 포스트: 30분 캐시
- 에러 응답: 5분 캐시 (429, 404 등)

**Rationale**:
- API 호출 횟수 감소
- 응답 시간 개선
- 대상 사이트 부하 감소

## 테스트 전략

### Decision: 계층별 테스트 접근

**Test Layers**:
1. **Unit Tests**: 개별 함수 및 클래스 테스트
2. **Integration Tests**: API 엔드포인트 테스트
3. **Contract Tests**: API 스키마 검증
4. **E2E Tests**: 실제 URL로 전체 플로우 테스트

**Mock Strategy**:
- 외부 HTTP 요청은 모킹
- 실제 HTML 샘플로 파싱 로직 테스트
- 에러 시나리오 시뮬레이션

## Implementation Roadmap

### Phase 1: Core Implementation
1. BaseExtractor 추상 클래스
2. YouTubeExtractor 구현
3. NaverBlogExtractor 구현
4. URL 파서 유틸리티
5. 에러 처리 시스템

### Phase 2: API Integration
1. Hono 라우트 구현
2. OpenAPI 스키마 정의
3. 입력 검증 미들웨어
4. 에러 핸들링 미들웨어

### Phase 3: Testing & Documentation
1. 단위 테스트 작성
2. 통합 테스트 작성
3. API 문서화
4. 성능 테스트

## Conclusion

모든 기술적 의사결정이 완료되었으며, Cloudflare Workers 환경의 제약사항을 고려한 실용적인 접근 방식을 선택했습니다. 웹 스크래핑 기반의 안정적인 콘텐츠 추출 시스템을 구축할 수 있는 기반이 마련되었습니다.
