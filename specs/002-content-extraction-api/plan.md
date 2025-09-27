# Implementation Plan: Content Extraction API

**Branch**: `002-content-extraction-api` | **Date**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-content-extraction-api/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Cloudflare Workers 환경에서 YouTube와 네이버 블로그 콘텐츠를 추출하는 API 엔드포인트들을 구현합니다. URL 파싱, 데이터 추출, 에러 처리를 포함하여 안정적이고 확장 가능한 콘텐츠 추출 서비스를 제공합니다. 사용자 제공 요구사항: Cloudflare Workers 환경에서 YouTube와 네이버 블로그 콘텐츠를 추출하는 API 엔드포인트들을 구현해주세요. URL 파싱, 데이터 추출, 에러 처리를 포함해주세요.

## Technical Context

**Language/Version**: TypeScript 5.x (Cloudflare Workers 런타임)  
**Primary Dependencies**: Hono 4.9.9 (기존 웹 프레임워크), @hono/standard-validator (검증), hono-openapi (API 문서화), HTML 파싱 라이브러리 (추가 필요)  
**Storage**: N/A (상태 없는 API, 향후 Cloudflare KV 고려)  
**Testing**: Vitest (기존 설정), Playwright (기존 설정)  
**Target Platform**: Cloudflare Workers (Edge Runtime, 기존 설정 완료)
**Project Type**: web (기존 frontend + worker API 확장)  
**Performance Goals**: 응답 시간 < 5초 (95th percentile), < 3초 (평균)  
**Constraints**: Workers CPU 시간 50ms, 총 실행 시간 30초, 메모리 효율성, 외부 API 호출 제한  
**Scale/Scope**: 3개 새로운 API 엔드포인트 (/api/extract/*), 2개 플랫폼 지원 (YouTube, 네이버 블로그)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Code Quality & Readability

- [x] TypeScript 엄격 모드 활성화 확인 - 기존 tsconfig.json 확인됨, 엄격 모드 활성화
- [x] ESLint/Prettier 설정 구성 - 기존 프로젝트에 설정 완료 (package.json 확인)
- [x] 함수/파일 크기 제한 준수 계획 - 추출기별 모듈 분리 (base-extractor, youtube-extractor, naver-blog-extractor), 함수당 20줄 제한
- [x] 네이밍 컨벤션 적용 방안 - camelCase 변수, PascalCase 클래스/인터페이스, kebab-case 파일명
- [x] 매직 넘버 명명된 상수로 대체 계획 - TIMEOUT_MS, MAX_CONTENT_SIZE, RETRY_ATTEMPTS 등 상수 정의
- [x] 복잡한 조건문 명명된 변수로 분리 계획 - isValidYouTubeUrl, isValidNaverBlogUrl, shouldRetryRequest 등
- [x] 구현 세부사항 추상화 방안 - BaseExtractor 추상 클래스, 플랫폼별 구현체, URL 파서 유틸리티

### Business Logic Testing

- [x] TDD 접근법 적용 계획 (비즈니스 로직에 집중) - 추출 로직, URL 파싱, 에러 처리 우선
- [x] 테스트 대상 식별: API 엔드포인트, 데이터 처리 로직, 핵심 비즈니스 규칙 - URL 파싱, 콘텐츠 추출, 에러 처리
- [x] 테스트 계층 구조 정의: **Colocation 방식 적용** - 단위/통합 테스트는 관련 코드와 함께 배치, Contract/E2E 테스트만 별도 관리
- [x] API contract 테스트 계획 - OpenAPI 스키마 기반 contract 테스트 (tests/contract/ 디렉토리)
- [x] 프론트엔드 컴포넌트 테스트 필요성 검토 (복잡한 상태 로직이 있는 경우만) - 이번 기능은 API만 구현

### Frontend Architecture & UX

- [x] 디자인 시스템 컴포넌트 사용 계획 - N/A (이번 기능은 API만 구현)
- [x] 접근성(a11y) 요구사항 확인 - N/A (이번 기능은 API만 구현)
- [x] 반응형 디자인 적용 방안 - N/A (이번 기능은 API만 구현)
- [x] 일관된 상태 UI 패턴 정의 - N/A (이번 기능은 API만 구현)
- [x] 조건부 렌더링 분리 계획 - N/A (이번 기능은 API만 구현)
- [x] Props drilling 방지 방안 (컴포넌트 컴포지션) - N/A (이번 기능은 API만 구현)
- [x] 일관된 반환 타입 사용 계획 - API 응답 타입 일관성 보장

### Performance & UX Excellence

- [x] Core Web Vitals 기준 준수 계획 (LCP < 2.5s, FID < 100ms, CLS < 0.1) - N/A (API 응답 시간 최적화에 집중)
- [x] 번들 크기 최적화 계획 (코드 스플리팅, 트리 쉐이킹) - Workers 번들 크기 최적화
- [x] 이미지 최적화 및 lazy loading 적용 - N/A (이미지 처리 없음)
- [x] 메모리 누수 방지 계획 - 스트리밍 처리, 적절한 리소스 정리

### Code Organization & Maintainability

- [x] 기능/도메인별 디렉토리 구조 계획 - @be/extractors/, @be/types/, @be/utils/ (colocation 적용)
- [x] 단일 책임 원칙 적용 방안 - 플랫폼별 추출기, URL 파서, 에러 핸들러 분리
- [x] 고유하고 설명적인 이름 사용 계획 - YouTubeExtractor, NaverBlogExtractor, ContentExtractionError
- [x] **테스트 colocation 전략** - 단위/통합 테스트를 관련 코드와 함께 배치하여 유지보수성 향상
- [x] 구조화된 로깅 계획 - JSON 형태 로그, 요청 ID 추적
- [x] 에러 추적 및 처리 방안 - 계층적 에러 처리, 사용자 친화적 메시지

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
src/
├── frontend/                    # 기존 React 프론트엔드 (TanStack Router + Vite)
│   ├── components/
│   ├── routes/
│   ├── hooks/
│   ├── lib/
│   └── styles/
├── worker/                      # Cloudflare Workers API (기존 Hono 기반)
│   ├── extractors/              # 새로운 콘텐츠 추출기들 (colocation 적용)
│   │   ├── base-extractor.ts    # 추상 기본 클래스
│   │   ├── base-extractor.test.ts # 단위 테스트 (colocation)
│   │   ├── youtube-extractor.ts # YouTube 추출기
│   │   ├── youtube-extractor.test.ts # 단위 테스트 (colocation)
│   │   ├── naver-blog-extractor.ts # 네이버 블로그 추출기
│   │   └── naver-blog-extractor.test.ts # 단위 테스트 (colocation)
│   ├── routes/                  # API 라우트 (기존 구조 확장)
│   │   ├── index.ts            # 기존 라우트 진입점 (CORS, 라우팅)
│   │   ├── api.ts              # 기존 API 라우트 (Swagger, 헬스체크)
│   │   ├── extract.ts          # 새로운 추출 API 라우트
│   │   └── extract.integration.test.ts # 통합 테스트 (colocation)
│   ├── types/                   # 새로운 타입 정의
│   │   ├── extraction.ts       # 추출 관련 타입
│   │   ├── extraction.test.ts  # 타입 검증 테스트 (colocation)
│   │   ├── errors.ts           # 에러 타입
│   │   └── errors.test.ts      # 에러 타입 테스트 (colocation)
│   ├── utils/                   # 새로운 유틸리티 함수 (colocation 적용)
│   │   ├── url-parser.ts       # URL 파싱 유틸
│   │   ├── url-parser.test.ts  # 단위 테스트 (colocation)
│   │   ├── html-parser.ts      # HTML 파싱 유틸
│   │   ├── html-parser.test.ts # 단위 테스트 (colocation)
│   │   ├── logger.ts           # 로깅 유틸
│   │   └── logger.test.ts      # 단위 테스트 (colocation)
│   └── index.ts                # Worker 진입점 (기존, Hono 앱 초기화)
└── types/                      # 공통 타입 정의 (기존)

tests/                          # 별도 관리가 필요한 테스트만 유지
├── contract/                   # API 계약 테스트 (별도 유지)
│   ├── youtube-extract.contract.test.ts
│   ├── naver-blog-extract.contract.test.ts
│   └── auto-extract.contract.test.ts
└── e2e/                       # E2E 테스트 (별도 유지)
    └── extraction-flow.e2e.test.ts
```

**Structure Decision**: Web application 구조 (Option 2) 선택. 기존 frontend(@fe/*)와 worker(@be/*) 구조를 유지하면서 새로운 콘텐츠 추출 기능을 worker에 추가. 기존 Hono 기반 API 구조를 확장하여 /api/extract/* 엔드포인트 추가. **테스트 전략**: Colocation 방식 적용 - 단위 테스트와 통합 테스트는 관련 코드와 같은 디렉토리에 배치하여 유지보수성 향상. Contract 테스트와 E2E 테스트만 별도 디렉토리에서 관리. 기능별 모듈화를 통해 단일 책임 원칙과 확장성 확보.

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh cursor`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy** (Colocation 적용):

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- **단위 테스트**: 각 모듈과 함께 colocation 적용 (예: `base-extractor.ts` + `base-extractor.test.ts`)
- **통합 테스트**: 관련 라우트와 함께 배치 (예: `extract.ts` + `extract.integration.test.ts`)
- **Contract 테스트**: 별도 디렉토리 유지 (`tests/contract/`)
- **E2E 테스트**: 별도 디렉토리 유지 (`tests/e2e/`)
- Implementation tasks to make tests pass

**Concrete Task Sequence** (우선순위 순):

1. **Foundation Layer** (타입 시스템 구축)
   - 참조: `data-model.md` 섹션 2 "Core Entities"
   - 계약 테스트: `auto-extract.contract.test.ts` 라인 17-82
   - 파일: `@be/types/extraction.ts`, `@be/types/errors.ts`

2. **Utility Layer** (공통 유틸리티)
   - 참조: `data-model.md` 섹션 "URL Pattern Mapping"
   - 계약 테스트: `auto-extract.contract.test.ts` 라인 166-186
   - 파일: `@be/utils/url-parser.ts` + colocation 테스트

3. **Extractor Layer** (추출기 구현)
   - 참조: `quickstart.md` Step 4-5, `data-model.md` 섹션 3-4
   - 계약 테스트: `youtube-extract.contract.test.ts`, `naver-blog-extract.contract.test.ts`
   - 파일: `@be/extractors/base-extractor.ts` → 플랫폼별 추출기들

4. **API Layer** (라우트 구현)
   - 참조: `quickstart.md` Step 5-6, `openapi.yaml`
   - 계약 테스트: 모든 contract 테스트 통과
   - 파일: `@be/routes/extract.ts` → `@be/routes/api.ts` 통합

**Implementation Dependency Chain**:
```
types/extraction.ts → utils/url-parser.ts → extractors/base-extractor.ts → 
extractors/youtube-extractor.ts → extractors/naver-blog-extractor.ts → 
routes/extract.ts → routes/api.ts (integration)
```

**Ordering Strategy** (Colocation 고려):

- TDD order: Tests before implementation (같은 디렉토리 내에서)
- Dependency order: Foundation → Utility → Extractor → API
- Mark [P] for parallel execution (서로 다른 기능 모듈)
- Colocation된 테스트는 해당 모듈 구현과 함께 순차 실행

**Validation Checkpoints**:
- 체크포인트 1: 타입 시스템 완성 (Zod 스키마 검증 통과)
- 체크포인트 2: URL 파싱 완성 (모든 패턴 테스트 통과)
- 체크포인트 3: 추출기 완성 (단위 테스트 통과)
- 체크포인트 4: API 통합 완성 (계약 테스트 통과)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command) - research.md 생성 완료
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md 생성 완료
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 아래 섹션에 설명
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS - 모든 헌법 요구사항 충족, 복잡성 위반 없음
- [x] Post-Design Constitution Check: PASS - 설계 완료 후 헌법 재검토 완료
- [x] All NEEDS CLARIFICATION resolved - Feature spec에 Clarifications 섹션 존재
- [x] Complexity deviations documented - 복잡성 위반 없음

---

_Based on Constitution v1.2.0 - See `.specify/memory/constitution.md`_
