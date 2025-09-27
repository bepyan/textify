<!--
Sync Impact Report:
Version change: 1.0.0 → 1.1.0
Modified principles:
- Code Quality First: 파일/함수 길이 제한 완화 (1인 개발 환경 고려)
- Performance Excellence: 성능 기준 완화 (개인 사이드 프로젝트 특성 반영)
- Test-Driven Development: 커버리지 요구사항 완화
Added sections: N/A
Removed sections: N/A
Templates requiring updates: ⚠ plan-template.md 성능 목표 수정 필요
Follow-up TODOs: 템플릿 동기화 필요
-->

# Textify Constitution

## Core Principles

### I. Code Quality First (NON-NEGOTIABLE)

모든 코드는 다음 품질 기준을 MUST 충족해야 합니다:

- TypeScript 엄격 모드 사용 및 타입 안전성 보장
- ESLint/Prettier 규칙 100% 준수
- 1인 개발 환경에서 코드 리뷰는 선택사항이나 중요한 변경사항은 자체 검토 필수
- 파일/함수 길이 제한 없음 (단, 가독성과 유지보수성 고려)
- 유틸 함수는 순수 함수로 작성하고 단일 책임 원칙 준수
- 명확한 네이밍 컨벤션: 변수는 camelCase, 상수는 UPPER_SNAKE_CASE, 컴포넌트는 PascalCase
- 파일명 컨벤션: 케밥 케이스

품질 저하는 기술 부채 증가와 유지보수 비용 증가로 이어지므로 타협할 수 없습니다.

### II. Test-Driven Development (TDD)

테스트 우선 개발을 권장합니다:

- 구현 전 테스트 작성 → 실패 확인 → 구현 → 통과 확인 → 리팩토링
- 개인 프로젝트 특성상 커버리지 목표는 유연하게 설정 (최소 60% 권장)
- 핵심 비즈니스 로직과 유틸 함수는 반드시 테스트 작성
- API 엔드포인트는 contract 테스트 권장
- 중요한 기능 변경 시에는 테스트 통과 후 배포

테스트는 코드의 신뢰성을 보장하고 리팩토링 시 안전망 역할을 합니다.

### III. User Experience Consistency

일관된 사용자 경험 제공을 위해:

- 디자인 시스템 기반 컴포넌트 라이브러리 사용
- 접근성(a11y) 표준 준수: WCAG 2.1 AA 레벨
- 반응형 디자인: 모바일 우선 접근법
- 로딩 상태, 에러 상태, 빈 상태에 대한 일관된 UI 패턴
- 사용자 피드백 수집 및 반영 프로세스

사용자 중심 설계는 제품의 성공을 결정하는 핵심 요소입니다.

### IV. Performance Excellence

성능은 사용자 경험의 핵심이지만 개인 프로젝트 특성을 고려합니다:

- 프론트엔드: 합리적인 로딩 시간 유지 (First Contentful Paint < 3초 목표)
- 백엔드: API 응답 시간 평균 < 500ms (개인 서버 환경 고려)
- 번들 크기 최적화: 불필요한 의존성 제거 및 코드 스플리팅 적용
- 이미지 최적화 권장 (필수 아님)
- 명백한 성능 문제 발생 시에만 최적화 진행

개인 사이드 프로젝트이므로 과도한 성능 최적화보다는 기능 구현에 집중합니다.

### V. Observability & Monitoring

시스템의 투명성과 디버깅 가능성을 적절한 수준에서 보장합니다:

- 기본적인 로깅: 에러 및 중요 이벤트 로깅
- 간단한 에러 추적 (콘솔 로그 또는 기본 모니터링 도구)
- 개발 환경에서의 디버깅 도구 활용
- 프로덕션 환경에서는 최소한의 모니터링
- 문제 발생 시 로그를 통한 원인 파악

1인 개발 환경에서는 복잡한 모니터링보다는 효율적인 디버깅에 집중합니다.

## Performance Standards

### Frontend Performance

- **기본 성능 목표**: 합리적인 사용자 경험 제공 (LCP < 4s 목표)
- **번들 최적화**: 필요시 코드 스플리팅 적용, 불필요한 의존성 제거
- **캐싱 전략**: 기본 브라우저 캐시 활용
- **이미지 최적화**: 필요시 적용 (선택사항)

### Backend Performance

- **응답 시간**: 평균 < 500ms (개인 서버 환경 고려)
- **처리량**: 개인 사용 수준에 적합한 성능
- **데이터베이스**: 기본적인 쿼리 최적화
- **메모리 관리**: 명백한 메모리 누수 방지

## Development Workflow

### Code Review Process

- 1인 개발 환경에서는 자체 검토 진행
- 중요한 변경사항은 커밋 전 코드 재검토
- 코드 품질과 기본적인 보안 관점에서 검토
- 린터와 포매터를 통한 자동화된 품질 검사

### Quality Gates

- **Pre-commit**: 린트, 포맷팅, 타입 체크
- **개발 중**: 핵심 기능 테스트 실행
- **배포 전**: 기본적인 기능 동작 확인
- **필요시**: 중요 기능에 대한 추가 테스트

### Branch Strategy

- `main`: 프로덕션 배포 가능한 안정 버전
- `feature/*`: 기능 개발 브랜치 (필요시)
- 1인 개발 환경에서는 단순한 브랜치 전략 사용

## Governance

### Amendment Process

헌법 수정은 다음 절차를 따릅니다:

1. 수정 필요성 검토 및 제안서 작성
2. 영향도 분석 및 변경 계획 수립
3. 개발자 자체 검토 및 승인
4. 문서 업데이트 및 관련 템플릿 동기화

### Compliance Review

- 주요 변경사항은 헌법 준수 여부 자체 확인
- 정기적인 헌법 준수 현황 검토 (필요시)
- 위반 사항 발견 시 개선 조치
- 복잡성 증가는 명확한 근거와 함께 문서화

### Version Control

- 헌법 버전은 Semantic Versioning 적용
- MAJOR: 기존 원칙 제거 또는 근본적 변경
- MINOR: 새로운 원칙 추가 또는 기존 원칙 확장
- PATCH: 명확화, 오타 수정, 비본질적 개선

**Version**: 1.1.0 | **Ratified**: 2025-01-27 | **Last Amended**: 2025-09-27
