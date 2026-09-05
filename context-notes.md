# Subtitle Localizer v1.6.0 — Context Notes

## Goal
Separate credential onboarding from subtitle work. Returning users should land on a task-oriented workspace, not an API configuration dashboard.

## Information architecture
- `/` = Workspace. Source SRT → languages/options → translation → QA/download → optional YouTube upload.
- `/connections` = OpenAI BYOK + Google/YouTube BYOC management.
- Workspace header exposes connection state only: `OpenAI ✓/○`, `YouTube ✓/○`, `연결 관리`.

## Contextual setup rules
- SRT upload/download never requires Google.
- Translation requires OpenAI only when the user presses translate.
- YouTube configuration is requested only when the user chooses YouTube import/upload.
- OAuth success/errors return to `/connections`, keeping setup feedback in the setup surface.

## Google wizard
A true single-step wizard rather than a stacked accordion:
1. Project + YouTube Data API v3
2. Google Auth Platform
3. OAuth Web Client + Authorized Redirect URI
4. Client ID / Client Secret save
Then a separate `Google로 YouTube 연결` action handles Google login/consent.

## UI basis
- ui-polish: structure before styling, clarity before decoration, reusable patterns, purposeful restrained motion, reduced-motion support.
- Karrot/SEED product Primary `#ff6f0f`, neutral surfaces, System typography, 4px spacing rhythm.
- Orange remains scarce: primary actions and active states, not decoration.
- The main hero was intentionally compressed so source-subtitle work starts near the top of the page.

## Cost boundary
- OpenAI usage → end user's OpenAI account.
- YouTube quota → end user's Google Cloud project.
- Vercel usage → deployment operator.

## QA results
- 47/47 automated tests passed.
- 29 TS/TSX source files passed syntax transpilation.
- CSS brace validation passed.
- No runtime hardcoded OpenAI `sk-*`, localStorage/sessionStorage secret persistence, or operator OpenAI/Google paid credentials found.
- Full production build remains to be verified where npm registry access is available.

## Self-review
- Stage 1 documentation / IA: 9.8/10
- Stage 2 workspace-connections split: 9.7/10
- Stage 3 UX/security cleanup: 9.8/10
- Final package: 9.8/10 pending live Vercel/browser OAuth E2E.
