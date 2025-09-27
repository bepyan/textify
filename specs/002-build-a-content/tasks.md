# Tasks: Textify Content Extraction Tool

**Input**: Design documents from `/specs/002-build-a-content/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓)

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x, React 19.1.1, Hono 4.9.9, Bun runtime
   → Structure: Cloudflare Workers 통합 서빙, Colocation 테스트
2. Load design documents:
   → data-model.md: 8 entities (URL, ExtractedContent, ContentMetadata, etc.)
   → contracts/: 3 API endpoints (/api/extract, /api/validate, /api/health)
   → research.md: YouTube API, Naver 스크래핑, Bun native test
3. Generate tasks by category:
   → Setup: Bun 프로젝트, 의존성, 린팅, Bun test 설정
   → Tests: API 계약 테스트, 통합 테스트 (colocation)
   → Core: 타입 정의, 추출기, 서비스, API 라우트
   → Integration: Hono 라우팅, 정적 자산 서빙
   → Polish: 단위 테스트, 성능 최적화, PWA 설정
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:

- **Frontend**: `src/frontend/` (React SPA)
- **Worker**: `src/worker/` (Hono API)
- **Tests**: Colocation principle (\*.test.ts files alongside source)

## Phase 3.1: Setup

- [x] T001 Create project structure per implementation plan with colocation test structure
- [x] T002 Initialize Bun project with TypeScript 5.x strict mode and all dependencies
- [x] T003 [P] Configure Prettier + ESLint with organize imports plugin using ESLint flat config **[COMPLETED]**
- [x] T004 [P] Configure Bun native test with TypeScript support **[COMPLETED]**
- [x] T005 [P] Setup Tailwind CSS 4.1.13 configuration in tailwind.config.js **[COMPLETED]**
- [x] T006 [P] Configure Vite with React SWC and TanStack Router plugin in vite.config.ts
- [x] T007 [P] Setup Wrangler configuration for Cloudflare Workers in wrangler.json

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
**Constitution Requirement: 핵심 기능 테스트 커버리지 (60% 이상 권장), TDD 권장**

### API Contract Tests (Colocation)

- [x] T008 [P] Contract test POST /api/extract in src/worker/routes/api.test.ts **[COMPLETED]**
- [x] T009 [P] Contract test POST /api/validate in src/worker/routes/api.test.ts **[COMPLETED]**
- [x] T010 [P] Contract test GET /api/health in src/worker/routes/index.test.ts **[COMPLETED]**

### Core Logic Tests (Colocation)

- [x] T011 [P] URL parser unit tests in src/frontend/utils/url-parser.test.ts **[ALREADY EXISTS]**
- [x] T012 [P] Text cleaner unit tests in src/frontend/utils/text-cleaner.test.ts **[ALREADY EXISTS]**
- [x] T013 [P] YouTube extractor unit tests in src/worker/lib/extractors/youtube.test.ts **[COMPLETED]**
- [x] T014 [P] Naver extractor unit tests in src/worker/lib/extractors/naver.test.ts **[COMPLETED]**
- [x] T015 [P] Zod schema validation tests in src/worker/lib/validators/schemas.test.ts **[COMPLETED]**
- [x] T016 [P] HTML parser utility tests in src/worker/lib/utils/html-parser.test.ts **[COMPLETED]**

### Integration Tests (Colocation)

- [x] T017 [P] YouTube extraction integration test in src/frontend/services/youtube.test.ts **[COMPLETED]**
- [x] T018 [P] Naver extraction integration test in src/frontend/services/naver.test.ts **[COMPLETED]**
- [x] T019 [P] API client integration test in src/frontend/services/api.test.ts **[COMPLETED]**

### Component Tests (Colocation)

- [x] T020 [P] Content extractor component test in src/frontend/components/content-extractor/extractor.test.tsx **[COMPLETED]**
- [x] T021 [P] UI button component test in src/frontend/components/ui/button.test.tsx **[COMPLETED]**

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**Constitution Requirements: TypeScript strict mode, 유틸 함수 순수성 및 단일 책임 원칙 준수**

### Type Definitions

- [x] T022 [P] Core TypeScript interfaces in src/worker/types/index.ts **[COMPLETED]**
- [x] T023 [P] Frontend TypeScript interfaces in src/frontend/types/index.ts **[COMPLETED]**

### Utility Functions

- [x] T024 [P] URL parser utility with validation in src/frontend/utils/url-parser.ts **[ALREADY EXISTS]**
- [x] T025 [P] Text cleaner utility functions in src/frontend/utils/text-cleaner.ts **[ALREADY EXISTS]**
- [x] T026 [P] HTML parser utility for Cloudflare Workers in src/worker/lib/utils/html-parser.ts **[COMPLETED]**

### Validation Schemas

- [x] T027 [P] Zod schemas for API validation in src/worker/lib/validators/schemas.ts **[COMPLETED]**

### Content Extractors

- [x] T028 [P] YouTube extractor with Data API v3 in src/worker/lib/extractors/youtube.ts **[COMPLETED]**
- [x] T029 [P] Naver blog extractor with HTML parsing in src/worker/lib/extractors/naver.ts **[COMPLETED]**

### API Services (Frontend)

- [ ] T030 [P] API client configuration in src/frontend/services/api.ts
- [ ] T031 [P] YouTube service layer in src/frontend/services/youtube.ts
- [ ] T032 [P] Naver service layer in src/frontend/services/naver.ts

### React Components

- [ ] T033 [P] UI button component with Tailwind in src/frontend/components/ui/button.tsx
- [ ] T034 Content extractor main component in src/frontend/components/content-extractor/extractor.tsx
- [ ] T035 Layout components in src/frontend/components/layout/

### API Routes (Worker)

- [x] T036 POST /api/extract endpoint with hono-openapi in src/worker/routes/api.ts **[COMPLETED]**
- [x] T037 POST /api/validate endpoint with URL validation in src/worker/routes/api.ts **[COMPLETED]**
- [x] T038 GET /api/health endpoint in src/worker/routes/index.ts **[COMPLETED]**

### TanStack Router Pages

- [x] T039 [P] Root layout component in src/frontend/routes/\_\_root.tsx
- [x] T040 Main extraction page in src/frontend/routes/index.tsx **[COMPLETED - 콘텐츠 추출 UI 구현 완료]**
- [x] T041 [P] About page in src/frontend/routes/about.tsx

## Phase 3.4: Integration

- [ ] T042 Hono app setup with OpenAPI integration in src/worker/index.ts (기본 구조만 완성)
- [ ] T043 Static asset serving middleware for React SPA in src/worker/index.ts
- [ ] T044 CORS and security headers middleware in src/worker/index.ts (기본 CORS만 설정됨)
- [ ] T045 Error handling middleware with structured logging in src/worker/index.ts
- [x] T046 React app initialization with TanStack Router in src/frontend/main.tsx
- [x] T047 Global CSS and Tailwind imports in src/frontend/styles/global.css

## Phase 3.5: Polish

- [ ] T048 [P] PWA manifest and service worker configuration in public/
- [ ] T049 [P] Performance optimization: code splitting and lazy loading
- [ ] T050 [P] Accessibility improvements: ARIA labels and keyboard navigation
- [ ] T051 [P] Error boundary component for React error handling
- [ ] T052 [P] Loading states and skeleton components
- [ ] T053 [P] Responsive design testing and mobile optimization
- [ ] T054 Bundle size optimization and tree shaking verification
- [ ] T055 Run quickstart.md validation scenarios

## Dependencies

### Critical Path

- Setup (T001-T007) → Tests (T008-T021) → Implementation (T022-T041) → Integration (T042-T047) → Polish (T048-T055)

### Specific Dependencies

- T008-T010 (API tests) block T036-T038 (API implementation)
- T011-T016 (utility tests) block T024-T029 (utility implementation)
- T017-T019 (service tests) block T030-T032 (service implementation)
- T020-T021 (component tests) block T033-T035, T039-T041 (component implementation)
- T022-T023 (types) must complete before any implementation using those types
- T042-T047 (integration) requires all core implementation to be complete

## Parallel Example

### Phase 3.2 - All Tests (can run simultaneously)

```bash
# Launch T008-T021 together (all test files):
bun test src/worker/routes/api.test.ts        # T008-T009
bun test src/worker/routes/index.test.ts      # T010
bun test src/frontend/utils/url-parser.test.ts # T011
bun test src/frontend/utils/text-cleaner.test.ts # T012
bun test src/worker/lib/extractors/youtube.test.ts # T013
bun test src/worker/lib/extractors/naver.test.ts # T014
# ... all other test files (using bun native test runner)
```

### Phase 3.3 - Parallel Implementation Groups

```bash
# Group 1: Type definitions (T022-T023)
# Group 2: Utilities (T024-T026)
# Group 3: Schemas (T027)
# Group 4: Extractors (T028-T029)
# Group 5: Services (T030-T032)
# Group 6: Components (T033, T035, T039-T041)
```

## 🚨 현재 상황 및 우선순위 (2025-09-27)

### ✅ 완료된 주요 작업

- 기본 프로젝트 구조 및 의존성 설치
- TanStack Router 기본 설정 및 라우트 구조
- Hono API 기본 구조 (라우팅 설정)
- 설계 문서 완성 (plan.md, data-model.md, research.md, contracts, quickstart.md)

### 🔥 즉시 필요한 작업 (다음 단계)

1. **T003-T005**: 개발 환경 설정 완료 (Prettier, ESLint, Vitest, Tailwind)
2. **T008-T021**: TDD 테스트 파일 생성 (모든 테스트 파일 미생성 상태)
3. **T022-T023**: TypeScript 타입 정의 (핵심 인터페이스 미구현)
4. **T036-T038**: API 엔드포인트 구현 (현재 기본 구조만 있음)
5. **T040**: 메인 콘텐츠 추출 UI 구현 (현재 기본 페이지만 있음)

### ⚠️ 주요 미구현 영역

- **콘텐츠 추출 로직**: YouTube/Naver 추출기 완전 미구현
- **API 엔드포인트**: /api/extract, /api/validate 미구현
- **프론트엔드 UI**: 콘텐츠 추출 인터페이스 미구현
- **모든 테스트 파일**: TDD 원칙에 따라 테스트부터 작성 필요

### 📋 권장 작업 순서

1. 개발 환경 설정 완료 (T003-T005)
2. 타입 정의 우선 구현 (T022-T023)
3. TDD 테스트 파일 생성 (T008-T021)
4. 핵심 로직 구현 (T024-T032, T036-T038)
5. UI 컴포넌트 완성 (T033-T035, T040)

## Notes

- [P] tasks = different files, no dependencies
- All tests must fail before implementing (TDD requirement)
- Use Bun for all package management and test execution
- Follow colocation principle: keep \*.test.ts files next to source files
- Commit after each task completion
- Maintain TypeScript strict mode throughout
- Ensure all utilities are pure functions following single responsibility principle

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts** (api-schema.yaml):
   - 3 endpoints → 3 contract test tasks [P] (T008-T010)
   - 3 endpoints → 3 implementation tasks (T036-T038)

2. **From Data Model** (data-model.md):
   - 8 entities → TypeScript interface tasks [P] (T022-T023)
   - Core entities → extractor implementation (T028-T029)

3. **From User Stories** (quickstart.md):
   - YouTube extraction scenario → integration test (T017)
   - Naver extraction scenario → integration test (T018)
   - Error handling scenarios → validation test (T015)

4. **From Research** (research.md):
   - YouTube Data API → YouTube extractor (T028)
   - Naver HTML parsing → Naver extractor (T029)
   - Bun native test → test configuration (T004)

## Validation Checklist

_GATE: Checked before execution_

- [x] All contracts have corresponding tests (T008-T010 → T036-T038)
- [x] All entities have model tasks (8 entities → T022-T023)
- [x] All tests come before implementation (Phase 3.2 → Phase 3.3)
- [x] Parallel tasks truly independent (different files, no shared state)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Colocation principle applied (\*.test.ts alongside source files)
- [x] TDD workflow enforced (tests must fail before implementation)

- [x] No task modifies same file as another [P] task
- [x] Colocation principle applied (\*.test.ts alongside source files)
- [x] TDD workflow enforced (tests must fail before implementation)
