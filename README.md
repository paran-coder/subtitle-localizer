# Subtitle Localizer v1.7.0

사용자가 자신의 OpenAI API Key(BYOK)와 자신의 Google Cloud OAuth Client(BYOC)를 연결해 SRT를 여러 언어로 현지화하고, 여러 YouTube 계정/채널의 자막을 가져오거나 다시 업로드할 수 있는 웹앱입니다.

## 핵심 기능
- SRT 업로드 또는 YouTube 기존 자막 가져오기
- 타임코드 / cue ID 구조 유지 번역
- 다국어 동시 번역
- 번역 스타일 및 용어집
- SRT 개별 다운로드 / ZIP 다운로드
- 번역 결과 YouTube 자막 업로드
- 다중 Google 계정 / YouTube 채널 연결 및 전환
- Google Cloud는 최초 1회 설정 후 정상적인 추가 채널 연결에 재설정 불필요

## 주요 화면 구조
v1.7.0의 주요 화면은 사용자 목적 기준으로 세 영역으로 나눕니다.

1. **초기 설정** — `/guide`
   - OpenAI API Key 생성과 연결
   - Google Cloud / YouTube 최초 8단계 설정
   - 최초 연결 중 자주 발생하는 오류와 복구
2. **연결 관리** — `/connections`
   - 저장된 OpenAI API Key 상태 확인/교체/삭제
   - Google Cloud Client 상태 확인
   - Google 계정 / YouTube 채널 추가·전환·해제
3. **작업하기** — `/`
   - 기본 진입 페이지
   - SRT 업로드 / YouTube 자막 가져오기
   - 번역 / 구조 검증 / 다운로드
   - YouTube 자막 업로드

모든 주요 화면의 상단 계층은 `Subtitle Localizer 타이틀바 → 초기 설정 / 연결 관리 / 작업하기 탭 → 페이지별 내용` 순서로 통일합니다. 타이틀바와 탭은 서로 붙지 않도록 별도 간격을 둡니다. 기본 페이지는 `/`이며 `작업하기`가 기본 활성 탭입니다.

`작업하기` 화면에 YouTube 채널이 연결되어 있다면 탭 아래에 `현재 YouTube 작업 채널` 바가 추가됩니다. 따라서 작업하기의 실제 순서는 `타이틀바 → 탭 → 현재 작업 채널 → 작업 본문`입니다. `/guide`와 `/connections`에서는 현재 작업 채널 바가 표시되지 않습니다.

기존의 `처음 사용하시나요?`, `설정이 낯설다면`, `처음 사용 가이드`, `설정 가이드 보기` 대형 안내 배너는 제거하고, 화면 역할 자체가 드러나는 상단 탭으로 대체합니다.

## 초기 설정
`/guide`는 단순한 제품 소개 페이지가 아니라 최초 연결을 완료하기 위한 상세 설정 화면입니다.

1. **내 OpenAI API Key**
   - 왜 필요한지
   - 비용은 누구에게 청구되는지
   - OpenAI에서 secret key를 어디서 만들고 언제 복사해야 하는지
   - Subtitle Localizer `연결 관리`의 어느 칸에 넣는지
   - `이 브라우저에 기억하기`와 저장 방식
   - 키를 잃어버렸거나 폐기해야 할 때의 복구 방법

2. **YouTube 연결**
   - 왜 Google Cloud 프로젝트가 필요한지
   - YouTube Data API v3와 OAuth Client가 각각 무슨 역할인지
   - Project → API → Auth Platform → Audience → Scope → Client → Channel 순서
   - 실제 Google Console 버튼명과 완료 조건
   - Testing / In Production 차이와 `403 access_denied`
   - OAuth callback URI를 정확한 칸에 넣는 방법
   - 첫 채널 연결 후 추가 계정/채널 연결 방법

## OpenAI 연결 원칙
- OpenAI API Key는 사용자가 직접 발급하고 소유합니다.
- 번역 사용료는 사용자가 입력한 OpenAI 계정에 직접 청구됩니다.
- 앱은 입력받은 API Key를 서버에서 암호화하고 HttpOnly cookie로 보관합니다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.
- 실제 API Key 값은 문서, 저장소, 스크린샷, 로그에 넣지 않습니다.
- secret key는 생성 직후 전체 값을 안전하게 복사·보관하고, 다시 확인할 수 없으면 기존 값을 추측하거나 노출하려 하지 말고 새 키를 발급하는 흐름을 안내합니다.

## v1.7.0 Google / YouTube 연결
v1.7.0은 Google Cloud 설정과 YouTube 채널 연결을 분리합니다.

사용자는 자신의 Google Cloud 프로젝트에 YouTube Data API v3와 Google Auth Platform을 설정하고, 하나의 OAuth Web Client를 Subtitle Localizer에 저장합니다. 이후 앱의 `+ 계정 또는 채널 추가`를 통해 여러 Google 계정/YouTube 채널을 계속 연결할 수 있습니다.

권장 초기 설정:
- 전용 프로젝트 이름: `Subtitle Localizer`
- YouTube Data API v3 사용 설정
- Google Auth Platform 사용자 유형: `External`
- Branding 공개 URL
  - `https://subtitle-localizer.vercel.app/`
  - `https://subtitle-localizer.vercel.app/privacy`
  - `https://subtitle-localizer.vercel.app/terms`
- Audience: 여러 계정을 연결할 계획이면 `In Production` 권장
- scope: `https://www.googleapis.com/auth/youtube.force-ssl`
- OAuth Client type: `Web application`
- 권장 Client 이름: `Subtitle Localizer Web`
- Authorized JavaScript origins: 비움
- Authorized redirect URIs: `https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

`Client 저장됨`과 Google 앱의 Publishing 상태는 별개입니다. 앱은 Google Console의 실제 Publishing 상태까지 자동 판별하지 않습니다.

미검증 Production 앱은 Google의 `확인되지 않은 앱` 경고가 나타날 수 있습니다.

## 다중 채널
각 YouTube 채널은 독립된 OAuth 세션으로 저장됩니다. 작업공간에서 활성 채널을 바꾸면 영상 목록과 자막 가져오기/업로드 대상도 해당 채널로 바뀝니다.

실제 E2E에서 확인:
- 기존 채널 유지 상태에서 두 번째 Google 계정/채널 추가
- 채널 전환
- 영상 27개 채널과 영상 0개 채널의 목록 분리
- 빈 채널 안내
- 활성 채널과 업로드 패널 동기화

## 실제 자막 E2E
테스트에 사용한 실제 파일명:
- `subtitle-localizer-e2e-test.mp4`
- `localization-challenge-en.srt`

검증 완료:
- 30 cue 영문 SRT 로드
- 한국어 번역
- 타임코드 30/30, Cue ID 30/30 일치
- 누락 0 / 추가 0
- 앱에서 한국어 YouTube 자막 업로드 성공
- YouTube API에서 `ko · Subtitle Localizer` 트랙 조회 성공
- 해당 자막을 다시 SRT로 다운로드해 30 cue 가져오기 성공
- 업로드 직후 동일 영상 자막 목록 자동 갱신
- 가져온 원본 언어와 동일한 번역 대상 자동 해제

## v1.7.0 UI 마감 상태
실사용 화면에서 확인된 기존 UI 문제는 현재 GitHub `main`과 Production에 반영됐습니다.

1. 연결 관리 제목과 설명은 CSS 자동 줄바꿈이 아니라 JSX `<br />`로 문장 경계를 고정합니다.
2. 작업공간 상단 현재 YouTube 작업 채널 바에 위·아래 여백을 확보합니다.
3. 데스크톱 오른쪽 열 전체를 sticky + 내부 스크롤 구조로 만들어 `YouTube에 올리기`와 `현재 작업` 카드가 겹치지 않게 합니다.
4. 주요 화면 이동은 `초기 설정 / 연결 관리 / 작업하기` 공통 탭으로 구분합니다.
5. 세 주요 화면 모두 공통 `Subtitle Localizer` 타이틀바를 탭 위에 표시하며, 작업하기에서만 탭 아래에 현재 YouTube 작업 채널을 표시합니다.

버전은 계속 `v1.7.0`을 유지합니다.

## 보안 / 비용
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화합니다.
- 브라우저에는 HttpOnly cookie로 저장하며 localStorage/sessionStorage에 비밀정보를 두지 않습니다.
- SRT 파일은 서버 영구 저장소에 저장하지 않습니다.
- OpenAI 사용료는 사용자 OpenAI 계정에 청구됩니다.
- YouTube Data API quota는 사용자 Google Cloud 프로젝트를 사용합니다.
- 호스팅/function 비용만 배포자 Vercel 계정에 귀속됩니다.

## 배포 환경 변수
운영자 Vercel에는 다음만 필요합니다.

```text
APP_SESSION_SECRET=<충분히 긴 랜덤 문자열>
NEXT_PUBLIC_APP_URL=https://subtitle-localizer.vercel.app
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
```

사용자 OpenAI Key나 Google OAuth Client Secret은 환경 변수로 운영자가 보유하지 않습니다.

## 개발 / 검증
최종 v1.7.0 변경은 다음을 모두 통과해야 완료로 봅니다.
- 자동 테스트 전체 통과
- TypeScript 통과
- `next build` 통과
- GitHub `main` 반영
- Vercel Production READY
- 관련 Runtime Error 없음
- `/`, `/guide`, `/connections`의 공통 타이틀바·탭·활성 상태 확인
- `/`에서 `타이틀바 → 탭 → 현재 작업 채널` 순서 확인
- 기존 `/connections` 명시적 줄바꿈 유지 확인
- 전체 프로젝트 ZIP은 사용자에게만 제공하고 저장소에는 포함하지 않음
