# Subtitle Localizer v1.5.0 — Checklist

## Phase 0 — Required docs
- [x] context-notes.md created/updated before implementation
- [x] checklist.md created/updated before implementation
- [x] README.md created/updated before implementation
- [x] User manual.md created/updated before implementation

## Phase 1 — Timing review QA
- [x] Add reusable timing/cue validation summary function
- [x] Add tests for perfect match, missing cue, unexpected cue, ID mismatch, timing mismatch
- [x] Display start → end timecode for source and translation
- [x] Display `타임코드 n/n 일치`
- [x] Display `Cue ID n/n 일치`
- [x] Display missing/unexpected cue count
- [x] Preserve download serialization exactly as source timing

## Phase 2 — Google BYOC wizard
- [x] Split Cloud-client configuration from account OAuth authorization
- [x] Add 4-step Google Cloud setup wizard
- [x] Step 1: project + YouTube Data API v3 instructions
- [x] Step 2: Google Auth Platform instructions
- [x] Step 3: Web application client + exact redirect URI instructions
- [x] Step 4: Client ID/Secret + remember setting
- [x] Rename OAuth CTA to `Google로 YouTube 연결`
- [x] Add explicit checklist controls for steps the app cannot verify automatically
- [x] Add concise current-console labels and external console links
- [x] Preserve encrypted HttpOnly credential storage

## Phase 3 — UI polish
- [x] Keep primary orange scarce and action-oriented
- [x] Preserve Karrot/SEED neutral surfaces and 4px rhythm
- [x] Responsive wizard layout
- [x] Keyboard focus states
- [x] `prefers-reduced-motion` support
- [x] Avoid decorative animation/shadow overload

## Phase 4 — Repository/deployment hygiene
- [x] Include `.env.example`
- [x] Include `.gitignore`
- [x] Bump package/app version to 1.5.0
- [x] Update README deployment instructions
- [x] Update User manual

## Phase 5 — Verification
- [x] Existing tests pass
- [x] New v1.5.0 tests pass
- [x] TS/TSX syntax transpile check
- [x] CSS delimiter/syntax sanity check
- [x] No hardcoded OpenAI API key
- [x] No localStorage/sessionStorage secret persistence
- [ ] Dependency-aware `tsc --noEmit` and production build when npm registry is available

## Phase 6 — Packaging
- [x] Final context notes updated
- [x] Final checklist state updated
- [x] Final ZIP created
