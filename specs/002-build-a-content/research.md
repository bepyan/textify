# Research: Textify Content Extraction Tool

**Date**: 2025-09-27  
**Feature**: Content extraction from YouTube videos and Naver blogs  
**Status**: Complete

## Research Tasks

### 1. YouTube Content Extraction Methods

**Decision**: YouTube Data API v3 + 자막 추출 라이브러리 조합 사용

**Rationale**:

- YouTube Data API v3는 공식 API로 안정적이고 신뢰할 수 있음
- 자막 데이터는 별도 엔드포인트를 통해 접근 가능
- Cloudflare Workers 환경에서 fetch API로 직접 호출 가능

**Alternatives considered**:

- youtube-dl/yt-dlp: 서버리스 환경에서 실행 어려움
- 웹 스크래핑: YouTube의 동적 로딩과 보안 정책으로 인해 불안정
- 써드파티 API: 비용과 의존성 문제

**Implementation approach**:

- YouTube Data API로 비디오 정보 조회
- 자막 트랙 목록 확인 및 언어별 자막 다운로드
- 자막 파싱 (SRT/VTT 형식 지원)

### 2. Naver Blog Content Extraction

**Decision**: 웹 스크래핑 + DOM 파싱 방식 사용

**Rationale**:

- Naver 블로그는 공식 API가 제한적
- HTML 구조가 상대적으로 일관성 있음
- Cloudflare Workers에서 fetch + HTML 파싱 가능

**Alternatives considered**:

- Naver 검색 API: 블로그 본문 내용 제공하지 않음
- RSS 피드: 전체 내용 제공하지 않음
- 브라우저 자동화: 서버리스 환경에서 불가능

**Implementation approach**:

- HTML 콘텐츠 fetch
- DOM 파싱으로 본문 영역 추출
- 광고, 네비게이션 등 불필요한 요소 제거
- 텍스트 정리 및 포맷팅

### 3. Cloudflare Workers 통합 서빙 최적화

**Decision**: 단일 Worker에서 정적 자산 + API 통합 서빙

**Rationale**:

- Cloudflare Workers는 V8 런타임으로 Node.js 모듈 제한적
- 번들 크기 제한 (1MB compressed)
- 실행 시간 제한 (CPU time 50ms)
- 단일 배포 단위로 관리 복잡성 감소
- 콜드 스타트 최소화 (하나의 Worker만 웜업)

**Key considerations**:

- Hono로 정적 자산 라우팅 + API 라우팅 통합
- 빌드된 React SPA를 Worker 내부에 임베드
- fetch API 사용 (네이티브 지원)
- HTML 파싱을 위한 경량 라이브러리 필요
- 에러 처리 및 타임아웃 관리 중요

### 4. HTML 파싱 라이브러리 선택

**Decision**: HTMLRewriter API (Cloudflare 네이티브) + 백업으로 DOMParser

**Rationale**:

- HTMLRewriter는 Cloudflare Workers에서 최적화됨
- 스트리밍 방식으로 메모리 효율적
- 복잡한 DOM 조작 없이 텍스트 추출에 적합

**Alternatives considered**:

- cheerio: 번들 크기가 크고 Node.js 의존성
- jsdom: 서버리스 환경에서 무거움
- 정규식: HTML 파싱에 부적절하고 불안정

### 5. 에러 처리 및 사용자 경험

**Decision**: 단계별 에러 처리 + 사용자 친화적 메시지

**Key strategies**:

- URL 유효성 검사 (클라이언트 사이드)
- API 호출 실패 시 재시도 로직
- 타임아웃 처리 (3초 제한)
- 명확한 에러 메시지 제공

### 6. 성능 최적화 방안

**Decision**: 캐싱 + 병렬 처리 + 스트리밍

**Strategies**:

- Cloudflare Cache API 활용
- 자막 트랙 병렬 다운로드
- 스트리밍 응답으로 빠른 첫 바이트 시간

### 7. 보안 및 CORS 고려사항

**Decision**: 서버 사이드 프록시 + CORS 헤더 설정

**Implementation**:

- 모든 외부 API 호출은 백엔드에서 처리
- 적절한 CORS 헤더 설정
- 사용자 입력 검증 및 새니타이징

## Technical Dependencies

### Frontend

- React 19.1.1: 최신 기능 활용
- TanStack Router: 타입 안전한 라우팅
- Tailwind CSS: 빠른 스타일링
- Zod: 런타임 타입 검증

### Backend

- Hono 4.9.9: 경량 웹 프레임워크
- hono-openapi 1.0.8: OpenAPI 스키마 자동 생성 및 타입 추론
- @hono/swagger-ui 0.5.2: API 문서화 자동화 (개발 환경)
- YouTube Data API v3: 공식 YouTube API
- HTMLRewriter: Cloudflare 네이티브 HTML 파싱
- Zod: 스키마 검증 및 런타임 타입 체크

### Development & Runtime

- Bun: 고성능 JavaScript 런타임 및 패키지 매니저
- Vite: 빠른 개발 서버 및 번들러
- Bun native test: 빠른 테스트 실행 (Unit + Integration)
- React Testing Library: 컴포넌트 테스트
- Prettier: 코드 포맷팅
- TypeScript 5.x: 엄격한 타입 안전성

## Risk Assessment

### High Risk

- YouTube API 할당량 제한
- Naver 블로그 HTML 구조 변경

### Medium Risk

- Cloudflare Workers 실행 시간 제한
- 네트워크 지연으로 인한 타임아웃

### Low Risk

- 브라우저 호환성 문제
- 번들 크기 초과

### 8. Cloudflare Workers 통합 아키텍처 장점

**Decision**: 단일 Worker 배포로 프론트엔드 + 백엔드 통합

**주요 장점**:

- **단순한 배포**: 하나의 `wrangler deploy` 명령으로 전체 애플리케이션 배포
- **콜드 스타트 최소화**: 하나의 Worker만 웜업하면 됨
- **네트워크 지연 감소**: 정적 자산과 API가 같은 엣지 로케이션에서 서빙
- **관리 복잡성 감소**: 단일 배포 단위, 단일 도메인, 단일 로그
- **비용 효율성**: Cloudflare Pages 별도 요금 없음

**구현 방식**:

- Hono 라우터로 `/api/*` 경로는 API 처리
- 나머지 경로는 빌드된 React SPA 정적 파일 서빙
- Vite 빌드 결과를 Worker 번들에 포함

### 9. 테스트 전략 및 Colocation 원칙

**Decision**: Vitest + Bun 기반 Unit/Integration 테스트, E2E 테스트 제외

**Rationale**:

- 개인 프로젝트 특성상 E2E 테스트는 과도한 복잡성 추가
- Colocation 원칙으로 테스트 파일과 소스 파일을 함께 배치
- 유지보수성 향상: 코드 변경 시 관련 테스트를 쉽게 찾고 수정 가능
- Vitest는 Vite와 완벽 호환되며 Bun 런타임에서 빠른 실행

**테스트 구조**:

```
src/utils/url-parser.ts      # 소스 파일
src/utils/url-parser.test.ts # 테스트 파일 (같은 디렉토리)
```

**테스트 범위**:

- Unit 테스트: 유틸리티 함수, 추출 로직, 검증 스키마
- Integration 테스트: API 엔드포인트, 서비스 레이어
- Component 테스트: React 컴포넌트 (React Testing Library)

## Next Steps

1. Phase 1에서 데이터 모델 및 API 계약 정의
2. YouTube Data API 키 설정 및 테스트
3. HTML 파싱 로직 프로토타입 개발
4. 에러 처리 시나리오 정의
5. Hono 통합 라우팅 구조 설계
