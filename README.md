# Subtitle Localizer v1.2.0

영문 `.srt`를 여러 언어로 현지화하면서 cue ID와 타임코드를 유지하고, 결과를 검토·다운로드하거나 선택한 YouTube 영상에 자막 트랙으로 직접 업로드하는 Next.js 앱입니다.

## 핵심 기능
- 로컬 SRT 파싱/검증: BOM, CRLF, multiline cue 지원
- 17개 언어 다국어 현지화
- 문맥 인접 cue + 화면 노출 시간(`durationMs`)을 활용한 번역 프롬프트
- 동적 chunk 처리 및 실패 후 완료 chunk 재사용
- cue ID / timestamp 보존 검증
- 언어별 읽기 길이 휴리스틱 QA
- 개별 SRT / 완료 언어 ZIP 다운로드
- 선택적 Google OAuth / YouTube 채널 연결
- 최근 업로드 영상 최대 50개 선택
- 완료된 SRT를 YouTube caption track으로 직접 업로드
- 같은 언어+트랙명 충돌을 자동 삭제하지 않고 사용자에게 표시

## UI 방향
제공된 ui-polish 워크플로와 Karrot/SEED 참고 토큰을 적용했습니다.
- Product Primary `#ff6f0f`
- Background `#f2f3f6`, Surface `#f7f8fa`, Foreground `#212124`
- Hairline `#eaebee`, Brand Tint `#fff5f0`
- System font stack
- 4px 기반 spacing rhythm
- 오렌지는 primary action과 active state 중심으로 제한
- 그림자/blur 최소화
- 150/250/350ms restrained motion + `prefers-reduced-motion`

## Stack
- Next.js 16.3.4
- React / React DOM 19.2.8
- TypeScript
- OpenAI Responses API
- JSZip
- YouTube Data API v3
- Node `crypto` AES-256-GCM (OAuth session cookie)

## Environment variables
`.env.example`을 복사해 설정합니다.

```bash
OPENAI_API_KEY=
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
SUBTITLE_APP_ACCESS_KEY=

# Optional YouTube integration
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_SESSION_SECRET=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `SUBTITLE_APP_ACCESS_KEY`: 공개 Vercel 배포의 `/api/translate` 무단 호출을 막는 앱 보호 키입니다.
- `YOUTUBE_SESSION_SECRET`: 최소 24자 이상, 충분히 긴 랜덤 문자열을 사용하세요.
- YouTube 4개 환경변수가 없으면 로컬 SRT 번역/다운로드는 그대로 작동하고 YouTube 패널만 비활성화됩니다.

## Local
```bash
npm install
npm run test
npm run typecheck
npm run build
```

전체 검증은 다음 명령으로 묶여 있습니다.

```bash
npm run check
```

## Google / YouTube OAuth 설정
1. Google Cloud 프로젝트에서 **YouTube Data API v3**를 활성화합니다.
2. OAuth consent screen을 구성합니다.
3. OAuth Client ID 유형을 **Web application**으로 만듭니다.
4. Authorized redirect URI에 배포 주소의 callback을 정확히 추가합니다.

현재 배포 주소를 사용할 경우:

```text
https://subtitle-localizer.vercel.app/api/youtube/oauth/callback
```

Vercel 환경변수:

```text
NEXT_PUBLIC_APP_URL=https://subtitle-localizer.vercel.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
YOUTUBE_SESSION_SECRET=...
```

이 앱은 caption upload에 필요한 `https://www.googleapis.com/auth/youtube.force-ssl` scope 하나를 요청합니다. 공개 사용자에게 배포하는 OAuth 앱은 Google의 OAuth verification 요구 대상이 될 수 있습니다. 개인 테스트 단계에서는 OAuth consent screen의 test user 구성을 사용할 수 있습니다.

## YouTube quota
`captions.insert`는 언어 1개 업로드마다 400 quota units를 사용합니다. YouTube Data API의 일반 기본 quota bucket은 일일 10,000 units이므로, 다른 API 사용이 전혀 없다는 단순 계산에서는 약 25개의 caption insert가 해당됩니다. 실제 사용 가능량은 Google Cloud Console의 현재 quota를 기준으로 판단하세요.

## Translation model
기본값은 `gpt-5.6-luna`입니다. 비용 민감·대량 텍스트 작업용으로 두고, 필요하면 `OPENAI_TRANSLATION_MODEL`만 바꾸도록 설계했습니다.

## Tests / samples
- `samples/demo-en.srt`
- `samples/demo-ko.srt`
- `samples/demo-ja.srt`
- `samples/demo-es.srt`
- `samples/quality-review.md`

현재 로직 테스트는 SRT 구조, 장문 chunking, 번역 응답 ID 검증, KO/JA/ES fixture timing, OAuth session 암복호화, YouTube upload-list 조회, multipart caption upload, duplicate caption conflict 등을 포함합니다.

## v1.2.0 제한사항
- YouTube video picker는 최근 uploads playlist 50개까지만 보여줍니다.
- 기존 caption track을 자동 삭제/덮어쓰지 않습니다.
- 데이터베이스를 사용하지 않습니다. YouTube token은 암호화된 HttpOnly cookie에 보관합니다.
- 원격 Vercel DOM을 이 개발 환경에서 가져오지 못해 실제 배포 화면의 브라우저 픽셀 QA는 배포 후 별도 확인 항목입니다.
- 이 실행 환경에서는 npm registry DNS가 차단되어 production `npm install / typecheck / build`를 끝까지 실행하지 못했습니다. 로직 테스트와 TS/TSX transpile syntax 검사는 통과했습니다.
