# Subtitle Localizer v1.5.0 — User Manual

## 1. OpenAI 연결
번역 비용은 사용자의 OpenAI 계정에 청구됩니다.

1. `내 OpenAI API Key`에 본인의 API Key를 입력합니다.
2. `키 연결`을 누릅니다.
3. 기본값은 브라우저 세션 동안만 유지입니다.
4. `이 브라우저에 기억하기`를 켜면 암호화된 HttpOnly 쿠키로 최대 30일 유지됩니다.
5. 실제 키 유효성은 첫 번역 요청에서 확인됩니다.

## 2. 번역
1. SRT를 업로드하거나 30-cue 샘플을 불러옵니다.
2. 번역 언어를 선택합니다.
3. 번역 스타일과 Glossary를 설정합니다.
4. `번역 시작`을 누릅니다.

## 3. 검토 & 다운로드
각 cue에 원문과 번역문의 전체 타임코드가 표시됩니다.

예:
`00:00:02,500 → 00:00:05,200`

상단 구조 검증 영역에서 다음을 확인합니다.
- `타임코드 30/30 일치`
- `Cue ID 30/30 일치`
- `누락 0`
- 예상하지 않은 추가 cue 0

구조가 일치하면 SRT 또는 ZIP으로 다운로드합니다. Subtitle Localizer는 번역 과정에서 원본 타임코드를 자동 이동하지 않습니다.

## 4. Google Cloud / YouTube 연결 — 4단계
YouTube API quota는 사용자가 만든 Google Cloud 프로젝트에서 사용됩니다.

### 1단계 — 프로젝트 + API
1. Google Cloud에서 새 프로젝트를 만들거나 기존 프로젝트를 선택합니다.
2. API Library에서 `YouTube Data API v3`를 찾아 활성화합니다.
3. 완료 후 앱의 1단계 체크를 표시합니다.

### 2단계 — Google Auth Platform
1. Google Cloud에서 `Google Auth Platform`을 엽니다.
2. 처음이면 Get Started로 앱 기본 정보를 등록합니다.
3. `Branding`, `Audience`, `Data Access`를 확인합니다.
4. Testing 상태라면 권한을 승인할 Google 계정을 테스트 사용자로 추가해야 할 수 있습니다.
5. External + Testing 상태에서는 기본 프로필 외 OAuth 권한을 사용할 때 refresh token이 7일 후 만료될 수 있습니다. 이런 경우 다시 YouTube 연결 승인을 해야 합니다.
6. 장기 운영을 위해 게시 상태를 변경할 때는 Google의 OAuth 검증 정책이 적용될 수 있습니다.
7. 완료 후 앱의 2단계 체크를 표시합니다.

### 3단계 — OAuth Client
1. `Google Auth Platform → Clients`를 엽니다.
2. `Create Client`를 누릅니다.
3. Application type을 `Web application`으로 선택합니다.
4. Subtitle Localizer가 표시하는 redirect URI를 `Authorized redirect URIs`에 정확히 붙여 넣습니다.
5. Google의 redirect URI는 프로토콜/도메인/경로/trailing slash까지 정확히 일치해야 합니다.
6. Client를 생성하고 Client ID와 Client Secret을 안전하게 보관합니다.

### 4단계 — Subtitle Localizer에 연결
1. Google Client ID와 Client Secret을 입력합니다.
2. 필요하면 `이 브라우저에서 Google 연결 유지`를 켭니다.
3. `Google Cloud 설정 저장`을 누릅니다.
4. 설정이 저장되면 별도의 `Google로 YouTube 연결` 버튼을 누릅니다.
5. Google 로그인/동의 화면에서 사용할 YouTube 계정을 선택하고 권한을 승인합니다.

## 5. YouTube 자막 가져오기
1. YouTube OAuth 연결 후 `YouTube 자막` 탭을 선택합니다.
2. 영상을 선택합니다.
3. 기존 자막 트랙을 선택합니다.
4. SRT를 가져옵니다.

## 6. YouTube 자막 업로드
1. 번역을 완료합니다.
2. 업로드할 영상을 선택합니다.
3. 언어를 선택합니다.
4. 자막 트랙 이름을 확인합니다.
5. 업로드를 실행합니다.

## 7. 비용 원칙
- OpenAI 번역 API 비용: 사용자 부담
- YouTube Data API quota: 사용자의 Google Cloud 프로젝트 부담
- 운영자 OpenAI/Google 유료 자격증명: 사용하지 않음
- Vercel 호스팅/함수 사용량: 배포 운영자의 Vercel 계정
