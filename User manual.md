# User manual.md — Subtitle Localizer v1.6.3

## 1. 자막 번역
1. 메인 작업공간에서 SRT를 업로드하거나 샘플을 불러옵니다.
2. 대상 언어와 번역 스타일을 선택합니다.
3. OpenAI가 연결되어 있지 않으면 `연결 관리`에서 자신의 OpenAI API Key를 연결합니다.
4. 번역을 실행하고 타임코드 / Cue ID 검증 결과를 확인합니다.
5. SRT 또는 ZIP으로 다운로드합니다.

## 2. YouTube 연결
`연결 관리` → YouTube 설정에서 4단계 Wizard를 진행합니다. 각 단계는 `어디를 클릭하세요 → 무엇이 보여야 합니다 → 완료 기준` 순서로 안내합니다. 화면 그림은 Google Cloud의 **안내용 재구성 화면**이며 실제 콘솔은 업데이트에 따라 조금 다를 수 있습니다.

### 1/4 Google Cloud 프로젝트 + YouTube Data API
- 상단 프로젝트 선택기에서 사용할 프로젝트를 고르거나 새 프로젝트를 만듭니다.
- `APIs & Services → Library`에서 `YouTube Data API v3`를 찾고 `Enable`합니다.
- 완료 기준: 선택한 프로젝트에서 YouTube Data API v3가 Enabled 상태.

### 2/4 Google Auth Platform
- `Google Auth Platform`의 Branding에서 앱 이름/지원 이메일을 확인합니다.
- Audience가 External + Testing이면 실제 로그인할 자신의 Google 계정을 Test user로 추가합니다.
- Data Access에서 앱이 요청할 YouTube scope를 확인합니다. Subtitle Localizer는 `https://www.googleapis.com/auth/youtube.force-ssl`을 요청합니다.
- 완료 기준: 앱 정보/대상/필요 scope와 테스트 계정 준비.

### 3/4 OAuth Web Client
- `Google Auth Platform → Clients → Create Client`로 이동합니다.
- Application type은 `Web application`을 선택합니다.
- Subtitle Localizer가 보여주는 Redirect URI를 `Authorized redirect URIs`에 정확히 등록합니다.
- 완료 기준: Client ID와 Client Secret이 발급된 상태.

### 4/4 Cloud 설정 저장 + OAuth 승인
- Client ID와 Client Secret을 Subtitle Localizer에 입력합니다.
- 필요하면 `이 브라우저에서 Google 연결 유지`를 선택합니다.
- 저장 후 `Google로 YouTube 연결`을 눌러 실제 Google 로그인/동의를 승인합니다.
- 완료 기준: 연결 페이지 상단에 `YouTube ✓`가 표시되고 영상 목록을 불러올 수 있음.

## 3. 보안
- OpenAI Key/Google Client Secret/OAuth token은 암호화된 HttpOnly cookie로만 저장됩니다.
- 기억하기를 끄면 세션 cookie, 켜면 지속 cookie를 사용합니다.
- APP_SESSION_SECRET은 배포자 Vercel에만 저장합니다.

## 4. 비용
- OpenAI 번역 비용은 입력한 사용자 OpenAI 계정에 청구됩니다.
- YouTube Data API quota는 입력한 사용자 Google Cloud 프로젝트에서 사용됩니다.
- Vercel hosting/function 사용량은 앱 배포자의 Vercel 계정에 속합니다.
