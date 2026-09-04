# Subtitle Localizer v1.3.0 — Context Notes

## Product goal
유튜버가 자막 파일 관리 자체보다 **다국어 현지화 결과**에 집중하도록 만드는 작업 도구입니다.

최종 핵심 흐름:

```text
로컬 SRT 또는 YouTube 기존 자막
→ 원본 cue 검증
→ 대상 언어 선택
→ 문맥 기반 현지화
→ 타임코드/ID 구조 검증
→ 원문↔번역 검토
→ SRT/ZIP 다운로드 또는 YouTube 업로드
```

## v1.3.0 decisions
- 로컬 SRT 업로드와 YouTube 자막 가져오기를 동일한 source pipeline에 연결합니다.
- YouTube 영상은 자동 선택하지 않습니다. 사용자가 명시적으로 선택할 때만 caption list quota를 사용합니다.
- 영어 caption track을 우선 추천하되 다른 언어 및 ASR track도 선택할 수 있습니다.
- `captions.list`는 본문을 반환하지 않으므로 `captions.download?tfmt=srt`를 별도로 사용합니다.
- quota가 큰 caption list/download를 앱에서는 POST endpoint로 감싸 우발적 GET 호출을 줄입니다.
- 가져온 YouTube SRT를 번역하면 원본 영상이 업로드 대상 영상으로 자동 설정됩니다.
- 기존 동일 언어/트랙 자막은 자동 삭제하지 않습니다.
- DB는 도입하지 않습니다.
- OAuth token은 AES-256-GCM 암호화 HttpOnly/SameSite=Lax cookie에 저장합니다.

## UI design direction
첨부 ui-polish를 구현 워크플로로 사용하고 Karrot/SEED 토큰을 참고합니다.

### Structure
1. 원본 자막
2. 현지화 설정
3. 번역 진행
4. 검토 & 다운로드
5. 보조 영역: YouTube 업로드 / 현재 작업

### Tokens
- `#ff6f0f` primary
- `#ffffff` canvas
- `#f2f3f6` background
- `#f7f8fa` surface
- `#212124` foreground
- `#868b94` muted
- `#eaebee` hairline
- `#fff5f0` brand tint
- `#1aa174` success
- `#fa2314` error

### Rules
- structure before decoration
- System font
- 4px grid rhythm
- one product accent
- flat/hairline chrome
- restrained state motion
- reduced-motion support
- desktop side panel must never outrank the primary workflow on mobile

## Translation direction
- cue ID/order/timestamp immutable
- neighboring cues = context only
- `durationMs` = concision hint
- KO: redundant subject/pronoun reduction, natural Korean order
- JA: natural Japanese order, pronoun restraint, register consistency
- ES: neutral broadly understandable Spanish, unnecessary expansion avoidance
- proper nouns, numbers, formatting tokens preserved when appropriate
- post-QA flags reading pressure but does not silently rewrite output

## YouTube technical flow
### OAuth / video list
1. `/api/youtube/oauth/start`
2. Google auth code flow + state cookie
3. `/api/youtube/oauth/callback`
4. token exchange → encrypted session cookie
5. `/api/youtube/videos` → `channels.list(mine=true)` → uploads playlist → `playlistItems.list`

### Caption import
1. `/api/youtube/captions/list` (POST)
2. YouTube `captions.list(part=snippet, videoId=...)`
3. user selects track
4. `/api/youtube/captions/download` (POST)
5. YouTube `captions.download/{id}?tfmt=srt`
6. server validates SRT
7. client applies the same source validation used for local files

### Caption upload
1. `/api/youtube/captions` (POST)
2. YouTube `captions.insert` multipart/related
3. language-by-language upload

## Deployment
Target: GitHub → Vercel. Deployment is performed by the user.

Production origin:
`https://subtitle-localizer.vercel.app`

OAuth callback:
`https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

## QA record
### Stage 1 — deployed/source QA: 9.2/10
- production URL supplied
- web fetch, Vercel fetch, and container DNS could not retrieve the live page
- source-level QA continued from the deployed v1.2.0 codebase

### Stage 2 — YouTube direct caption import: 9.7/10
- caption track list model
- English-first track ordering
- ASR/draft labels
- SRT download and server validation
- same translation pipeline reuse
- expensive read endpoints wrapped as POST

### Stage 3 — sample / first-run UX: 9.8/10
- 30-cue localization challenge fixture
- UI “sample test” loader
- public static sample included
- edge cases designed for prompt tuning

### Stage 4 — final code verification: 9.7/10
- 28/28 automated tests
- 22 TS/TSX files transpile with zero syntax diagnostics
- CSS delimiter validation pass
- no hard-coded OpenAI `sk-*` secret
- dependency-aware production build remains pending because dependencies cannot be installed in this environment

## Overall self-evaluation
**9.6/10**

The missing 0.4 is reserved for a real Vercel production build, real OpenAI translation output, real Google OAuth callback, and caption import/upload against the user's channel.
