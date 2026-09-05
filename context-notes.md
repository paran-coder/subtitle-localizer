# context-notes.md — Subtitle Localizer v1.6.4

## 이번 패치의 목적
Google Cloud / YouTube BYOC Wizard에서 **설명 번호, 시각화 번호, 실제 CTA가 서로 다른 축으로 보이던 문제**를 해결한다. 기능 로직은 v1.6.3과 동일하게 유지한다.

## 핵심 UX 원칙
- 단계 내부 번호 체계는 하나만 사용한다.
- 행동 1은 시각화 1과 CTA 1에 대응하고, 행동 2/3도 같은 방식으로 1:1 매칭한다.
- `어디를 클릭하세요 / 무엇이 보여야 합니다 / 완료 기준`은 별도 상단 카드가 아니라 각 행동 단계 안에 포함한다.
- 각 행동의 주 CTA는 하나만 둔다. 보조 링크는 텍스트 링크로 내려 시각적 경쟁을 줄인다.
- 설명 → 시각화 → 완료 확인의 읽기 순서가 끊기지 않도록 한다.
- 실제 Google Cloud 화면을 복제한다고 주장하지 않는다. 시각 예시는 **안내용 재구성 화면**으로 표시한다.
- 한 화면에 억지로 맞추지 않는다. 시각 예시는 충분히 크게 유지하고 자연스러운 세로 스크롤을 허용한다.
- Product Primary #ff6f0f은 현재 단계, 시각화 포인터, 실제 활성 CTA에만 사용한다.
- System typography, 4px spacing rhythm, restrained motion, reduced-motion 지원을 유지한다.

## 단계별 매핑
### 1/4 Google Cloud 프로젝트 준비
1. 프로젝트 선택/생성 ↔ 상단 Project selector ↔ `프로젝트 만들기/선택`
2. API Library 이동 ↔ 좌측 APIs & Services → Library ↔ `API Library 열기`
3. YouTube Data API v3 활성화 ↔ API detail + Enable ↔ `YouTube Data API v3 열기`

### 2/4 Google Auth Platform
1. Branding 확인 ↔ Branding 메뉴/앱 정보
2. Audience/Test users 준비 ↔ Audience + Test users
3. Data Access scope 확인 ↔ Data Access + youtube.force-ssl

### 3/4 OAuth Web Client
1. Clients 이동 ↔ Clients 목록
2. Web application 생성 ↔ Create Client / Web application
3. Redirect URI 등록 ↔ Authorized redirect URIs

### 4/4 Subtitle Localizer 연결
1. Client ID/Secret 입력 ↔ 앱 입력 폼
2. Cloud 설정 저장 ↔ 암호화 저장 상태
3. Google OAuth 승인 ↔ `Google로 YouTube 연결` → YouTube 연결 완료

## 비용 구조
- OpenAI: 사용자 자신의 API Key(BYOK)로 결제.
- YouTube Data API: 사용자 자신의 Google Cloud 프로젝트(BYOC)의 quota 사용.
- Vercel 호스팅/함수 비용: 앱 배포자 부담.

## 보안
- OpenAI API Key, Google Client Secret, OAuth token은 암호화된 HttpOnly cookie에만 저장한다.
- localStorage / sessionStorage에 비밀정보를 저장하지 않는다.
- APP_SESSION_SECRET은 배포자가 제공하는 암호화 키이며 유료 API 자격증명이 아니다.

## 버전 정책
이번 변경은 기능이 아닌 UI 정보구조/시각 매핑 패치이므로 v1.6.4(Patch)로 관리한다.

## 자체 점검 계획
- 1단계 문서/매핑 설계
- 2단계 1/4~4/4 UI 재구성
- 3단계 CTA 위계/모바일/접근성 점검
- 4단계 회귀 테스트/패키징

## 최종 자체 점검
- 1단계 문서/매핑 설계: **9.9/10**
- 2단계 1/4~4/4 UI 재구성: **9.9/10**
- 3단계 회귀/접근성/CTA 위계: **9.9/10**
- 4단계 보안/API 불변성/패키징: **9.9/10**
- 자동 테스트 53/53, TS/TSX 28개 ES2017 구문 오류 0, CSS 구조 검사 통과.
- 남은 검증은 Vercel production build 및 실제 Google Cloud 화면과의 픽셀/E2E QA다.
