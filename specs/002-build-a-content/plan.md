# Implementation Plan: Textify Content Extraction Tool

**Branch**: `002-build-a-content` | **Date**: 2025-09-27 | **Spec**: [../001-build-a-content/spec.md](../001-build-a-content/spec.md)
**Input**: Feature specification from `/specs/001-build-a-content/spec.md`

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

웹 콘텐츠에서 깔끔한 텍스트만을 추출하는 도구 개발. YouTube 비디오의 자막과 네이버 블로그 포스트의 본문을 추출하여 사용자에게 광고나 불필요한 요소 없이 순수 텍스트만 제공. PWA로 구현하여 모바일 우선 반응형 디자인과 3초 이내 응답 시간을 목표로 함.

## Technical Context

**Language/Version**: TypeScript 5.x (엄격 모드), Bun 런타임 환경  
**Primary Dependencies**: React 19.1.1, Hono 4.9.9 + hono-openapi 1.0.8, TanStack Router 1.132.7, Tailwind CSS 4.1.13, Zod 4.1.11, @hono/swagger-ui 0.5.2  
**Storage**: 클라이언트 사이드 임시 저장 (세션 기반), 서버 사이드 무상태  
**Testing**: Vitest + Bun 런타임, React Testing Library, Hono 테스트 유틸리티, Colocation 원칙 (\*.test.ts)  
**Target Platform**: Cloudflare Workers (통합 서빙), 모든 모던 브라우저 (PWA), Bun 개발 환경
**Project Type**: web - 통합 Cloudflare Worker (프론트엔드 정적 자산 + Hono API)  
**Performance Goals**: API 응답 시간 < 3초, LCP < 4초, 번들 크기 최적화  
**Constraints**: Cloudflare Workers 런타임 제한, 외부 API 의존성 (YouTube, Naver), 서버리스 환경  
**Scale/Scope**: 개인 사용자 대상, 동시 사용자 수십 명, 2-3개 주요 화면

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Code Quality Gates

- [x] TypeScript 엄격 모드 활성화 확인 (tsconfig.json에서 엄격 모드 설정됨)
- [x] ESLint/Prettier 설정 구성 (package.json에 prettier 및 플러그인 설정됨)
- [x] 유틸 함수 순수성 및 단일 책임 원칙 준수 계획 (콘텐츠 추출 로직 분리)
- [x] 네이밍 컨벤션 적용 방안 (camelCase 변수, PascalCase 컴포넌트, 케밥케이스 파일명)

### Testing Requirements

- [x] TDD 접근법 적용 계획 (콘텐츠 추출 로직 우선 테스트 작성)
- [x] 핵심 기능 테스트 커버리지 계획 (YouTube/Naver 추출 로직 60% 이상)
- [x] 핵심 비즈니스 로직 및 유틸 함수 테스트 필수 (URL 파싱, 콘텐츠 추출, 에러 처리)
- [x] API contract 테스트 계획 (OpenAPI 스키마 기반 Hono 엔드포인트 테스트)

### UX Consistency

- [x] 디자인 시스템 컴포넌트 사용 계획 (Tailwind CSS 기반 일관된 컴포넌트 라이브러리)
- [x] 접근성(a11y) 요구사항 확인 (키보드 네비게이션, 스크린 리더 지원, 색상 대비)
- [x] 반응형 디자인 적용 방안 (모바일 우선, Tailwind 반응형 클래스 활용)
- [x] 일관된 상태 UI 패턴 정의 (로딩, 에러, 성공, 빈 상태 컴포넌트)

### Performance Standards

- [x] 프론트엔드 성능 목표 설정 (LCP < 4s, 콘텐츠 추출 응답 < 3s)
- [x] 백엔드 응답 시간 목표 (Cloudflare Workers 환경에서 평균 < 3s)
- [x] 번들 크기 최적화 계획 (Vite 코드 스플리팅, 불필요한 의존성 제거)
- [x] 기본적인 성능 모니터링 방안 (콘솔 로깅, Cloudflare Analytics)

### Observability

- [x] 기본적인 로깅 계획 (콘텐츠 추출 성공/실패, API 호출 로그)
- [x] 간단한 에러 추적 방안 (콘솔 에러 로깅, 사용자 친화적 에러 메시지)
- [x] 개발 환경 디버깅 도구 활용 계획 (Vite 개발 서버, React DevTools)
- [x] 최소한의 프로덕션 모니터링 방안 (Cloudflare Workers 로그, 기본 메트릭)

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
├── frontend/                    # React SPA (TanStack Router)
│   ├── main.tsx                # 애플리케이션 진입점
│   ├── routes/                 # 페이지 라우트
│   │   ├── __root.tsx         # 루트 레이아웃
│   │   ├── index.tsx          # 메인 콘텐츠 추출 페이지
│   │   └── about.tsx          # 정보 페이지
│   ├── components/            # 재사용 가능한 UI 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   │   ├── button.tsx
│   │   │   └── button.test.tsx
│   │   ├── content-extractor/ # 콘텐츠 추출 관련 컴포넌트
│   │   │   ├── extractor.tsx
│   │   │   └── extractor.test.tsx
│   │   └── layout/           # 레이아웃 컴포넌트
│   ├── services/             # API 클라이언트 및 비즈니스 로직
│   │   ├── api.ts           # API 클라이언트 설정
│   │   ├── api.test.ts      # API 클라이언트 테스트
│   │   ├── youtube.ts       # YouTube 관련 서비스
│   │   ├── youtube.test.ts  # YouTube 서비스 테스트
│   │   ├── naver.ts         # Naver 블로그 관련 서비스
│   │   └── naver.test.ts    # Naver 서비스 테스트
│   ├── types/               # TypeScript 타입 정의
│   ├── utils/               # 유틸리티 함수
│   │   ├── url-parser.ts
│   │   ├── url-parser.test.ts
│   │   ├── text-cleaner.ts
│   │   └── text-cleaner.test.ts
│   └── styles/              # 전역 스타일
│       └── global.css
└── worker/                     # Hono API (Cloudflare Workers)
    ├── index.ts               # Worker 진입점
    ├── routes/                # API 라우트
    │   ├── api.ts            # API 라우트 정의
    │   ├── api.test.ts       # API 라우트 테스트
    │   ├── index.ts          # 루트 핸들러
    │   └── index.test.ts     # 루트 핸들러 테스트
    ├── lib/                  # 서버 사이드 라이브러리
    │   ├── extractors/       # 콘텐츠 추출 로직
    │   │   ├── youtube.ts   # YouTube 추출기
    │   │   ├── youtube.test.ts
    │   │   ├── naver.ts     # Naver 블로그 추출기
    │   │   └── naver.test.ts
    │   ├── validators/       # Zod 스키마 검증
    │   │   ├── schemas.ts
    │   │   └── schemas.test.ts
    │   └── utils/           # 서버 유틸리티
    │       ├── html-parser.ts
    │       └── html-parser.test.ts
    └── types/               # 서버 타입 정의
```

**Structure Decision**: 통합 Cloudflare Worker 구조 + Colocation 테스트 원칙 - 하나의 Worker에서 정적 자산 서빙과 API 처리를 모두 담당. Hono 프레임워크로 라우팅을 통합 관리하며, 테스트 파일은 소스 파일과 동일한 디렉토리에 배치 (\*.test.ts)하여 유지보수성 향상.

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

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P]
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:

- TDD order: Tests before implementation
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

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

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command) - **현재 진행 중**
- [ ] Phase 4: Implementation complete - **부분 완료 (기본 구조만)**
- [ ] Phase 5: Validation passed

**Current Implementation Status (2025-09-27)**:

- [x] 기본 프로젝트 구조 및 의존성 설치
- [x] TanStack Router 기본 라우트 구조
- [x] Hono API 기본 구조 (라우팅만)
- [ ] 개발 환경 설정 (Prettier, ESLint, Vitest, Tailwind)
- [ ] 핵심 기능 구현 (콘텐츠 추출 로직)
- [ ] API 엔드포인트 구현
- [ ] 프론트엔드 UI 구현
- [ ] 테스트 파일 생성 및 TDD 적용

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (없음 - 모든 요구사항이 헌법 준수)

---

_Based on Constitution v1.1.0 - See `.specify/memory/constitution.md`_
