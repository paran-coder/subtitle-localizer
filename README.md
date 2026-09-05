# Subtitle Localizer v1.6.3

사용자가 자신의 OpenAI API Key와 Google Cloud OAuth Client를 연결해 SRT를 다국어로 현지화하고 YouTube 자막으로 다시 업로드할 수 있는 BYOK/BYOC 웹앱입니다.

## v1.6.3
이번 패치는 Google Cloud / YouTube 연결 Wizard의 **시각 길찾기 정확도**를 개선합니다. 기능 로직과 비용 구조는 v1.6.2와 동일합니다.

- 모든 단계에 `어디를 클릭하세요 → 무엇이 보여야 합니다 → 완료 기준` 패턴 적용
- Google Cloud 화면 예시는 실제 화면을 고정 복사하지 않고 `안내용 재구성 화면`으로 제공
- 1단계: 프로젝트 선택 → APIs & Services → Library → YouTube Data API v3 → Enable
- 2단계: Google Auth Platform → Branding / Audience / Data Access, External Testing의 Test user 안내
- 3단계: Clients → Create Client → Web application → Authorized redirect URIs
- 4단계: Client ID / Client Secret 저장과 실제 Google OAuth 승인을 분리
- 충분히 큰 시각 예시와 자연스러운 세로 스크롤 유지

## 비용 소유
- OpenAI 사용료: 최종 사용자의 OpenAI API Key 계정
- YouTube Data API quota: 최종 사용자의 Google Cloud 프로젝트
- Vercel hosting/functions: 배포자 계정

## 배포 환경변수
```env
APP_SESSION_SECRET=use-a-long-random-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://subtitle-localizer.vercel.app
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
```

운영자 소유 `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`은 필요하지 않습니다.

## Secret 처리
사용자 OpenAI API Key, Google OAuth Client Secret, access/refresh token은 서버에서 AES-256-GCM으로 암호화한 HttpOnly cookie로 보관합니다. `localStorage` / `sessionStorage` / DB / Git 저장소에 비밀정보를 저장하지 않습니다.

## Google 연결 흐름
1. Google Cloud 프로젝트를 만들거나 선택하고 YouTube Data API v3를 활성화합니다.
2. Google Auth Platform에서 Branding, Audience, Data Access를 확인합니다. External + Testing이면 실제로 로그인할 Google 계정을 Test user에 추가합니다.
3. Clients에서 Web application OAuth Client를 만들고 앱이 보여주는 Authorized redirect URI를 등록합니다.
4. Client ID / Secret을 Subtitle Localizer에 저장한 뒤 별도의 `Google로 YouTube 연결`에서 OAuth 로그인을 승인합니다.

## 로컬 검증
```bash
npm install
npm run check
```

## v1.6.3 검증
- 자동 테스트 52/52 통과
- TS/TSX 29개 파일 ES2017 구문 진단 0
- CSS 구조 검사 통과
- 하드코딩 API Key 없음
- 실제 Next production build는 Vercel 배포에서 최종 확인
