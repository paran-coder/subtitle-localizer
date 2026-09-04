# Subtitle Localizer v1.3.0

SRT의 cue ID와 타임코드를 유지한 채 여러 언어로 현지화하고, 결과를 검토·다운로드하거나 YouTube 자막 트랙으로 직접 업로드하는 Next.js 앱입니다.

v1.3.0부터는 로컬 SRT 파일이 없어도 **내 YouTube 영상 → 기존 자막 선택 → SRT 직접 가져오기 → 다국어 번역 → 검토 → YouTube 재업로드** 흐름을 사용할 수 있습니다.

## 핵심 기능
- 로컬 `.srt` 드래그앤드롭 / 파일 선택
- YouTube 영상의 기존 caption track 조회
- 선택한 YouTube caption track을 `srt` 형식으로 직접 가져오기
- 17개 언어 다국어 현지화
- 인접 cue 문맥 + cue 노출 시간(`durationMs`)을 활용한 번역
- 동적 chunk 처리 및 실패 후 완료 chunk 재사용
- cue ID / timestamp 보존 검증
- 언어별 읽기 길이 휴리스틱 QA
- 개별 SRT / 완료 언어 ZIP 다운로드
- Google OAuth / YouTube 채널 연결
- 최근 업로드 영상 최대 50개 선택
- 번역된 SRT를 YouTube caption track으로 직접 업로드
- 30-cue 현지화 테스트 샘플을 UI에서 즉시 불러오기

## UI 방향
제공된 ui-polish 워크플로와 Karrot/SEED 참고 토큰을 적용합니다.

- Product Primary: `#ff6f0f`
- Canvas: `#ffffff`
- Background: `#f2f3f6`
- Surface: `#f7f8fa`
- Foreground: `#212124`
- Muted: `#868b94`
- Hairline: `#eaebee`
- Brand Tint: `#fff5f0`
- System font stack
- 4px 기반 spacing rhythm
- Primary orange는 핵심 행동과 선택 상태에 제한
- 장식용 blur/glass를 사용하지 않음
- 최소한의 shadow만 계층 구분에 사용
- 150/250/350ms restrained motion + `prefers-reduced-motion`

## Stack
- Next.js 16.3.4
- React / React DOM 19.2.8
- TypeScript
- OpenAI Responses API
- JSZip
- YouTube Data API v3
- Node `crypto` AES-256-GCM

## Environment variables
`.env.example`을 기준으로 설정합니다.

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

- `SUBTITLE_APP_ACCESS_KEY`: 공개 배포의 `/api/translate` 무단 호출을 막는 앱 보호 키입니다.
- `YOUTUBE_SESSION_SECRET`: 최소 24자 이상의 랜덤 문자열을 사용합니다.
- YouTube 환경변수가 없더라도 로컬 SRT 번역/다운로드는 동작합니다.

## Local validation
```bash
npm install
npm run test
npm run typecheck
npm run build
```

전체 검증:

```bash
npm run check
```

## Google / YouTube OAuth 설정
1. Google Cloud 프로젝트에서 **YouTube Data API v3**를 활성화합니다.
2. OAuth consent screen을 구성합니다.
3. OAuth Client ID 유형을 **Web application**으로 만듭니다.
4. Authorized redirect URI에 callback을 등록합니다.

현재 배포 주소 기준:

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

OAuth scope는 `https://www.googleapis.com/auth/youtube.force-ssl` 하나를 사용합니다.

## YouTube import flow
내부 앱 API는 quota를 소비하는 자막 목록/다운로드 요청을 POST로 감싸 외부 링크나 프리패치에 의한 우발 호출 가능성을 줄입니다.

```text
YouTube 연결
→ 원본 영상 선택
→ caption track 목록 조회
→ 원본 자막 선택
→ SRT 가져오기
→ 기존 번역 파이프라인
→ 검토/다운로드
→ 같은 영상 또는 다른 내 영상에 업로드
```

YouTube Data API 기준:
- `captions.list`: 50 quota units
- `captions.download`: 200 quota units
- `captions.insert`: 400 quota units / 업로드 1회

## Translation behavior
- cue ID와 timestamp는 번역 대상이 아닙니다.
- 주변 cue는 문맥으로만 사용합니다.
- 번역 결과는 `{items:[{id,text}]}` 구조로 검증합니다.
- KO/JA/ES에는 언어별 자연스러운 어순·대명사·길이 지침을 추가합니다.
- QA 경고는 자동 재작성 명령이 아니라 사람이 검토할 포인트입니다.

## Samples
- `samples/demo-en.srt`
- `samples/demo-ko.srt`
- `samples/demo-ja.srt`
- `samples/demo-es.srt`
- `samples/localization-challenge-en.srt`
- `samples/quality-review.md`
- 배포 UI용 정적 샘플: `public/samples/localization-challenge-en.srt`

`localization-challenge-en.srt`는 30 cue이며 다음을 포함합니다.
- cue 경계를 넘는 문장
- `break a leg` 같은 관용 표현
- 영어 대명사 `you`
- 1.8초 노출 시간
- ChatGPT / OpenAI / Subtitle Localizer 고유명사
- `12,480`, `37 minutes` 같은 수치
- multiline cue

## Validation status
- automated logic tests: **28/28 pass**
- TS/TSX transpile syntax: **22 files / 0 syntax errors**
- CSS delimiter check: pass
- hard-coded `sk-*` OpenAI secret: none

현재 실행 환경에는 `node_modules`가 없고 npm registry 접근이 제한되어 dependency-aware `tsc --noEmit` / Next production build는 완료하지 못했습니다. GitHub에 올린 뒤 `npm install && npm run check`를 마지막으로 실행하는 것이 권장됩니다.

## Known limits
- 영상 선택기는 uploads playlist의 최근 50개까지만 표시합니다.
- 기존 자막을 자동 삭제하거나 덮어쓰지 않습니다.
- DB를 사용하지 않으며 YouTube token은 암호화된 HttpOnly cookie에 저장합니다.
- `captions.download`는 해당 영상을 편집할 권한이 있는 인증 사용자에게만 가능합니다.
- 제공된 production URL은 이 실행 환경에서 DNS/remote fetch가 되지 않아 실제 DOM/pixel QA는 수행하지 못했습니다.
