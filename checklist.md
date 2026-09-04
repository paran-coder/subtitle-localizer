# Subtitle Localizer v1.4.0 — Checklist

## Phase 0 — Required docs
- [x] context-notes.md created before implementation
- [x] checklist.md created before implementation
- [x] README.md created before implementation
- [x] User manual.md created before implementation

## Phase 1 — OpenAI BYOK
- [x] Remove operator `OPENAI_API_KEY` dependency
- [x] Remove `SUBTITLE_APP_ACCESS_KEY`
- [x] Add user API-key input UI
- [x] Default to session-only credential retention
- [x] Add optional “이 브라우저에 기억하기” behavior
- [x] Store remembered key only as AES-256-GCM encrypted HttpOnly cookie
- [x] Ensure server never writes/logs the key to DB/files/repository/responses
- [x] Improve invalid key / account-limit / permission messages
- [x] Clarify that key validity is confirmed on the first translation request

## Phase 2 — Google/YouTube BYOC
- [x] Remove operator Google OAuth client dependency
- [x] Add user Google Client ID + Client Secret setup UI
- [x] Keep Client Secret out of JavaScript storage
- [x] Encrypt BYOC credentials server-side in HttpOnly cookies
- [x] OAuth start/callback uses the user's OAuth client
- [x] Refresh token uses the user's OAuth client
- [x] Video/caption list/download/upload uses the user's project/session
- [x] Add disconnect and complete Google-setting removal behavior
- [x] Show/copy the exact Authorized redirect URI

## Phase 3 — UI/UX
- [x] One clear connection/settings module
- [x] Clearly identify external API cost ownership
- [x] Browser remember controls are explicit
- [x] Sensitive-field visibility toggle/accessibility
- [x] Reduced-motion preserved
- [x] Karrot/SEED-inspired token discipline preserved
- [x] Avoid claiming the operator has zero Vercel platform cost

## Phase 4 — Security / tests
- [x] OpenAI BYOK architecture tests
- [x] AES credential-storage behavior tests
- [x] YouTube BYOC session/config tests
- [x] Existing SRT tests pass
- [x] Existing translation validation tests pass
- [x] Existing YouTube API tests pass
- [x] TS/TSX syntax transpile check
- [x] CSS delimiter check
- [x] No operator paid-API credentials in `.env.example`
- [x] No localStorage/sessionStorage secret persistence
- [x] No hardcoded OpenAI `sk-*` key
- [x] Security headers: nosniff / frame deny / no-referrer / permissions policy
- [x] Credential/status responses use `Cache-Control: no-store`
- [ ] Dependency-aware `tsc --noEmit` and Next production build (requires npm registry access in execution environment)

## Phase 5 — Packaging
- [x] README updated
- [x] User manual updated
- [x] Context notes updated
- [x] Checklist final state updated
- [x] Final ZIP created
