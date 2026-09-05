# Subtitle Localizer v1.6.0 — Checklist

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
- [x] Automated tests: 47/47
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
