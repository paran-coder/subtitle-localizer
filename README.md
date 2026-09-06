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

## v1.7.0 Google / YouTube 연결
v1.7.0은 Google Cloud 설정과 YouTube 채널 연결을 분리합니다.

사용자는 자신의 Google Cloud 프로젝트에 YouTube Data API v3와 Google Auth Platform을 설정하고, 하나의 OAuth Web Client를 Subtitle Localizer에 저장합니다. 이후 앱의 `+ 계정 또는 채널 추가`를 통해 여러 Google 계정/YouTube 채널을 계속 연결할 수 있습니다.

권장 초기 설정에는 다음이 포함됩니다.
- Google Auth Platform External
- Branding 공개 URL
  - `https://subtitle-localizer.vercel.app/`
  - `https://subtitle-localizer.vercel.app/privacy`
  - `https://subtitle-localizer.vercel.app/terms`
- Audience `In Production` 권장
- scope `https://www.googleapis.com/auth/youtube.force-ssl`
- OAuth Client type `Web application`
- Authorized JavaScript origins 비움
- Authorized redirect URIs에 앱 callback만 등록

미검증 Production 앱은 Google의 확인되지 않은 앱 경고가 나타날 수 있습니다.

## 다중 채널
각 YouTube 채널은 독립된 OAuth 세션으로 저장됩니다. 작업공간에서 활성 채널을 바꾸면 영상 목록과 자막 가져오기/업로드 대상도 해당 채널로 바뀝니다.

실제 E2E에서 다음을 확인했습니다.
- 기존 채널을 유지한 채 두 번째 Google 계정/채널 추가
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

## v1.7.0 실제 E2E 보완 완료
실제 E2E에서 발견한 다음 UX 문제까지 수정하고 Production에서 재검증했습니다.

1. **업로드 직후 동일 영상의 기존 자막 목록 자동 갱신**
   - 기존에는 `sourceVideoId`가 바뀔 때만 자막 목록을 조회해, 같은 영상에 새 자막을 올린 뒤 `0개`가 남을 수 있었습니다.
   - 업로드 성공 후 현재 원본 영상과 같은 영상이면 자막 목록을 즉시 재조회합니다.

2. **YouTube 자막 가져오기 성공 상태 명확화**
   - 가져오기 성공 메시지를 `원본 자막` 영역 안에 표시합니다.
   - 언어, cue 수, 영상 제목/생성 파일명을 보여 사용자가 원본이 실제로 바뀌었는지 즉시 확인할 수 있습니다.
   - 가져온 원본 언어가 번역 대상 언어와 같으면 해당 언어를 자동 해제합니다.

Production 재검증에서 `ko · Subtitle Localizer` 트랙의 즉시 노출, `가져오기 완료 · 30 cue` 표시, 한국어 번역 대상 자동 해제를 확인했습니다.

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
최종 v1.7.0은 다음을 모두 통과해야 완료로 봅니다.
- 자동 테스트 전체 통과
- TypeScript 통과
- `next build` 통과
- GitHub `main` 반영
- Vercel Production READY
- 관련 Runtime Error 없음
- 전체 프로젝트 ZIP 사용자 제공(저장소에는 포함하지 않음)
