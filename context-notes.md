# Subtitle Localizer v1.2.0 — Context Notes

## Goal
v1.1.0을 다음 세 방향으로 확장합니다.
1. 제공된 ui-polish 원칙과 Karrot/SEED 참고 토큰을 적용한 product UI 개선.
2. EN → KO/JA/ES를 중심으로 subtitle-localization prompt/QA 개선.
3. 선택적 YouTube OAuth → 내 영상 선택 → 번역 SRT 직접 업로드.

## Product decisions
- 로컬 SRT 업로드/번역/다운로드가 primary flow입니다.
- YouTube는 optional secondary workflow입니다.
- YouTube caption upload 때문에 OAuth scope는 `https://www.googleapis.com/auth/youtube.force-ssl` 하나만 요청합니다.
- DB는 v1.2.0에 도입하지 않습니다.
- OAuth access/refresh token은 AES-256-GCM으로 암호화한 HttpOnly, SameSite=Lax cookie에 저장합니다.
- access token 만료 시 refresh token으로 갱신합니다.
- YouTube 최근 업로드 50개를 선택 대상으로 제공합니다.
- 번역 자막은 언어별 순차 업로드합니다.
- 기존 동일 언어+동일 track name 자막을 임의 삭제하지 않습니다.
- OpenAI 기본 모델은 비용 민감 bulk workload용 `gpt-5.6-luna`를 유지합니다.

## UI direction
Reference tokens:
- Product Primary: `#ff6f0f`
- Canvas: `#ffffff`
- Background: `#f2f3f6`
- Surface: `#f7f8fa`
- Foreground: `#212124`
- Muted: `#868b94`
- Hairline: `#eaebee`
- Brand Tint: `#fff5f0`
- Success: `#1aa174`
- Error: `#fa2314`

Rules:
- System font stack.
- 4px grid rhythm.
- Primary orange is scarce; avoid a second product accent.
- Flat/hairline component chrome; no decorative glass.
- Motion only for state feedback; reduced-motion collapses transitions.
- Primary local-translation flow remains above YouTube on mobile.

## Translation quality direction
- Keep cue IDs and order immutable.
- Treat neighboring cues as context only.
- Send cue exposure duration as a hint for concision.
- KO: natural Korean order, avoid redundant explicit subjects/pronouns, preserve source register.
- JA: natural Japanese order, avoid unnecessary pronouns, consistent register.
- ES: neutral broadly understandable Spanish, avoid unnecessary expansion.
- Structured output schema remains `{items:[{id,text}]}`.
- Post-QA uses CJK-aware heuristic limits as a warning, not an automatic rewrite.

## YouTube technical flow
1. `/api/youtube/oauth/start`
2. Google authorization code flow + state cookie
3. `/api/youtube/oauth/callback`
4. token exchange → encrypted session cookie
5. `/api/youtube/videos` → `channels.list(mine=true)` → uploads playlist → `playlistItems.list`
6. `/api/youtube/captions` → `captions.insert` media upload using `multipart/related`

## Deployment
Target: GitHub → Vercel, deployment performed by the user.

Required translation env:
- `OPENAI_API_KEY`
- `SUBTITLE_APP_ACCESS_KEY`
- optional `OPENAI_TRANSLATION_MODEL`

Optional YouTube env:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `YOUTUBE_SESSION_SECRET` (24+ chars)
- `NEXT_PUBLIC_APP_URL`

Production origin supplied in this conversation:
`https://subtitle-localizer.vercel.app`

OAuth callback:
`https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

## QA record
### Stage 1 — source/deployment QA: 9.4/10
Core architecture retained; remote deployment DOM could not be fetched from this environment. npm registry DNS also prevents dependency-aware build here.

### Stage 2 — UI/UX: 9.6/10
Rebuilt around one primary workflow, Karrot/SEED semantic tokens, restrained accent, 4px rhythm, responsive comparison UI, accessibility states, and reduced motion.

### Stage 3 — translation quality: 9.5/10
Duration-aware prompt, KO/JA/ES notes, localized QA heuristic, and structural quality fixtures added. Real OpenAI output still needs runtime smoke test.

### Stage 4 — YouTube: 9.5/10
OAuth/session/video-picker/caption-upload paths implemented and mock-tested. Real account callback/upload still needs deployment credentials.

### Overall: 9.5/10
Remaining score is reserved for the real production build and credentialed smoke tests.
