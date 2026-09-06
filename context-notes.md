# context-notes.md — Subtitle Localizer v1.7.0

## 제품 목표
Subtitle Localizer는 사용자가 자신의 OpenAI API Key(BYOK)와 자신의 Google Cloud OAuth Client(BYOC)를 연결해 SRT를 현지화하고, 여러 YouTube 계정/채널에서 자막을 가져오거나 번역 결과를 다시 업로드하는 웹앱입니다.

v1.7.0의 핵심 목표는 두 가지입니다.
1. Google Cloud 설정은 최초 1회만 하고 이후에는 앱 안에서 계정/채널을 추가·전환할 수 있게 한다.
2. 초보자가 OAuth 구조를 이해하지 않아도 실제 Google 화면의 버튼 순서만 따라가면 설정을 끝낼 수 있게 한다.

## 제품 원칙
- 운영자 소유 Google OAuth Client, Google Cloud 프로젝트, YouTube quota를 사용하지 않는다.
- OpenAI 비용은 사용자 OpenAI 계정, YouTube quota는 사용자 Google Cloud 프로젝트에 귀속된다.
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화한 HttpOnly cookie에 저장한다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않는다.
- 업로드한 SRT 파일을 서버의 영구 파일 저장소에 보관하지 않는다.
- 작업공간에서는 하나의 활성 YouTube 채널을 명확히 선택하며 영상 조회/자막 조회/다운로드/업로드가 모두 같은 활성 채널을 사용해야 한다.

## Google Cloud 초기 설정
초기 마법사는 현재 Google Auth Platform 흐름에 맞춰 다음을 안내한다.
1. 전용 Google Cloud 프로젝트 생성/선택
2. YouTube Data API v3 사용 설정
3. Google Auth Platform 기본 정보 및 Branding
4. 홈페이지 `https://subtitle-localizer.vercel.app/`
5. 개인정보처리방침 `https://subtitle-localizer.vercel.app/privacy`
6. 서비스 약관 `https://subtitle-localizer.vercel.app/terms`
7. Audience를 `In Production`으로 전환하는 권장 경로
8. `https://www.googleapis.com/auth/youtube.force-ssl` scope 추가
9. Web application OAuth Client 생성
10. Authorized JavaScript origins는 비워두고 Authorized redirect URIs에만 callback 등록
11. Client ID/Secret 저장
12. 첫 YouTube 채널 연결

`Client 저장됨`과 `Google Publishing 완료`는 별개 상태다. 앱은 Google Console의 실제 Publishing 상태를 자동 판별하지 못하므로 Client 저장만으로 Cloud 설정 전체가 완료됐다고 단정하지 않는다.

## 실제 E2E에서 확인된 Google OAuth 동작
2026-09-06 실제 E2E에서 다음을 확인했다.
- Testing 상태에서는 새 Google 계정이 `403 access_denied`로 차단됨.
- Branding의 앱 도메인 정보를 저장하고 Audience를 `In Production`으로 전환한 뒤 새 Google 계정 연결이 가능해짐.
- 미검증 Production 앱은 Google의 확인되지 않은 앱 경고가 나타날 수 있음.
- 고급 경고를 통과한 뒤 실제 YouTube 권한 동의와 OAuth callback이 정상 완료됨.

## 다중 YouTube 연결
Cloud config 하나를 여러 채널 연결이 재사용한다.

채널별로 다음 정보를 독립 저장한다.
- connectionId
- channelId
- channelTitle
- channelThumbnail
- accessToken
- refreshToken
- expiresAt
- scope
- connectedAt

같은 channelId를 다시 연결하면 중복 생성하지 않고 기존 연결을 갱신한다. 한 채널을 연결 해제해도 다른 연결은 유지한다.

## 채널 전환 E2E
실제 두 Google 계정/채널을 연결해 다음을 확인했다.
- 기존 채널을 유지한 채 새 채널 추가 성공
- 작업공간 채널 전환 성공
- 상단 현재 작업 채널과 오른쪽 YouTube 업로드 패널이 같은 채널로 동기화
- 채널별 영상 목록 분리 확인(영상 27개 채널 ↔ 영상 0개 채널)
- 빈 채널에서는 원인 설명과 YouTube Studio/다시 불러오기 행동 제공

전환 과정에서 연결 관리의 활성 채널과 작업공간 표시가 어긋나는 버그를 발견했고, 선택 대상의 OAuth 세션/channelId를 검증한 뒤 활성화하도록 보강했다.

## 자막 업로드/가져오기 실제 E2E
테스트 파일명은 별칭 없이 실제 이름을 사용한다.
- 영상: `subtitle-localizer-e2e-test.mp4`
- 원본 영문 SRT: `localization-challenge-en.srt`

실제 E2E에서 다음이 성공했다.
- `localization-challenge-en.srt` 30 cue 로드
- 한국어 1개 언어 번역 완료
- 타임코드 30/30, Cue ID 30/30, 누락 0, 추가 0 구조 검증 통과
- 앱에서 `subtitle-localizer-e2e-test.mp4`가 업로드된 YouTube 영상 선택
- Subtitle Localizer의 YouTube 업로드 기능으로 한국어 자막 업로드 성공
- YouTube API에서 `ko · Subtitle Localizer` 트랙 확인
- 같은 트랙을 SRT로 다시 다운로드해 30 cue 가져오기 성공

## 2026-09-06 E2E에서 발견 및 보완 완료한 UX 문제
기능 E2E에서 다음 두 문제가 사용자 혼란을 만들었고, 수정 후 Production에서 다시 확인했다.

### 1. 업로드 직후 같은 영상의 자막 목록이 갱신되지 않음
현재 자막 목록 조회 effect는 `sourceVideoId` 변경에만 반응한다. 같은 영상을 선택한 상태에서 앱이 새 자막을 업로드하면 `기존 자막 0개`가 그대로 남고, 다른 영상을 선택했다 돌아와야 새 트랙이 보인다.

구현 결과:
- YouTube 자막 업로드 성공 후, 업로드 대상 영상이 현재 `원본 영상`과 같으면 자막 목록을 즉시 재조회한다.
- Production에서 같은 영상의 새 `ko · Subtitle Localizer` 트랙이 수동 우회 없이 바로 노출되는 것을 확인했다.

### 2. YouTube 자막 가져오기 성공 표시가 불명확함
현재 `SRT 가져오기` 성공 메시지가 오른쪽 YouTube 업로드 패널 쪽 공용 메시지로 보여 사용자가 실제 원본이 바뀌었는지 확신하기 어렵다.

구현 결과:
- `원본 자막` 영역 안에 `가져오기 완료` 성공 상태를 표시한다.
- 언어, cue 수, 영상 제목, 트랙 이름, 생성된 원본 파일명을 함께 표시한다.
- YouTube에서 가져온 원본 언어가 앱 지원 번역 언어와 일치하면 그 언어는 번역 대상 선택에서 자동 해제한다.
- Production에서 한국어 30 cue 가져오기와 한국어 대상 자동 해제를 확인했다.

## 이번 보완의 완료 상태
- [x] 업로드 성공 직후 동일 영상의 `기존 자막` 목록 자동 갱신
- [x] `SRT 가져오기` 직후 원본 영역의 명확한 성공 상태
- [x] 가져온 언어와 동일한 번역 대상 자동 해제
- [x] 실제 Production E2E 재검증
- [x] 자동 테스트 77/77 통과
- [x] Vercel Production READY 및 관련 Runtime Error 없음 확인
- [x] 전체 v1.7.0 ZIP은 사용자에게만 제공하고 GitHub에는 커밋하지 않음

## 2026-09-06 UI 레이아웃 보완
실제 화면에서 확인된 세 가지 시각 문제를 v1.7.0 안에서 보완한다.
- 연결 관리 제목/설명 문장의 어색한 줄바꿈 완화
- 현재 YouTube 작업 채널 바와 본문 사이의 위·아래 간격 정리
- 데스크톱 스크롤 시 우측 `YouTube에 올리기` 카드와 `현재 작업` 카드가 겹치지 않도록 우측 열 전체를 sticky/내부 스크롤 구조로 변경

버전은 그대로 v1.7.0을 유지한다.
