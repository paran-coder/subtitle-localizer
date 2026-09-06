# context-notes.md — Subtitle Localizer v1.7.0

## 제품 목표
Subtitle Localizer는 사용자가 자신의 OpenAI API Key(BYOK)와 자신의 Google Cloud OAuth Client(BYOC)를 연결해 SRT를 현지화하고, 여러 YouTube 계정/채널에서 자막을 가져오거나 번역 결과를 다시 업로드하는 웹앱입니다.

v1.7.0의 핵심 목표는 다음과 같습니다.
1. Google Cloud 설정은 최초 1회만 하고 이후에는 앱 안에서 계정/채널을 추가·전환합니다.
2. 초보자가 OAuth 구조를 이해하지 않아도 실제 Google 화면의 버튼 순서만 따라가면 설정을 끝낼 수 있게 합니다.
3. 처음 접속한 사용자가 OpenAI API Key와 YouTube 연결을 각각 왜 필요한지, 어디서 만들고, 앱의 어느 칸에 넣는지 한 페이지에서 이해할 수 있게 합니다.

## 제품 원칙
- 운영자 소유 Google OAuth Client, Google Cloud 프로젝트, YouTube quota를 사용하지 않습니다.
- OpenAI 비용은 사용자 OpenAI 계정, YouTube quota는 사용자 Google Cloud 프로젝트에 귀속됩니다.
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화한 HttpOnly cookie에 저장합니다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.
- 업로드한 SRT 파일을 서버의 영구 파일 저장소에 보관하지 않습니다.
- 작업공간에서는 하나의 활성 YouTube 채널을 명확히 선택하며 영상 조회/자막 조회/다운로드/업로드가 모두 같은 활성 채널을 사용해야 합니다.
- 실제 secret 값은 문서, GitHub, 스크린샷, 로그에 평문으로 남기지 않습니다.

## 현재 버전 / Source of truth
- 제품 버전: `v1.7.0` 유지
- GitHub: `paran-coder/subtitle-localizer`의 `main`만 사용
- Vercel: `subtitle-localizer` 프로젝트만 사용
- Production URL: `https://subtitle-localizer.vercel.app`
- 가이드 기능 검증 커밋: `636ff89f33dc62bcd10e8dd87fce008962a78368`
- 가이드 기능 검증 배포: `dpl_6dbX6JQ6sp8ZYuDmXqwp7ucQG2uQ` · `READY`
- 자동 테스트: 78/78 통과
- TypeScript / Next.js Production build: 통과
- 관련 Runtime Error: 확인 범위 0건

## Google Cloud 초기 설정
초기 마법사는 현재 Google Auth Platform 흐름에 맞춰 다음을 안내합니다.
1. 전용 Google Cloud 프로젝트 `Subtitle Localizer` 생성/선택
2. YouTube Data API v3 사용 설정
3. Google Auth Platform 기본 정보와 Branding
4. 홈페이지 `https://subtitle-localizer.vercel.app/`
5. 개인정보처리방침 `https://subtitle-localizer.vercel.app/privacy`
6. 서비스 약관 `https://subtitle-localizer.vercel.app/terms`
7. Audience를 `In Production`으로 전환하는 권장 경로
8. `https://www.googleapis.com/auth/youtube.force-ssl` scope 추가
9. Web application OAuth Client `Subtitle Localizer Web` 생성
10. Authorized JavaScript origins는 비움
11. Authorized redirect URIs에는 `https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`만 등록
12. Client ID/Secret 저장
13. 첫 YouTube 채널 연결

`Client 저장됨`과 `Google Publishing 완료`는 별개 상태입니다. 앱은 Google Console의 실제 Publishing 상태까지 자동 판별하지 않습니다.

## 실제 E2E에서 확인한 Google OAuth 동작
2026-09-06 실제 E2E에서 다음을 확인했습니다.
- Testing 상태에서는 새 Google 계정이 `403 access_denied`로 차단될 수 있습니다.
- Branding 공개 URL을 저장하고 Audience를 `In Production`으로 전환한 뒤 추가 계정 연결이 가능해졌습니다.
- 미검증 Production 앱은 Google의 `확인되지 않은 앱` 경고가 나타날 수 있습니다.
- 승인 후 실제 YouTube 권한 동의와 OAuth callback이 정상 완료됐습니다.

## 다중 YouTube 연결
Cloud config 하나를 여러 채널 연결이 재사용합니다. 채널별 `connectionId`, `channelId`, 채널 메타데이터, access/refresh token, 만료시각, scope, 연결시각을 독립 저장합니다.

확인 완료:
- 기존 채널 유지 상태에서 새 Google 계정/채널 추가
- 두 채널 사이 활성 채널 전환
- 상단 현재 작업 채널과 오른쪽 YouTube 업로드 패널 동기화
- 채널별 영상 목록 분리
- 영상 0개 채널의 빈 상태 UX
- 한 채널 연결 해제 시 다른 연결 유지

## 자막 업로드/가져오기 실제 E2E
실제 검증 파일:
- 영상: `subtitle-localizer-e2e-test.mp4`
- 원본 SRT: `localization-challenge-en.srt`

확인 완료:
- 30 cue 로드
- 한국어 번역
- 타임코드 30/30, Cue ID 30/30, 누락 0, 추가 0
- 한국어 YouTube 자막 업로드
- `ko · Subtitle Localizer` 트랙 조회
- 같은 트랙을 SRT로 재가져오기
- 업로드 직후 동일 영상 자막 목록 자동 갱신
- 가져온 원본 언어와 동일한 번역 대상 자동 해제

## 2026-09-06 UI 레이아웃 보완 최종 상태
세 가지 UI 문제는 v1.7.0에서 코드와 Production까지 반영됐습니다.
- 연결 관리 제목: `처음 한 번만 설정하고,` / `이후에는 채널만 추가하세요.`를 JSX `<br />`로 명시 분리
- 연결 관리 설명: `Google Cloud는 사용자가 직접 소유합니다.` / `앱은 초보자가 판단할 일을 줄이고 꼭 필요한 클릭과 입력만 순서대로 안내합니다.`를 JSX `<br />`로 명시 분리
- 현재 YouTube 작업 채널 바의 상·하 여백 보완
- 데스크톱 우측 열을 sticky + 내부 스크롤 구조로 바꿔 `YouTube에 올리기`와 `현재 작업` 카드 겹침 방지
- Production `/connections` HTML에서 명시적 줄바꿈 유지 확인

## 2026-09-06 첫 사용자 가이드 완료
신규 버전으로 올리지 않고 v1.7.0 안에서 `/guide` 페이지를 구현했습니다.

### 가이드 내용
- 시작 전 준비물과 전체 연결 구조
- OpenAI API Key의 용도, 비용 주체, 생성/복사/연결/교체 흐름
- ChatGPT 구독과 OpenAI API 사용료가 별도라는 안내
- 사용자 API Key의 암호화 + HttpOnly cookie 저장 원칙
- Google Cloud Project → YouTube API → Auth Platform → Audience → Scope → OAuth Client → Channel의 전체 흐름
- 앱의 실제 Google 8단계 마법사와 동일한 고정값
- Branding 공개 URL 3개
- `youtube.force-ssl` scope
- `Authorized JavaScript origins`와 `Authorized redirect URIs`의 차이
- `403 access_denied`, `redirect_uri_mismatch`, `확인되지 않은 앱`, 영상 0개 등 문제 해결
- 연결 후 SRT 번역, YouTube 자막 가져오기/업로드, 추가 채널 전환 흐름
- 보안 및 비용 소유 구조 요약

### 사용자 진입점
- 작업공간 상단: `처음 사용 가이드`
- 연결 관리 상단: `설정 가이드 보기`
- 사이트 푸터: `처음 사용 가이드`

### UI / 접근성
- 데스크톱: 좌측 sticky 목차 + 본문 카드
- 모바일: 단일 열 재배치
- focus-visible 유지
- prefers-reduced-motion 유지
- 기존 v1.7.0 디자인 언어 유지

### Production 검증
- `/guide`: HTTP 200, 핵심 OpenAI/Google 안내와 링크 반영 확인
- `/connections`: HTTP 200, 새 설정 가이드 진입점과 기존 명시적 줄바꿈 유지 확인
- 테스트 78/78 통과
- TypeScript 통과
- Next.js Production build 통과
- Vercel Production `READY`
- 확인 범위 Runtime `error`/`fatal` 0건

## 버전 표시 메모
`app/page.tsx`에는 과거 `v1.6.4` 문자열이 레거시 마크업으로 남아 있지만, `app/v17-version.css`가 홈 브랜드와 내부 푸터의 사용자 표시를 `v1.7.0`으로 명시 교체합니다. 실제 제품 버전과 package.json은 `1.7.0`이며 이번 작업에서도 버전을 올리지 않았습니다.
