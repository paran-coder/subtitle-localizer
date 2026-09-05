# Subtitle Localizer v1.6.0

Subtitle localization workspace with user-owned paid API credentials.

## What changed in v1.6.0
- `/` is now a focused subtitle workspace. Persistent API setup blocks were removed from the main task flow.
- `/connections` manages OpenAI BYOK and Google/YouTube BYOC.
- The workspace header only shows compact `OpenAI ✓/○`, `YouTube ✓/○`, and `연결 관리` status/actions.
- The former large hero was reduced so `원본 자막` appears much earlier in the page.
- Missing OpenAI credentials are requested only when translation is attempted.
- Missing YouTube setup is requested only when the user chooses YouTube import/upload.
- Google Cloud setup is a true one-step-at-a-time 4-step wizard.
- OAuth success/error returns to `/connections`, where the user can return to the workspace.
- Timestamp QA from v1.5.0 remains: full `start → end` display plus cue/timing/missing/extra metrics.

## Routes
- `/` — subtitle workspace
- `/connections` — connection management and Google Cloud setup wizard

## Cost ownership
- OpenAI translation usage: each end user's own OpenAI API key/account.
- YouTube Data API quota: each end user's own Google Cloud project.
- Vercel hosting/function usage: deployment operator.

## Secret handling
- User OpenAI API keys, Google OAuth Client Secret, and YouTube OAuth tokens are sealed server-side with AES-256-GCM and stored in HttpOnly cookies.
- `APP_SESSION_SECRET` is the operator's encryption secret; it is not a paid API credential.
- Runtime code does not intentionally store user secrets in localStorage/sessionStorage/database/repository/server files.

## Deployment environment variables
```env
APP_SESSION_SECRET=use-a-long-random-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://your-app.example.com
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
```

## Google / YouTube setup
The `/connections` page guides each user through:
1. Google Cloud project + YouTube Data API v3
2. Google Auth Platform (Branding / Audience / Data Access)
3. OAuth Web application Client + exact Authorized Redirect URI
4. Client ID / Client Secret save

Cloud configuration and Google OAuth consent are deliberately separate. After step 4, the user selects `Google로 YouTube 연결` to approve access to the actual YouTube account.

## Verification performed for this package
- Node domain/architecture tests: 47/47 passed.
- TypeScript/TSX syntax transpile check: 29 source files, 0 syntax diagnostics.
- CSS brace structure check: passed.
- Runtime hardcoded `sk-*`: none found.
- Runtime localStorage/sessionStorage secret storage: none found.
- Runtime operator `process.env.OPENAI_API_KEY` / `GOOGLE_CLIENT_SECRET`: none found.
- `npm install` was attempted in the build environment but npm registry access timed out, so dependency-aware `tsc` and `next build` still need deployment/local verification.

## Local verification
```bash
npm install
npm run check
```
