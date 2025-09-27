# Tasks: Content Extraction API

**Input**: Design documents from `/specs/002-content-extraction-api/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x, Hono 4.9.9, Cloudflare Workers
   → Structure: Web application (frontend + worker API)
   → Dependencies: linkedom, html-entities, @hono/standard-validator
2. Load design documents:
   → data-model.md: 3 core entities (ExtractedContent, YouTubeContent, NaverBlogContent)
   → contracts/: 3 contract files (auto-extract, youtube-extract, naver-blog-extract)
   → research.md: HTML parsing strategy, URL pattern decisions
3. Generate tasks by category:
   → Setup: dependencies, directory structure
   → Tests: 3 contract tests, unit tests (colocation)
   → Core: types, extractors, utilities, API routes
   → Integration: route integration, error handling
   → Polish: validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
   → Colocation strategy for unit tests
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness: ✓ All contracts have tests, ✓ All entities have models
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- Colocation strategy: unit tests alongside implementation files

## Path Conventions

- **Worker API**: `src/worker/` (existing structure)
- **Types**: `src/worker/types/` (new)
- **Extractors**: `src/worker/extractors/` (new)
- **Utils**: `src/worker/utils/` (new)
- **Contract Tests**: `tests/contract/` (separate management)

## Phase 3.1: Setup

- [ ] T001 Install HTML parsing dependencies (linkedom, html-entities) via bun
- [ ] T002 Create directory structure for extractors, types, utils in src/worker/
- [ ] T003 [P] Copy contract test files from specs/contracts/ to tests/contract/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
**Constitution Requirement: Business logic testing mandatory, TDD for core functionality**

- [ ] T004 [P] Contract test auto-extract endpoint in tests/contract/auto-extract.contract.test.ts
- [ ] T005 [P] Contract test YouTube extraction in tests/contract/youtube-extract.contract.test.ts  
- [ ] T006 [P] Contract test Naver blog extraction in tests/contract/naver-blog-extract.contract.test.ts
- [ ] T007 [P] Unit test for extraction types validation in src/worker/types/extraction.test.ts
- [ ] T008 [P] Unit test for error types handling in src/worker/types/errors.test.ts
- [ ] T009 [P] Unit test for URL parsing logic in src/worker/utils/url-parser.test.ts
- [ ] T010 [P] Unit test for HTML parsing utilities in src/worker/utils/html-parser.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**Constitution Requirements: TypeScript strict mode, max 20 lines per function, colocation strategy**

### Foundation Layer (Types System)
- [ ] T011 [P] Core extraction types and enums in src/worker/types/extraction.ts
- [ ] T012 [P] Error types and custom error class in src/worker/types/errors.ts
- [ ] T013 [P] Zod validation schemas for all types in src/worker/types/validation.ts

### Utility Layer (Common Functions)  
- [ ] T014 [P] URL parsing utility with platform detection in src/worker/utils/url-parser.ts
- [ ] T015 [P] HTML parsing helper functions in src/worker/utils/html-parser.ts
- [ ] T016 [P] Structured logging utility in src/worker/utils/logger.ts

### Extractor Layer (Business Logic)
- [ ] T017 [P] Base extractor abstract class in src/worker/extractors/base-extractor.ts
- [ ] T018 YouTube extractor implementation in src/worker/extractors/youtube-extractor.ts
- [ ] T019 Naver blog extractor implementation in src/worker/extractors/naver-blog-extractor.ts

### API Layer (Route Handlers)
- [ ] T020 Extraction API routes with validation in src/worker/routes/extract.ts
- [ ] T021 Integrate extract routes into existing API in src/worker/routes/api.ts

## Phase 3.4: Integration

- [ ] T022 Error handling middleware for extraction errors
- [ ] T023 Request/response logging for extraction endpoints  
- [ ] T024 Input validation with comprehensive error messages
- [ ] T025 Update OpenAPI schema integration in existing swagger setup

## Phase 3.5: Polish

- [ ] T026 [P] Additional unit tests for edge cases in src/worker/extractors/base-extractor.test.ts
- [ ] T027 [P] Integration test for complete extraction flow in src/worker/routes/extract.integration.test.ts
- [ ] T028 [P] Performance optimization for large content handling
- [ ] T029 Update API documentation with new extraction endpoints

## Dependencies

### Critical Path
```
T001-T003 (Setup) → T004-T010 (Tests) → T011-T013 (Types) → T014-T016 (Utils) → 
T017 (Base) → T018-T019 (Extractors) → T020-T021 (API) → T022-T025 (Integration) → T026-T029 (Polish)
```

### Specific Dependencies
- T011-T013 must complete before T014-T016 (utils need types)
- T017 must complete before T018-T019 (extractors extend base)
- T018-T019 must complete before T020 (routes use extractors)
- T020 must complete before T021 (integration needs routes)

## Parallel Execution Examples

### Phase 3.2: Contract Tests (All Parallel)
```bash
# Launch T004-T006 together (different contract files):
Task: "Contract test auto-extract endpoint in tests/contract/auto-extract.contract.test.ts"
Task: "Contract test YouTube extraction in tests/contract/youtube-extract.contract.test.ts"  
Task: "Contract test Naver blog extraction in tests/contract/naver-blog-extract.contract.test.ts"

# Launch T007-T010 together (different test files):
Task: "Unit test for extraction types validation in src/worker/types/extraction.test.ts"
Task: "Unit test for error types handling in src/worker/types/errors.test.ts"
Task: "Unit test for URL parsing logic in src/worker/utils/url-parser.test.ts"
Task: "Unit test for HTML parsing utilities in src/worker/utils/html-parser.test.ts"
```

### Phase 3.3: Foundation Layer (Parallel by File)
```bash
# Launch T011-T013 together (different type files):
Task: "Core extraction types and enums in src/worker/types/extraction.ts"
Task: "Error types and custom error class in src/worker/types/errors.ts"  
Task: "Zod validation schemas for all types in src/worker/types/validation.ts"

# Launch T014-T016 together (different utility files):
Task: "URL parsing utility with platform detection in src/worker/utils/url-parser.ts"
Task: "HTML parsing helper functions in src/worker/utils/html-parser.ts"
Task: "Structured logging utility in src/worker/utils/logger.ts"
```

## Implementation Checkpoints

### Checkpoint 1: Foundation Complete (After T013)
- [ ] All Zod schemas validate correctly
- [ ] TypeScript compilation passes with strict mode
- [ ] All type tests pass

### Checkpoint 2: Utilities Complete (After T016)  
- [ ] URL parsing handles all YouTube/Naver patterns
- [ ] HTML parsing utilities work with linkedom
- [ ] Logging utility produces structured JSON

### Checkpoint 3: Extractors Complete (After T019)
- [ ] Base extractor provides common functionality
- [ ] YouTube extractor handles web scraping
- [ ] Naver blog extractor handles iframe URL conversion
- [ ] All extractor unit tests pass

### Checkpoint 4: API Complete (After T021)
- [ ] All extraction endpoints respond correctly
- [ ] OpenAPI schema matches implementation
- [ ] All contract tests pass
- [ ] Integration with existing API successful

## Validation Checklist

_GATE: Checked before task execution_

- [x] All contracts have corresponding tests (T004-T006)
- [x] All entities have model tasks (T011-T013)  
- [x] All tests come before implementation (T004-T010 before T011+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Colocation strategy applied (unit tests with implementation)

## Notes

- **Colocation Strategy**: Unit tests are placed alongside implementation files
- **Contract Tests**: Managed separately in tests/contract/ directory
- **TDD Approach**: All tests must fail before implementation begins
- **Bun Compatibility**: All dependencies work with bun package manager
- **Workers Constraints**: Respect 50ms CPU time and memory limits
- **Error Handling**: Comprehensive error types with user-friendly messages

## Task Generation Rules Applied

1. **From Contracts**: 3 contract files → 3 contract test tasks (T004-T006)
2. **From Data Model**: 3 entities → type definition tasks (T011-T013)  
3. **From Research**: HTML parsing decision → utility tasks (T014-T016)
4. **From Plan**: Colocation strategy → unit tests alongside implementation
5. **Ordering**: Setup → Tests → Types → Utils → Extractors → API → Integration → Polish
