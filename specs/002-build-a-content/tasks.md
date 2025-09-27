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
   → research.md: YouTube API, Naver 스크래핑, Vitest + Bun 테스트
3. Generate tasks by category:
   → Setup: Bun 프로젝트, 의존성, 린팅, Vitest 설정
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

- [ ] T001 Create project structure per implementation plan with colocation test structure
- [ ] T002 Initialize Bun project with TypeScript 5.x strict mode and all dependencies
- [ ] T003 [P] Configure Prettier + ESLint with organize imports plugin in .eslintrc.js
- [ ] T004 [P] Configure Vitest with Bun runtime in vitest.config.ts
- [ ] T005 [P] Setup Tailwind CSS 4.1.13 configuration in tailwind.config.js
- [ ] T006 [P] Configure Vite with React SWC and TanStack Router plugin in vite.config.ts
- [ ] T007 [P] Setup Wrangler configuration for Cloudflare Workers in wrangler.json

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
**Constitution Requirement: 핵심 기능 테스트 커버리지 (60% 이상 권장), TDD 권장**

### API Contract Tests (Colocation)

- [ ] T008 [P] Contract test POST /api/extract in src/worker/routes/api.test.ts
- [ ] T009 [P] Contract test POST /api/validate in src/worker/routes/api.test.ts
- [ ] T010 [P] Contract test GET /api/health in src/worker/routes/index.test.ts

### Core Logic Tests (Colocation)

- [ ] T011 [P] URL parser unit tests in src/frontend/utils/url-parser.test.ts
- [ ] T012 [P] Text cleaner unit tests in src/frontend/utils/text-cleaner.test.ts
- [ ] T013 [P] YouTube extractor unit tests in src/worker/lib/extractors/youtube.test.ts
- [ ] T014 [P] Naver extractor unit tests in src/worker/lib/extractors/naver.test.ts
- [ ] T015 [P] Zod schema validation tests in src/worker/lib/validators/schemas.test.ts
- [ ] T016 [P] HTML parser utility tests in src/worker/lib/utils/html-parser.test.ts

### Integration Tests (Colocation)

- [ ] T017 [P] YouTube extraction integration test in src/frontend/services/youtube.test.ts
- [ ] T018 [P] Naver extraction integration test in src/frontend/services/naver.test.ts
- [ ] T019 [P] API client integration test in src/frontend/services/api.test.ts

### Component Tests (Colocation)

- [ ] T020 [P] Content extractor component test in src/frontend/components/content-extractor/extractor.test.tsx
- [ ] T021 [P] UI button component test in src/frontend/components/ui/button.test.tsx

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**Constitution Requirements: TypeScript strict mode, 유틸 함수 순수성 및 단일 책임 원칙 준수**

### Type Definitions

- [ ] T022 [P] Core TypeScript interfaces in src/worker/types/index.ts
- [ ] T023 [P] Frontend TypeScript interfaces in src/frontend/types/index.ts

### Utility Functions

- [ ] T024 [P] URL parser utility with validation in src/frontend/utils/url-parser.ts
- [ ] T025 [P] Text cleaner utility functions in src/frontend/utils/text-cleaner.ts
- [ ] T026 [P] HTML parser utility for Cloudflare Workers in src/worker/lib/utils/html-parser.ts

### Validation Schemas

- [ ] T027 [P] Zod schemas for API validation in src/worker/lib/validators/schemas.ts

### Content Extractors

- [ ] T028 [P] YouTube extractor with Data API v3 in src/worker/lib/extractors/youtube.ts
- [ ] T029 [P] Naver blog extractor with HTML parsing in src/worker/lib/extractors/naver.ts

### API Services (Frontend)

- [ ] T030 [P] API client configuration in src/frontend/services/api.ts
- [ ] T031 [P] YouTube service layer in src/frontend/services/youtube.ts
- [ ] T032 [P] Naver service layer in src/frontend/services/naver.ts

### React Components

- [ ] T033 [P] UI button component with Tailwind in src/frontend/components/ui/button.tsx
- [ ] T034 Content extractor main component in src/frontend/components/content-extractor/extractor.tsx
- [ ] T035 Layout components in src/frontend/components/layout/

### API Routes (Worker)

- [ ] T036 POST /api/extract endpoint with hono-openapi in src/worker/routes/api.ts
- [ ] T037 POST /api/validate endpoint with URL validation in src/worker/routes/api.ts
- [ ] T038 GET /api/health endpoint in src/worker/routes/index.ts

### TanStack Router Pages

- [ ] T039 [P] Root layout component in src/frontend/routes/\_\_root.tsx
- [ ] T040 [P] Main extraction page in src/frontend/routes/index.tsx
- [ ] T041 [P] About page in src/frontend/routes/about.tsx

## Phase 3.4: Integration

- [ ] T042 Hono app setup with OpenAPI integration in src/worker/index.ts
- [ ] T043 Static asset serving middleware for React SPA in src/worker/index.ts
- [ ] T044 CORS and security headers middleware in src/worker/index.ts
- [ ] T045 Error handling middleware with structured logging in src/worker/index.ts
- [ ] T046 React app initialization with TanStack Router in src/frontend/main.tsx
- [ ] T047 Global CSS and Tailwind imports in src/frontend/styles/global.css

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
# ... all other test files
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
   - Vitest + Bun → test configuration (T004)

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
