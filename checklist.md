# Subtitle Localizer v1.3.0 — Checklist

## 0. Documentation-first
- [x] `context-notes.md` updated before v1.3.0 implementation
- [x] `checklist.md` updated before v1.3.0 implementation
- [x] `README.md` updated before v1.3.0 implementation
- [x] `User manual.md` updated before v1.3.0 implementation

## 1. Source / deployment QA — 9.2/10
- [x] Review v1.2.0 source
- [x] Preserve `SUBTITLE_APP_ACCESS_KEY` API protection
- [x] Attempt supplied production URL via web fetch
- [x] Attempt supplied production URL via Vercel fetch
- [x] Attempt supplied production URL via container network
- [ ] Live DOM/pixel QA — remote access unavailable in this environment

## 2. YouTube direct caption import — 9.7/10
- [x] Video selection for source caption
- [x] Caption track list via YouTube `captions.list`
- [x] English track preference
- [x] ASR/draft metadata shown in UI
- [x] Empty state for video without caption tracks
- [x] Caption download via `tfmt=srt`
- [x] Downloaded SRT validated server-side
- [x] Imported SRT sent through existing source validation
- [x] Imported source connected to translation/review/download pipeline
- [x] Source video prefilled as upload target after import
- [x] List/download internal endpoints changed to POST to reduce accidental quota calls
- [x] Caption list/download/upload quota guidance shown
- [ ] Real owned-video caption import — requires deployed Google OAuth credentials

## 3. UI / UX polish — 9.7/10
- [x] File / YouTube source tabs
- [x] Primary flow remains first on mobile
- [x] Karrot/SEED semantic tokens retained
- [x] 4px rhythm retained
- [x] no YouTube-red secondary product accent
- [x] restrained transitions
- [x] `prefers-reduced-motion`
- [x] keyboard focus states
- [x] ARIA tab/radio states
- [x] connected/disconnected/unconfigured/empty/loading states

## 4. Sample / translation quality — 9.8/10
- [x] 30-cue `localization-challenge-en.srt`
- [x] cue-spanning sentences
- [x] idiom test
- [x] pronoun/localization test
- [x] short-duration reading-pressure test
- [x] proper-name preservation test
- [x] number preservation test
- [x] multiline cue test
- [x] UI “30-cue sample” loader
- [x] public static sample copy
- [x] automated fixture structure test
- [ ] Live EN→KO/JA/ES OpenAI output comparison — requires runtime API key

## 5. Final verification — 9.7/10
- [x] 28/28 automated tests pass
- [x] 22 TS/TSX files transpile with 0 syntax errors
- [x] CSS delimiter check passes
- [x] hard-coded `sk-*` secret check
- [x] version strings updated to v1.3.0
- [x] documentation matches implementation
- [ ] `npm install && npm run typecheck && npm run build` — dependency installation unavailable in this environment
- [ ] deployed OAuth/caption import/caption upload smoke test

## Overall self-evaluation
**9.6/10**
