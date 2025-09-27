# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup

- [ ] T001 Create project structure per implementation plan
- [ ] T002 Initialize [language] project with [framework] dependencies
- [ ] T003 [P] Configure linting and formatting tools

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
**Constitution Requirement: Business logic testing mandatory, TDD for core functionality, readable and maintainable code**

- [ ] T004 [P] Contract test POST /api/users in tests/contract/test_users_post.ts
- [ ] T005 [P] Contract test GET /api/users/{id} in tests/contract/test_users_get.ts
- [ ] T006 [P] Integration test user registration in tests/integration/test_registration.ts
- [ ] T007 [P] Integration test auth flow in tests/integration/test_auth.ts
- [ ] T008 [P] E2E test core user flow in tests/e2e/user_flow.spec.ts
- [ ] T009 [P] Business logic unit tests in tests/unit/business_logic.ts
- [ ] T010 Frontend component tests (only if complex state logic) in tests/unit/components.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

**Constitution Requirements: TypeScript strict mode, max 20 lines per function, max 200 lines per file, readable code with named constants and clear abstractions**

- [ ] T011 [P] User model with TypeScript types in src/models/user.ts
- [ ] T012 [P] UserService CRUD with proper error handling in src/services/user_service.ts
- [ ] T013 [P] API route handlers with validation in src/worker/routes/users.ts
- [ ] T014 POST /api/users endpoint with Zod validation
- [ ] T015 GET /api/users/{id} endpoint with proper error responses
- [ ] T016 Input validation middleware with comprehensive error messages
- [ ] T017 Structured logging implementation with JSON format

## Phase 3.4: Integration

- [ ] T018 Connect UserService to DB
- [ ] T019 Auth middleware
- [ ] T020 Request/response logging
- [ ] T021 CORS and security headers

## Phase 3.5: Polish

- [ ] T022 [P] Additional unit tests for complex business logic in tests/unit/test_validation.ts
- [ ] T023 [P] Update docs/api.md
- [ ] T024 Remove duplication and refactor
- [ ] T025 Run manual-testing.md

## Dependencies

- Tests (T004-T010) before implementation (T011-T017)
- T011-T017 before integration (T018-T021)
- Integration before polish (T022-T025)

## Parallel Example

```
# Launch T004-T007 together (API contract tests):
Task: "Contract test POST /api/users in tests/contract/test_users_post.ts"
Task: "Contract test GET /api/users/{id} in tests/contract/test_users_get.ts"
Task: "Integration test registration in tests/integration/test_registration.ts"
Task: "Integration test auth in tests/integration/test_auth.ts"

# Launch T009-T010 together (business logic tests):
Task: "Business logic unit tests in tests/unit/business_logic.ts"
Task: "Frontend component tests (only if complex state logic) in tests/unit/components.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - Each contract file → contract test task [P]
   - Each endpoint → implementation task
2. **From Data Model**:
   - Each entity → model creation task [P]
   - Relationships → service layer tasks
3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Models → Services → Endpoints → Polish
   - Dependencies block parallel execution

## Validation Checklist

_GATE: Checked by main() before returning_

- [ ] All contracts have corresponding tests
- [ ] All entities have model tasks
- [ ] All tests come before implementation
- [ ] Parallel tasks truly independent
- [ ] Each task specifies exact file path
- [ ] No task modifies same file as another [P] task
