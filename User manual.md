# User manual.md — Subtitle Localizer v1.7.0

## 1. 화면 구조
Subtitle Localizer는 세 화면으로 구성됩니다.

1. **초기 설정** — `/guide`
   - OpenAI API Billing / API Key
   - Google Cloud / YouTube 최초 연결
   - 연결 중 자주 발생하는 오류 안내
2. **연결 관리** — `/connections`
   - OpenAI API Key 연결·교체·삭제
   - Google Cloud OAuth Client 저장 상태
   - Google 계정 / YouTube 채널 추가·전환·해제
3. **작업하기** — `/`
   - 기본 진입 화면
   - SRT / YouTube 자막 가져오기
   - 번역 / 검토 / 다운로드
   - YouTube 자막 업로드

모든 주요 화면 상단에는 `초기 설정 / 연결 관리 / 작업하기` 탭이 있고 현재 화면이 강조됩니다.

## 2. 처음 사용할 때 — OpenAI
### 2.1 API Billing
ChatGPT 구독과 OpenAI API 사용료는 별도입니다. 번역 API를 사용하려면 OpenAI Platform의 API Billing에서 사용자가 결제 수단 또는 크레딧을 직접 관리합니다.

Subtitle Localizer에는 카드 정보를 입력하지 않습니다.

### 2.2 API Key 만들기
1. `/guide`의 `OpenAI API Keys 열기`를 선택합니다.
2. OpenAI Platform에서 새 Secret Key를 만듭니다.
3. 생성 직후 표시되는 전체 키를 안전하게 복사합니다.
4. Subtitle Localizer의 `연결 관리` → `내 OpenAI API Key`에 붙여넣습니다.
5. 필요하면 `이 브라우저에 기억하기`를 선택합니다.
6. `키 연결` 후 상태가 `연결됨`인지 확인합니다.

키 전체 값을 다시 볼 수 없다면 값을 추측하거나 노출하려 하지 말고 새 키를 만든 뒤 기존 키를 폐기합니다.

## 3. 처음 사용할 때 — Google / YouTube
Google Cloud 프로젝트와 OAuth Client는 사용자가 직접 소유합니다. 일반적인 추가 Google 계정/YouTube 채널 연결 때문에 Cloud 프로젝트나 OAuth Client를 매번 새로 만들 필요는 없습니다.

### 3.1 Google Cloud 8단계
1. 전용 Google Cloud 프로젝트 생성 — 권장 이름 `Subtitle Localizer`
2. YouTube Data API v3 사용 설정
3. Google Auth Platform 앱 정보 / Branding 설정
4. Audience 확인 — 여러 계정을 연결할 계획이면 `In Production` 권장
5. YouTube scope 추가
6. OAuth Client를 `Web application`으로 생성
7. Client ID / Client Secret을 Subtitle Localizer에 저장
8. Google로 첫 YouTube 채널 연결

### 3.2 Google에 입력할 공개 URL
- 홈페이지: `https://subtitle-localizer.vercel.app/`
- 개인정보처리방침: `https://subtitle-localizer.vercel.app/privacy`
- 서비스 약관: `https://subtitle-localizer.vercel.app/terms`

### 3.3 Scope
Google Cloud Data Access에 다음 값을 추가합니다.

`https://www.googleapis.com/auth/youtube.force-ssl`

이 값은 클릭해서 이동하는 웹페이지가 아니라 OAuth scope 식별자입니다.

### 3.4 OAuth Client
- Application type: `Web application`
- 권장 이름: `Subtitle Localizer Web`
- Authorized JavaScript origins: 비워둠
- Authorized redirect URIs:

`https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

callback 역시 방문용 링크가 아니라 Google OAuth Client 설정칸에 복사해서 넣는 값입니다.

### 3.5 Testing / In Production
Google Auth Platform이 Testing 상태라면 Test users에 없는 계정은 `403 access_denied`로 차단될 수 있습니다. 여러 계정을 계속 연결할 계획이라면 필요한 Branding 정보를 저장한 뒤 `In Production` 상태를 사용하는 흐름을 권장합니다.

사용자가 직접 만든 미검증 앱에서는 Google의 `확인되지 않은 앱` 경고가 나타날 수 있습니다. 이것은 `redirect_uri_mismatch`나 Testing의 `403 access_denied`와는 별개의 문제입니다.

## 4. 추가 YouTube 계정 / 채널 연결
최초 Google Cloud 설정이 완료된 뒤에는 다음 순서를 사용합니다.

1. `연결 관리`를 엽니다.
2. `계정 또는 채널 추가`를 선택합니다.
3. 연결할 Google 계정으로 로그인합니다.
4. YouTube 권한을 승인합니다.
5. 연결된 채널 목록에서 사용할 채널을 선택합니다.
6. `작업하기`로 돌아가 상단 `현재 YouTube 작업 채널`이 같은 채널인지 확인합니다.

활성 채널을 바꾸면 영상 목록과 자막 가져오기/업로드 대상도 해당 채널로 바뀝니다.

## 5. SRT 파일 번역
1. `작업하기`에서 `SRT 파일` 탭을 선택합니다.
2. `.srt` 파일을 드롭하거나 클릭해 선택합니다.
3. 번역 언어를 선택합니다. 영어와 러시아어를 포함한 지원 언어 중에서 고를 수 있습니다. 한국어 SRT를 불러온 뒤 영어·러시아어 등으로 번역하는 것도 가능합니다.
4. 자주 쓰는 조합이면 `현재 선택을 기본값으로 저장`을 누릅니다. 다음 방문부터 저장한 언어 조합이 자동 선택됩니다.
5. 필요하면 번역 스타일과 용어집을 설정합니다.
6. `번역 시작`을 누릅니다.
7. 완료 후 구조 검증에서 cue ID와 타임코드 일치 여부를 확인합니다.
8. 언어별 SRT 또는 완료 언어 ZIP을 다운로드합니다.

기본 번역 언어 저장값은 언어 코드만 브라우저 localStorage에 보관하며 API Key나 OAuth 정보는 포함하지 않습니다. `기본값 초기화`를 누르면 기존 기본 선택인 한국어·일본어·스페인어로 돌아갑니다. 이름을 붙이는 여러 프리셋은 제공하지 않습니다.

앱은 원본 타임코드를 임의로 재작성하지 않습니다.

## 6. YouTube 기존 자막 가져오기
1. `원본 자막`에서 `YouTube 자막` 탭을 선택합니다.
2. 현재 연결된 채널의 영상을 선택합니다.
3. 기존 자막 트랙을 선택합니다.
4. `SRT 가져오기`를 선택합니다.
5. 가져온 자막은 기존 SRT 번역 파이프라인의 원본으로 사용됩니다.

가져온 원본 언어와 동일한 언어는 불필요한 자기 번역을 줄이기 위해 번역 대상에서 해제될 수 있습니다.

## 7. 번역 결과를 YouTube에 올리기
1. 번역을 완료합니다.
2. 오른쪽 `YouTube에 올리기`에서 업로드할 영상을 선택합니다.
3. `자막 트랙 이름`을 확인합니다.
4. 업로드 언어를 선택합니다.
5. `YouTube에 올리기`를 실행합니다.

`자막 트랙 이름`은 현재 불러온 SRT 파일명에서 마지막 `.srt`를 제거한 값이 기본으로 자동 입력됩니다. 새 SRT를 불러오거나 업로드 대상 영상을 바꾸면 현재 SRT 파일명 기준으로 다시 맞춰집니다. 사용자가 직접 수정한 이름은 실제 업로드에 사용됩니다.

업로드가 완료되면 같은 영상의 자막 목록을 다시 불러와 새 트랙을 확인할 수 있습니다.

## 8. YouTube 자막 API quota
작업 화면의 quota 안내는 자막 API 기준 기본 `10,000 units/일`을 설명합니다.

- 자막 목록 조회: 50 units
- 원본 자막 다운로드: 200 units
- 자막 업로드: 400 units / 언어
- 일일 quota: PT 자정 초기화

quota를 모두 사용했다고 해서 카드를 등록해 즉시 추가 quota를 구매하는 방식은 아닙니다. 다음 일일 초기화를 기다리거나 지속적으로 더 많은 사용량이 필요하면 YouTube API Services의 quota 확장·심사를 확인합니다.

실제 프로젝트의 최종 할당량은 Google Cloud의 Quotas 화면을 기준으로 확인합니다.

## 9. 자주 발생하는 문제
### OpenAI API Key / quota 오류
- 저장한 키가 아직 유효한지 확인합니다.
- OpenAI Platform API Billing의 결제 수단, 크레딧, 사용 한도를 확인합니다.

### `403 access_denied`
- Google Auth Platform이 Testing인지 확인합니다.
- Testing을 유지한다면 로그인할 계정을 Test users에 추가합니다.

### `redirect_uri_mismatch`
Authorized redirect URIs에 다음 값이 정확하게 들어 있는지 확인합니다.

`https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

scheme, 도메인, 경로, 마지막 슬래시 여부까지 정확히 일치해야 합니다.

### 영상이 0개
현재 작업 채널에 실제 업로드된 영상이 있는지, 선택한 YouTube 채널이 맞는지 확인합니다.

## 10. 개인정보 / 보안
- OpenAI API Key: 서버 암호화 + HttpOnly cookie
- Google Client Secret: 서버 암호화
- YouTube access/refresh token: 서버 암호화
- localStorage/sessionStorage: 비밀정보 저장 안 함
- SRT: 서버 영구 파일 저장소에 보관 안 함
- 실제 API Key / Client Secret: GitHub, 문서, 스크린샷, 로그에 남기지 않음

## 11. 소셜 공유 이미지
Subtitle Localizer 링크를 공유할 때 v1.7.0의 1200×630 OG 이미지가 사용됩니다.

OG 이미지 주소:
`https://subtitle-localizer.vercel.app/og/subtitle-localizer`

Open Graph와 Twitter `summary_large_image` 태그가 공통 레이아웃에 적용됩니다.

## 12. 버전
현재 제품 버전은 **v1.7.0**입니다.
