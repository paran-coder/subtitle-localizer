# Subtitle Localizer v1.7.0

사용자가 자신의 OpenAI API Key(BYOK)와 Google Cloud OAuth Client(BYOC)를 연결해 SRT를 여러 언어로 현지화하고, 여러 YouTube 계정/채널의 자막을 가져오거나 다시 업로드하는 웹앱입니다.

## Production
- URL: `https://subtitle-localizer.vercel.app`
- 기본 화면: `/` = `작업하기`
- 초기 설정: `/guide`
- 연결 관리: `/connections`

## 핵심 기능
- SRT 업로드 또는 YouTube 기존 자막 가져오기
- cue ID와 시작/종료 타임코드를 유지하는 번역
- 다국어 동시 번역, 번역 스타일, 용어집
- SRT 개별 다운로드 / ZIP 다운로드
- YouTube 자막 업로드 및 업로드 직후 목록 갱신
- 여러 Google 계정 / YouTube 채널 연결·전환·해제
- SRT 파일명을 기본 YouTube 자막 트랙 이름으로 사용
- 브라우저 페이지 세로 스크롤 하나만 사용하는 작업 화면

## 화면 구조
모든 주요 화면은 `Subtitle Localizer 타이틀바 → 초기 설정 / 연결 관리 / 작업하기 탭 → 페이지 내용` 순서를 사용합니다.

작업하기(`/`)만 탭 아래에 `현재 YouTube 작업 채널` 바가 추가됩니다.

## OpenAI
- ChatGPT 구독과 OpenAI API Billing은 별도입니다.
- 사용자가 자신의 API Key와 API Billing을 직접 관리합니다.
- 앱 운영자의 공용 OpenAI Key를 사용하지 않습니다.
- 키는 서버에서 암호화하고 HttpOnly cookie로 보관합니다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.

## Google / YouTube
Google Cloud 최초 설정은 `/guide`의 8단계 안내를 따릅니다.

- 전용 프로젝트 권장명: `Subtitle Localizer`
- YouTube Data API v3 사용 설정
- Google Auth Platform: External
- 여러 계정 연결 시 Audience `In Production` 권장
- OAuth scope: `https://www.googleapis.com/auth/youtube.force-ssl`
- OAuth Client: `Web application`
- 권장 Client 이름: `Subtitle Localizer Web`
- Authorized JavaScript origins: 비움
- Authorized redirect URI: `https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

scope와 callback은 방문용 하이퍼링크가 아니라 Google Cloud에 복사해 입력하는 설정값입니다.

### 자막 API quota 안내
앱의 자막 기능이 사용하는 기본 quota 안내는 `10,000 units/일` 기준입니다.

- `captions.list`: 50 units
- `captions.download`: 200 units
- `captions.insert`: 400 units
- PT 자정에 일일 quota 초기화
- 소진 시 카드 결제로 즉시 구매하는 방식이 아니라 다음 초기화 대기 또는 YouTube quota 확장·심사

실제 프로젝트의 최종 quota는 해당 Google Cloud 프로젝트의 Quotas 화면을 기준으로 확인합니다.

## 보안
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화합니다.
- 실제 secret 값은 GitHub, 문서, 스크린샷, 로그에 넣지 않습니다.
- SRT 파일은 서버 영구 파일 저장소에 보관하지 않습니다.
- 운영자 Vercel에는 세션 암호화를 위한 `APP_SESSION_SECRET`이 필요합니다.

## 소셜 공유 / OG
v1.7.0은 사용자가 확정한 공유 이미지를 1200×630으로 제공합니다.

- OG image: `https://subtitle-localizer.vercel.app/og/subtitle-localizer`
- Open Graph: title / description / site name / locale / image / 1200×630 / alt / type
- Twitter: `summary_large_image`
- 공통 `metadataBase`: Production URL

OG 이미지는 `lib/og-image/part-00.ts` ~ `part-05.ts`의 최종 JPEG 데이터로 구성되며 `/og/subtitle-localizer`에서 `image/jpeg`로 제공합니다. 제작 과정의 `compact-*`, `final-*` 실험 데이터는 저장소에서 제거했습니다.

## 문서
- `context-notes.md`: 현재 제품 원칙과 Source of truth
- `checklist.md`: 최종 릴리스 검증 체크리스트
- `README.md`: 개발/운영 개요
- `User manual.md`: 사용자용 상세 사용 설명

과거 중복본 `User%20manual.md`는 제거했으며 `User manual.md`만 유지합니다.

## 개발 명령
```bash
npm install
npm test
npm run typecheck
npm run build
```

## 완료 기준
v1.7.0은 다음 조건이 모두 만족될 때 완료로 봅니다.

- GitHub `main` 반영
- 자동 테스트 전체 통과
- TypeScript 통과
- Next.js Production build 통과
- Vercel Production `READY`
- `/`, `/guide`, `/connections` HTTP 200
- 실제 Production HTML에서 Open Graph/Twitter 태그 확인
- OG 이미지 HTTP 200 / `image/jpeg` / 1200×630 확인
- Runtime `error` / `fatal` 없음
- 최종 ZIP에 secret 및 `.git` 미포함

제품 버전은 `v1.7.0`을 유지합니다.
