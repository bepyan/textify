<!--
Sync Impact Report:
Version change: 1.0.0 → 1.2.0
Modified principles: 
- Performance Excellence → Performance & UX Excellence (완화된 성능 요구사항)
- Test-Driven Development → Business Logic Testing (비즈니스 로직 중심, 80% 커버리지 제거)
- Observability & Monitoring → Code Organization & Maintainability (간소화)
Added sections:
- Frontend Code Quality (frontend-rules 기반)
- Code Readability Guidelines
Removed sections:
- Performance Standards (개인 프로젝트에 과도함)
- Team-based governance processes
- 80% 코드 커버리지 요구사항
- 프론트엔드 컴포넌트 테스트 의무화
Templates requiring updates: ✅ Updated plan-template.md, spec-template.md, tasks-template.md
Follow-up TODOs: None
-->

# Textify Constitution

## Core Principles

### I. Code Quality & Readability (NON-NEGOTIABLE)

모든 코드는 다음 품질 기준을 MUST 충족해야 합니다:

- TypeScript 엄격 모드 사용 및 타입 안전성 보장
- ESLint/Prettier 규칙 100% 준수
- 함수당 최대 20줄, 파일당 최대 200줄 제한
- 명확한 네이밍 컨벤션: 변수는 camelCase, 상수는 UPPER_SNAKE_CASE, 컴포넌트는 PascalCase
- 파일명 컨벤션: 케밥 케이스
- 매직 넘버는 명명된 상수로 대체
- 복잡한 조건문은 명명된 변수로 분리
- 구현 세부사항은 전용 컴포넌트/HOC로 추상화

코드는 읽기 쉽고 이해하기 쉬워야 하며, 인지 부하를 최소화해야 합니다.

### II. Business Logic Testing (TDD)

비즈니스 로직에 대한 테스트 우선 개발은 필수입니다:

- 구현 전 테스트 작성 → 실패 확인 → 구현 → 통과 확인 → 리팩토링
- 비즈니스 로직, API 엔드포인트, 데이터 처리 로직에 집중
- 프론트엔드 컴포넌트 테스트는 선택적 (복잡한 상태 로직이 있는 경우만)
- 단위 테스트 (비즈니스 로직), 통합 테스트 (API), E2E 테스트 (핵심 사용자 플로우)
- 모든 API 엔드포인트는 contract 테스트 필수

테스트는 핵심 비즈니스 로직의 신뢰성을 보장하고 리팩토링 시 안전망 역할을 합니다.

### III. Frontend Architecture & UX

일관된 사용자 경험과 예측 가능한 코드 구조를 위해:

- 디자인 시스템 기반 컴포넌트 라이브러리 사용
- 접근성(a11y) 표준 준수: WCAG 2.1 AA 레벨
- 반응형 디자인: 모바일 우선 접근법
- 로딩 상태, 에러 상태, 빈 상태에 대한 일관된 UI 패턴
- 조건부 렌더링은 별도 컴포넌트로 분리
- 복잡한 삼항 연산자는 if/else 또는 IIFE로 대체
- Props drilling 대신 컴포넌트 컴포지션 사용
- 일관된 반환 타입 사용 (특히 API 훅과 검증 함수)

코드는 예측 가능하고 응집도가 높아야 하며, 결합도는 낮아야 합니다.

### IV. Performance & UX Excellence

성능과 사용자 경험의 균형을 추구합니다:

- 프론트엔드: Core Web Vitals 기준 준수 (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- 번들 크기 최적화: 코드 스플리팅, 트리 쉐이킹 적용
- 이미지 최적화 및 lazy loading 적용
- 메모리 누수 방지 및 적절한 정리
- 불필요한 리렌더링 방지

개인 프로젝트 특성상 엄격한 성능 검증보다는 합리적인 최적화에 집중합니다.

### V. Code Organization & Maintainability

코드의 구조와 유지보수성을 보장합니다:

- 기능/도메인별 디렉토리 구조 (타입별 구조 지양)
- 단일 책임 원칙: 함수는 이름에서 암시하는 동작만 수행
- 고유하고 설명적인 이름 사용 (모호함 방지)
- 관련 로직의 응집도 높이기 (폼 검증, 매직 넘버 등)
- 구조화된 로깅: JSON 형태로 일관된 로그 포맷
- 에러 추적 및 적절한 에러 처리

코드는 읽기 쉽고, 수정하기 쉽고, 확장하기 쉬워야 합니다.

## Frontend Code Quality Guidelines

### Readability Patterns

- **매직 넘버 명명**: `const ANIMATION_DELAY_MS = 300` 형태로 의미 부여
- **복잡한 조건 명명**: `const isValidUser = user.isActive && user.hasPermission`
- **구현 세부사항 추상화**: 인증 체크, 다이얼로그 로직 등을 전용 컴포넌트로 분리
- **조건부 렌더링 분리**: 역할별로 다른 컴포넌트 사용
- **복잡한 삼항 연산자 단순화**: IIFE나 if/else 사용

### Predictability Patterns

- **일관된 반환 타입**: API 훅은 항상 Query 객체, 검증 함수는 Discriminated Union
- **단일 책임**: 함수는 이름에서 암시하는 동작만 수행 (숨겨진 부작용 금지)
- **고유한 이름**: 커스텀 래퍼는 `httpService.getWithAuth()` 같이 명확한 이름 사용

### Cohesion & Coupling

- **기능별 구조**: `domains/user/`, `domains/product/` 형태로 관련 파일 그룹화
- **상태 관리 범위**: 필요한 상태만 의존하도록 훅 분리
- **컴포넌트 컴포지션**: Props drilling 대신 직접 렌더링 활용

## Development Workflow

### Quality Gates

- **Pre-commit**: 린트, 포맷팅, 타입 체크
- **Pre-push**: 단위 테스트, 통합 테스트 실행
- **배포 전**: E2E 테스트 실행

### Branch Strategy

- `main`: 프로덕션 배포 가능한 안정 버전
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

## Governance

### Amendment Process

헌법 수정은 다음 절차를 따릅니다:

1. 수정 제안서 작성 및 검토
2. 영향도 분석 및 마이그레이션 계획 수립
3. 문서 업데이트 및 관련 템플릿 동기화

### Compliance Review

- 모든 변경사항은 헌법 준수 여부 확인
- 위반 사항 발견 시 즉시 개선 조치
- 복잡성 증가는 명확한 근거와 함께 문서화

### Version Control

- 헌법 버전은 Semantic Versioning 적용
- MAJOR: 기존 원칙 제거 또는 근본적 변경
- MINOR: 새로운 원칙 추가 또는 기존 원칙 확장
- PATCH: 명확화, 오타 수정, 비본질적 개선

**Version**: 1.2.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-09-27
