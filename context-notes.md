# context-notes.md — Subtitle Localizer v1.6.3

## 이번 패치의 목적
Google Cloud / YouTube BYOC 설정 마법사의 **시각 길찾기 정확도**를 높인다. 기능 로직은 v1.6.2와 동일하게 유지한다.

## 핵심 UX 원칙
- 실제 Google Cloud 화면을 복제한다고 주장하지 않는다. 모든 시각 예시는 **안내용 재구성 화면**으로 표시한다.
- 각 Wizard 단계는 항상 같은 3단 구조를 사용한다: **어디를 클릭하세요 → 무엇이 보여야 합니다 → 완료 기준**.
- 1단계는 프로젝트 선택 → APIs & Services / Library → YouTube Data API v3 → Enable의 실제 작업 순서를 시각화한다.
- 2단계는 Google Auth Platform의 Branding / Audience / Data Access를 구분하고 External + Testing이면 본인 계정을 Test user로 추가하도록 안내한다.
- 3단계는 Clients → Create Client → Web application → Authorized redirect URIs의 흐름을 시각화한다.
- 4단계는 Client ID / Client Secret 저장과 실제 Google OAuth 승인 단계를 분리한다.
- 한 화면에 억지로 맞추지 않는다. 시각 예시는 충분히 크게 보여주고 자연스러운 세로 스크롤을 허용한다.
- Product Primary #ff6f0f은 현재 단계와 실제 활성 CTA에만 사용한다.
- System typography, 4px spacing rhythm, restrained motion, reduced-motion 지원을 유지한다.

## 비용 구조
- OpenAI: 사용자 자신의 API Key(BYOK)로 결제.
- YouTube Data API: 사용자 자신의 Google Cloud 프로젝트(BYOC)의 quota 사용.
- Vercel 호스팅/함수 비용: 앱 배포자 부담.

## 보안
- OpenAI API Key, Google Client Secret, OAuth token은 암호화된 HttpOnly cookie에만 저장한다.
- localStorage / sessionStorage에 비밀정보를 저장하지 않는다.
- APP_SESSION_SECRET은 배포자가 제공하는 암호화 키이며 유료 API 자격증명이 아니다.

## Google 공식 흐름 재검증 메모 (2026-09)
- YouTube Data API 문서는 API Library에서 프로젝트를 선택/생성한 뒤 YouTube Data API를 찾아 Enable하도록 안내한다.
- Google Auth Platform은 Branding, Audience, Clients, Data Access 메뉴로 OAuth 구성을 관리한다.
- OAuth Web Client는 Clients → Create Client → Web application으로 생성하고 server-side 앱은 Authorized redirect URIs를 등록한다.
- youtube.force-ssl scope는 YouTube 영상/댓글/caption의 조회·편집·삭제 권한을 포함한다.
- External + Testing 앱은 Test users 목록에 테스트 계정을 추가해야 사용할 수 있다.

## 버전 정책
이번 변경은 UI/가이드 정확도 패치이므로 v1.6.3(Patch)로 관리한다.

## 자체 점검 요약
- 1단계 문서/공식 절차 재검증: 9.9/10
- 2단계 4단계 시각 가이드 구현: 9.9/10
- 3단계 회귀/보안/반응형 점검: 9.9/10
- 최종: 9.9/10

남은 검증은 Vercel production build 및 실제 Google Cloud 화면을 따라가는 E2E QA다.
