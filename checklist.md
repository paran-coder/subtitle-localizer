# Subtitle Localizer v1.2.0 — Checklist

## 0. Documentation-first
- [x] context-notes.md updated before implementation
- [x] checklist.md updated before implementation
- [x] README.md updated with v1.2.0 scope before implementation
- [x] User manual.md updated with planned workflow before implementation

## 1. Source / deployment QA — 9.4/10
- [x] Review v1.1.0 source for functional/security issues
- [x] Validate environment-variable behavior at source level
- [x] Confirm public translation API remains protected by `SUBTITLE_APP_ACCESS_KEY`
- [x] Run domain/unit tests
- [x] Run TS/TSX transpile syntax check
- [x] Run CSS delimiter sanity check
- [ ] Full `npm install && npm run typecheck && npm run build` — blocked by npm registry DNS (`EAI_AGAIN`) in this environment
- [ ] Live browser DOM/pixel QA for supplied Vercel URL — remote fetch unavailable here

Review changes:
- Mobile/tablet primary flow kept before YouTube side panel.
- OAuth session secret shorter than 24 chars is treated as unconfigured.
- Successful YouTube uploads are removed from the pending upload selection.

## 2. UI / UX polish — 9.6/10
- [x] Apply provided ui-polish flow: structure → hierarchy → component logic → polish
- [x] Apply Karrot/SEED semantic color tokens
- [x] Use 4px spacing rhythm for layout/component geometry
- [x] Keep `#ff6f0f` scarce and primary-action focused
- [x] Remove secondary YouTube-red accent from product chrome
- [x] Improve mobile hierarchy, progress, review, and YouTube states
- [x] Add keyboard focus styles
- [x] Add `prefers-reduced-motion`
- [x] Avoid decorative blur and widespread shadows
- [x] Add ARIA tab/radio state on relevant controls

## 3. Translation quality — 9.5/10
- [x] Improve subtitle-localization prompt constraints
- [x] Send cue duration as reading-time hint
- [x] Add KO/JA/ES language-specific localization notes
- [x] Preserve tags/names/numbers/IDs in prompt contract
- [x] Add localized reading-length QA diagnostics
- [x] Add KO/JA/ES quality-reference SRT fixtures
- [x] Verify fixture timing preservation automatically
- [ ] Live OpenAI API output comparison — requires deployment/API key runtime

## 4. YouTube integration — 9.5/10
- [x] Google OAuth start/callback/logout routes
- [x] OAuth state validation
- [x] AES-256-GCM encrypted HttpOnly session cookie
- [x] Refresh-token based access-token renewal
- [x] Single required OAuth scope: `youtube.force-ssl`
- [x] Authenticated channel + uploads playlist lookup
- [x] Recent uploaded-video list endpoint (max 50)
- [x] Caption upload endpoint (`multipart/related`)
- [x] UI for connect/select/track-name/language/upload
- [x] Duplicate caption conflict surfaced clearly
- [x] Quota warning: 400 units per `captions.insert`
- [ ] Real Google OAuth + private test-video upload — requires user's Google Cloud/Vercel credentials

## 5. Final verification
- [x] 25/25 automated tests pass
- [x] TS/TSX transpile syntax check passes
- [x] CSS delimiter check passes
- [x] No hard-coded `sk-*` API secret
- [x] Required environment variables documented
- [x] Docs match implementation
- [ ] Full dependency-aware TypeScript validation/build — pending npm access
- [ ] Post-deploy real translation / OAuth / caption upload smoke test
- [x] ZIP generated

## Overall self-evaluation
**9.5/10 before real deployment smoke test.**

The remaining 0.5 is intentionally reserved for dependency-aware Next.js production build, real OpenAI translation output, Google OAuth callback, and a real YouTube caption upload on the user's deployment.
