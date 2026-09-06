# context-notes.md — Subtitle Localizer v1.7.0

## Source of truth
- 제품 버전: `v1.7.0`
- GitHub: `paran-coder/subtitle-localizer` · `main`
- Vercel 프로젝트: `subtitle-localizer`
- Production: `https://subtitle-localizer.vercel.app`
- ZIP은 사용자 전달용으로만 생성하며 GitHub에는 올리지 않습니다.

## 제품 원칙
Subtitle Localizer는 사용자가 자신의 OpenAI API Key(BYOK)와 자신의 Google Cloud OAuth Client(BYOC)를 연결해 SRT를 현지화하고, 여러 YouTube 계정/채널에서 자막을 가져오거나 번역 결과를 다시 업로드하는 웹앱입니다.

- 운영자 소유 OpenAI API Key, Google OAuth Client, YouTube quota를 사용자 대신 사용하지 않습니다.
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화해 HttpOnly cookie로 저장합니다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.
- 업로드한 SRT 파일을 서버 영구 저장소에 보관하지 않습니다.
- 실제 secret 값은 문서, GitHub, 스크린샷, 로그에 평문으로 남기지 않습니다.

## 주요 화면
- `/guide` — `초기 설정`: OpenAI API Billing/API Key와 Google Cloud·YouTube 최초 설정
- `/connections` — `연결 관리`: OpenAI Key 교체/삭제, Google Client 관리, 채널 추가·전환·해제
- `/` — `작업하기`: SRT/YouTube 자막 가져오기, 번역, 구조 검증, 다운로드, YouTube 업로드

공통 상단 순서는 `Subtitle Localizer 타이틀바 → 초기 설정/연결 관리/작업하기 탭 → 페이지별 내용`입니다. 작업하기에서만 탭 아래 `현재 YouTube 작업 채널` 바가 추가됩니다.

## 완료된 핵심 흐름
- Google Cloud 최초 1회 설정과 Google Auth Platform 8단계 안내
- 여러 Google 계정/YouTube 채널 독립 OAuth 연결 및 활성 채널 전환
- SRT 업로드 또는 YouTube 기존 자막 가져오기
- cue ID/타임코드를 유지하는 다국어 번역
- 번역 결과 SRT/ZIP 다운로드
- YouTube 자막 업로드 후 목록 갱신 및 재가져오기 E2E
- SRT 파일명을 기본 YouTube 자막 트랙 이름으로 사용
- 데스크톱 우측 카드 내부 스크롤 제거 및 브라우저 세로 스크롤 하나로 통일
- 연결 관리 제목/설명의 명시적 JSX 줄바꿈

## 초기 설정과 비용
### OpenAI
- ChatGPT 구독과 OpenAI API Billing은 별도입니다.
- 유료 API 사용을 시작하려면 사용자가 OpenAI Platform에서 결제 수단/크레딧을 직접 관리합니다.
- 앱은 사용자의 카드 정보나 OpenAI 결제 정보를 받지 않습니다.

### Google / YouTube
- OAuth scope `https://www.googleapis.com/auth/youtube.force-ssl`과 callback `https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`은 클릭 링크가 아니라 Google Cloud에 복사해 입력하는 설정값입니다.
- 자막 API 기본 quota 안내는 `10,000 units/일` 기준으로 표시하며 `captions.list` 50, `captions.download` 200, `captions.insert` 400 units를 안내합니다.
- quota 소진은 카드 결제로 즉시 구매하는 방식이 아니라 일일 초기화 대기 또는 YouTube quota 확장·심사 흐름으로 안내합니다.

## 2026-09-06 최종 OG / 릴리스 감사 범위
사용자가 확정한 이미지를 1200×630으로 사용합니다.

- 실제 공개 OG 자산을 Production에서 직접 읽을 수 있어야 합니다.
- 공통 metadata에 `metadataBase`, Open Graph, Twitter `summary_large_image`를 설정합니다.
- OG 이미지에 `width: 1200`, `height: 630`, alt를 명시합니다.
- 홈 소스의 과거 `v1.6.4` 잔존 표시는 실제 `v1.7.0`으로 정리하고 CSS 텍스트 교체 우회를 제거합니다.
- 구버전 중복 문서 `User%20manual.md`는 삭제하고 `User manual.md`만 유지합니다.
- OG 제작 중 생성된 `compact-*`, `final-*` 실험 파일은 삭제했고, `lib/og-image/part-00.ts`~`part-05.ts`는 Production OG JPEG를 제공하는 최종 런타임 자산 데이터로 유지합니다.
- 제품 버전은 `v1.7.0`에서 올리지 않습니다.

## 최종 완료 기준
- GitHub `main`에 최종 코드·문서·OG 자산 반영
- 자동 테스트 전체 통과
- TypeScript 통과
- Next.js Production build 통과
- Vercel Production `READY`
- `/`, `/guide`, `/connections` HTTP 200
- 실제 Production HTML에 Open Graph/Twitter 태그 노출
- OG 이미지 Production URL HTTP 200 및 1200×630 확인
- Runtime `error`/`fatal` 없음
- 비밀정보 미포함 확인
- 최종 `subtitle-localizer-v1.7.0.zip`을 사용자에게만 전달