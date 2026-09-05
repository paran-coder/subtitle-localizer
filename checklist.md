# Subtitle Localizer v1.6.2 — Checklist

## Documentation first
- [x] context-notes.md created/updated before implementation
- [x] checklist.md created/updated before implementation
- [x] README.md updated before implementation
- [x] User manual.md updated before implementation

## Connections IA
- [x] Add `/connections` page
- [x] Move OpenAI BYOK controls out of workspace
- [x] Move Google/YouTube BYOC controls out of workspace
- [x] Show only compact connection status in workspace header
- [x] Add return-to-workspace action
- [x] Compress workspace hero so `원본 자막` appears earlier

## Contextual gates
- [x] Translation without OpenAI routes to `/connections?setup=openai`
- [x] YouTube import without Google config routes to `/connections?setup=youtube`
- [x] YouTube import with Cloud config but no OAuth routes to connection management
- [x] YouTube upload missing connection routes to connection management
- [x] OAuth callback/errors return to `/connections`

## Google wizard
- [x] One step body visible at a time
- [x] 1/4 Project + YouTube Data API
- [x] 2/4 Google Auth Platform
- [x] 3/4 OAuth Web Client + redirect URI copy
- [x] 4/4 Client ID/Secret save
- [x] Previous / Next navigation
- [x] Google OAuth approval visibly separate from Cloud configuration
- [x] Existing Cloud configuration skips the setup wizard and shows OAuth/connect state

## UI / accessibility
- [x] Primary remains `#ff6f0f`
- [x] Neutral surfaces/system typography/4px rhythm retained
- [x] Orange remains limited to primary/active states
- [x] Mobile connection page rules added
- [x] reduced-motion respected for contextual setup scroll

## QA
- [x] Existing SRT/BYOK/BYOC/YouTube tests pass
- [x] Architecture tests cover `/connections`
- [x] Automated tests: 49/49
- [x] TS/TSX syntax transpile: 29 files / 0 diagnostics
- [x] CSS brace validation
- [x] Runtime hardcoded `sk-*`: none
- [x] Runtime localStorage/sessionStorage secret storage: none
- [x] `.env.example` included
- [x] `.gitignore` included
- [ ] Dependency-aware `tsc --noEmit` (npm registry unavailable in this environment)
- [ ] Next production build (npm registry unavailable in this environment)
- [ ] Live Vercel browser QA after deployment
- [ ] Real Google OAuth → videos → captions import/upload E2E after deployment


## v1.6.1 hotfix verification
- [x] Reproduce Vercel error: `TS1501` on architecture test RegExp dotAll flag
- [x] Remove ES2018-only `/s` flag without changing runtime code
- [x] Verify replacement RegExp compiles with TypeScript target ES2017
- [x] Run full Node test suite: 49/49 passed
- [x] Remove duplicate `User%20manual.md` artifact
- [ ] Confirm Vercel production build after uploading v1.6.1

## v1.6.2 readability QA
- [x] Wizard body copy is at least 15px on desktop and mobile.
- [x] Checklist / confirmation copy is readable without zooming.
- [x] Google Console schematic is materially larger and visually useful.
- [x] Disabled navigation buttons are neutral, not orange.
- [x] Current step and active primary action remain the only dominant orange elements.
- [x] Content is allowed to scroll naturally; no viewport-fitting hacks.
- [x] 320px mobile layout has no page-level horizontal overflow.
- [x] `prefers-reduced-motion` remains supported.
