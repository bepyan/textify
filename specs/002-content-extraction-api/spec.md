# Feature Specification: Content Extraction API

**Feature ID**: 002-content-extraction-api  
**Created**: 2025-09-27  
**Status**: Planning  

## Overview

Cloudflare Workers 환경에서 YouTube와 네이버 블로그 콘텐츠를 추출하는 API 엔드포인트들을 구현합니다. URL 파싱, 데이터 추출, 에러 처리를 포함하여 안정적이고 확장 가능한 콘텐츠 추출 서비스를 제공합니다.

## User Stories

### US-001: YouTube 콘텐츠 추출
**As a** 사용자  
**I want to** YouTube URL을 제공하여 비디오 메타데이터를 추출하고 싶습니다  
**So that** 비디오 제목, 설명, 썸네일, 채널 정보 등을 애플리케이션에서 활용할 수 있습니다  

**Acceptance Criteria:**
- YouTube URL (다양한 형식 지원: youtube.com, youtu.be, m.youtube.com)을 파싱할 수 있어야 합니다
- 비디오 제목, 설명, 썸네일 URL, 채널명, 업로드 날짜를 추출할 수 있어야 합니다
- 유효하지 않은 URL에 대해 적절한 에러 메시지를 반환해야 합니다
- 비공개/삭제된 비디오에 대해 적절히 처리해야 합니다

### US-002: 네이버 블로그 콘텐츠 추출
**As a** 사용자  
**I want to** 네이버 블로그 URL을 제공하여 포스트 내용을 추출하고 싶습니다  
**So that** 블로그 제목, 본문, 작성자 정보 등을 애플리케이션에서 활용할 수 있습니다  

**Acceptance Criteria:**
- 네이버 블로그 URL (blog.naver.com 형식)을 파싱할 수 있어야 합니다
- 포스트 제목, 본문 텍스트, 작성자명, 작성일을 추출할 수 있어야 합니다
- HTML 태그를 제거하고 순수 텍스트를 반환해야 합니다
- 비공개/삭제된 포스트에 대해 적절히 처리해야 합니다

### US-003: 통합 콘텐츠 추출 API
**As a** 개발자  
**I want to** 단일 엔드포인트로 다양한 플랫폼의 URL을 처리하고 싶습니다  
**So that** URL 타입을 미리 판단하지 않고도 콘텐츠를 추출할 수 있습니다  

**Acceptance Criteria:**
- URL을 자동으로 분석하여 적절한 추출기를 선택해야 합니다
- 지원하지 않는 플랫폼에 대해 명확한 에러 메시지를 반환해야 합니다
- 일관된 응답 형식을 제공해야 합니다

## Functional Requirements

### FR-001: URL 파싱 및 검증
- 다양한 YouTube URL 형식 지원 (youtube.com/watch?v=, youtu.be/, m.youtube.com 등)
- 네이버 블로그 URL 형식 검증 (blog.naver.com/username/postId)
- URL 정규화 및 파라미터 추출
- 유효하지 않은 URL에 대한 에러 처리

### FR-002: YouTube 데이터 추출
- YouTube Data API 또는 웹 스크래핑을 통한 메타데이터 추출
- 추출 데이터: 제목, 설명, 썸네일 URL, 채널명, 업로드 날짜, 조회수, 좋아요 수
- 비공개/삭제된 비디오 처리
- API 레이트 리밋 처리

### FR-003: 네이버 블로그 데이터 추출
- 웹 스크래핑을 통한 블로그 포스트 내용 추출
- 추출 데이터: 제목, 본문 텍스트, 작성자명, 작성일, 카테고리
- HTML 태그 제거 및 텍스트 정제
- 이미지 URL 추출 (선택적)

### FR-004: API 엔드포인트
- `POST /api/extract/youtube` - YouTube 콘텐츠 추출
- `POST /api/extract/naver-blog` - 네이버 블로그 콘텐츠 추출
- `POST /api/extract/auto` - 자동 플랫폼 감지 및 추출
- 일관된 JSON 응답 형식

### FR-005: 에러 처리
- 네트워크 에러 처리
- 파싱 에러 처리
- 레이트 리밋 에러 처리
- 구조화된 에러 응답

## Non-Functional Requirements

### NFR-001: 성능
- 응답 시간 < 5초 (95th percentile)
- Cloudflare Workers 실행 시간 제한 준수
- 메모리 효율적인 데이터 처리

### NFR-002: 신뢰성
- 네트워크 장애에 대한 복원력
- 타임아웃 처리
- 재시도 로직 (적절한 백오프 전략)

### NFR-003: 보안
- CORS 정책 적용
- 입력 검증 및 새니타이제이션
- 악성 URL 차단

### NFR-004: 확장성
- 새로운 플랫폼 추가 용이성
- 모듈화된 추출기 구조
- 설정 가능한 추출 옵션

## Technical Constraints

### TC-001: Cloudflare Workers 환경
- JavaScript/TypeScript 런타임
- 제한된 실행 시간 (CPU 시간 50ms, 총 시간 30초)
- 외부 API 호출 제한
- 파일 시스템 접근 불가

### TC-002: 웹 스크래핑 제약
- 대상 사이트의 robots.txt 준수
- User-Agent 설정
- 요청 빈도 제한

### TC-003: 데이터 처리
- 대용량 콘텐츠 처리 시 메모리 제한
- 스트리밍 처리 고려

## Success Criteria

### SC-001: 기능적 성공
- YouTube 및 네이버 블로그 URL에서 90% 이상 성공적으로 데이터 추출
- 지원하는 모든 URL 형식에 대해 정확한 파싱
- 에러 상황에서 적절한 에러 메시지 반환

### SC-002: 성능적 성공
- 평균 응답 시간 < 3초
- 95th percentile 응답 시간 < 5초
- 메모리 사용량 최적화

### SC-003: 운영적 성공
- 안정적인 에러 처리 및 로깅
- 모니터링 및 알림 체계
- 문서화 완료

## Dependencies

### External Dependencies
- YouTube Data API (선택적)
- 웹 스크래핑 라이브러리
- HTML 파싱 라이브러리
- HTTP 클라이언트

### Internal Dependencies
- Cloudflare Workers 런타임
- 기존 Textify 프로젝트 구조
- 공통 유틸리티 함수

## Risks & Mitigations

### Risk-001: 대상 사이트 구조 변경
**Risk**: YouTube나 네이버 블로그의 HTML 구조 변경으로 스크래핑 실패  
**Mitigation**: 
- 여러 선택자 패턴 사용
- API 우선 사용 (YouTube Data API)
- 정기적인 테스트 및 모니터링

### Risk-002: 레이트 리밋
**Risk**: 과도한 요청으로 인한 차단  
**Mitigation**:
- 요청 간격 제어
- 캐싱 전략
- 백오프 및 재시도 로직

### Risk-003: Cloudflare Workers 제약
**Risk**: 실행 시간 초과 또는 메모리 부족  
**Mitigation**:
- 스트리밍 처리
- 타임아웃 설정
- 효율적인 데이터 구조 사용

## Out of Scope

- 실시간 콘텐츠 동기화
- 대용량 배치 처리
- 사용자 인증 및 권한 관리
- 콘텐츠 저장 및 캐싱 (이번 단계에서는 제외)
- 다른 플랫폼 지원 (Instagram, Twitter 등)

## Clarifications

### Session 1: 2025-09-27
**Q**: YouTube Data API 사용 vs 웹 스크래핑 선택 기준은?  
**A**: YouTube Data API를 우선 사용하되, API 키가 없거나 할당량 초과 시 웹 스크래핑으로 fallback

**Q**: 네이버 블로그 스크래핑 시 이미지 처리 방법은?  
**A**: 이미지 URL만 추출하고, 실제 이미지 다운로드나 처리는 하지 않음

**Q**: 에러 응답 형식은?  
**A**: 표준 HTTP 상태 코드와 함께 구조화된 JSON 에러 객체 반환

**Q**: 캐싱 전략은?  
**A**: 이번 단계에서는 캐싱 구현하지 않음. 향후 Redis 또는 Cloudflare KV 사용 예정

**Q**: 콘텐츠 길이 제한은?  
**A**: 블로그 본문은 최대 50KB, YouTube 설명은 최대 5KB로 제한
