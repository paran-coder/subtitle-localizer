# Subtitle Localizer v1.7.0

사용자가 자신의 OpenAI API Key와 자신의 Google Cloud OAuth Client를 연결해 SRT를 다국어로 현지화하고 여러 YouTube 계정/채널의 자막을 가져오고 다시 업로드할 수 있는 BYOK/BYOC 웹앱입니다.

## v1.7.0
이번 버전은 초보자를 위한 Google 연결 경험과 다중 YouTube 채널 운영 구조를 함께 개선합니다.

핵심 목표는 다음과 같습니다.
- Google Cloud는 **처음 한 번만 설정**
- 이후에는 Subtitle Localizer 안에서 `+ 계정 또는 채널 추가`
- 여러 Google 계정과 여러 YouTube 채널을 독립적으로 연결
- 작업공간에서 활성 채널을 선택하고 그 채널 기준으로 영상/자막 작업
- 운영자 소유 Google OAuth Client/Google Cloud 프로젝트/quota는 사용하지 않음

## 연결 원칙
Subtitle Localizer는 사용자 소유 BYOC 구조를 유지합니다.

```text
사용자 Google Cloud 프로젝트
└─ 사용자 OAuth Web Client
   ├─ YouTube 채널 A
   ├─ YouTube 채널 B
   └─ YouTube 채널 C
```

운영자는 사용자의 Google Cloud 프로젝트, Google OAuth Client, YouTube quota를 대신 소유하지 않습니다.

## 초보자용 Google 연결 마법사
기존 4단계 Wizard를 실제 Google Cloud 작업 순서에 가까운 8단계 흐름으로 재구성했습니다.

1. Google Cloud 프로젝트 준비
2. YouTube Data API v3 활성화
3. Google Auth Platform 기본 설정 + Branding 완성
4. Publishing 상태 정리 — `In Production` 권장
5. YouTube 권한(scope) 추가
6. OAuth Web Client 생성
7. Client ID / Secret 저장
8. 첫 YouTube 채널 연결 및 API 검증

사용자가 판단할 내용을 최소화하기 위해 앱 이름, OAuth Client 이름, scope, redirect URI 등 고정 가능한 값은 앱이 직접 제시하고 복사 기능을 제공합니다.

특히 OAuth Client 생성 시 다음을 강하게 구분합니다.
- `Authorized JavaScript origins`: 비워둠
- `Authorized redirect URIs`: Subtitle Localizer callback URI만 입력

## Google Branding에 넣을 공개 URL
다중 Google 계정을 Test user 재등록 없이 추가하려면 OAuth 앱의 Branding을 완성하고 Audience에서 `In Production`으로 전환하는 흐름을 권장합니다.

Subtitle Localizer가 제공하는 공개 URL:

```text
애플리케이션 홈페이지
https://subtitle-localizer.vercel.app/

개인정보처리방침
https://subtitle-localizer.vercel.app/privacy

서비스 약관
https://subtitle-localizer.vercel.app/terms
```

`/privacy`와 `/terms`는 로그인 없이 공개 접근 가능해야 하며 메인/연결 화면에서 찾을 수 있게 유지합니다.

실제 E2E에서 OAuth 앱이 Testing 상태인 경우 기존 테스트 사용자 외의 Google 계정 추가가 `403 access_denied`로 차단되는 것을 확인했습니다. 따라서 Client ID/Secret이 저장되어 있다는 사실만으로 Google Publishing 설정까지 완료됐다고 단정하지 않습니다.

## 한 번 설정 후 추가 연결
초기 Cloud와 Publishing 설정이 끝나면 정상적인 계정/채널 추가를 위해 Google Cloud Console로 다시 돌아갈 필요가 없도록 설계합니다.

```text
+ 계정 또는 채널 추가
→ Google 계정 선택
→ YouTube 권한 승인
→ 실제 채널 확인
→ 연결 목록에 추가
```

브라우저 저장 데이터 삭제, Google 권한 직접 취소, OAuth Client 삭제/Secret 교체, Cloud 프로젝트/API 삭제 같은 복구 상황은 예외입니다.

## 다중 채널
Cloud config와 YouTube 채널 세션을 분리합니다.

각 연결은 다음 정보를 독립적으로 가집니다.
- connectionId
- channelId
- channelTitle
- channelThumbnail
- accessToken / refreshToken
- expiresAt
- connectedAt

같은 channelId를 다시 연결하면 중복 추가하지 않고 기존 연결을 갱신합니다.

작업공간에서는 현재 작업 채널을 하나 선택합니다.

```text
현재 작업 채널
[ 채널 A ▾ ]

채널 A
채널 B
채널 C
────────────
+ 계정 또는 채널 추가
연결 관리
```

영상 조회, 기존 자막 가져오기, 번역 자막 업로드는 모두 선택된 활성 채널을 사용합니다.

## 빈 채널 UX
연결된 채널에 업로드 영상이 없으면 단순히 `0개`만 표시하지 않습니다.

```text
이 채널에는 업로드된 영상이 없습니다.
YouTube에 영상을 올린 뒤 다시 불러오세요.

[YouTube Studio 열기] [다시 불러오기]
```

YouTube 채널 자체가 없는 계정도 영상 0개 상태와 구분해 안내합니다.

## 개인정보 처리 개요
- OpenAI API Key와 Google OAuth Client Secret은 서버에서 암호화한 HttpOnly cookie에 보관합니다.
- YouTube access/refresh token도 서버에서 암호화한 HttpOnly cookie에 보관합니다.
- 번역 요청 시 필요한 자막 텍스트는 사용자가 연결한 OpenAI API를 통해 처리됩니다.
- YouTube 연결/가져오기/업로드에 필요한 데이터는 Google/YouTube API를 통해 처리됩니다.
- 사용자가 올린 SRT 파일을 앱의 영구 파일 저장소에 보관하도록 설계하지 않습니다.
- 저장된 자격증명은 연결 관리에서 사용자가 삭제할 수 있습니다.

자세한 내용은 `/privacy` 페이지에서 공개합니다.

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
사용자 OpenAI API Key, Google OAuth Client Secret, YouTube access/refresh token은 서버에서 암호화한 HttpOnly cookie로 보관합니다.

다음 위치에는 비밀정보를 저장하지 않습니다.
- localStorage
- sessionStorage
- Git 저장소

## 검증
```bash
npm install
npm run check
```

`npm run check`는 테스트, TypeScript typecheck, production build를 순서대로 실행합니다.

## v1.7.0 완료 기준
- 초보자용 8단계 Google 연결 마법사 동작
- 공개 홈페이지/개인정보처리방침/서비스 약관 URL 제공
- Google Branding + Publishing 설정 후 Cloud 재설정 없이 추가 계정/채널 연결 가능
- 여러 채널 동시 보유 및 활성 채널 전환 가능
- 채널별 영상/자막 동작 분리
- 기존 OpenAI BYOK 및 SRT 번역 회귀 없음
- 비밀정보 HttpOnly 암호화 저장 유지
- 전체 자동 테스트/typecheck/build 통과
- Vercel Production READY
- 관련 Runtime Errors 없음
- 실제 다중 채널 E2E 통과
