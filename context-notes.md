# Subtitle Localizer v1.5.0 — Context Notes

## Product decision
- Hosting/deployment is operated by the app owner.
- Paid OpenAI usage is billed to each end user's own OpenAI account (BYOK).
- YouTube Data API quota belongs to each end user's own Google Cloud project (BYOC).
- The app operator does not provide an operator-owned OpenAI API key or Google OAuth client.
- Vercel hosting/function/bandwidth remains an operator-side platform cost and is separate from third-party API spend.

## v1.5.0 goals
1. Make timing preservation verifiable instead of merely claimed.
2. Separate Google Cloud OAuth-client configuration from Google/YouTube account authorization.
3. Replace the dense Google BYOC form with a guided 4-step setup wizard.
4. Use current Google Auth Platform terminology so first-time users can follow the live console.
5. Ensure `.env.example` and `.gitignore` ship in the project package.

## Timing QA direction
The review screen must show each cue as:
`00:00:02,500 → 00:00:05,200`

For the active translated language, calculate and display:
- matching cue IDs / total source cues
- matching timestamp ranges / total source cues
- missing translated cues
- unexpected translated cues
- overall structural pass/fail

No automatic timing correction is allowed. A mismatch is surfaced for review instead of silently rewritten.

## Google / YouTube BYOC onboarding
Use a 4-step wizard based on current Google Cloud / Google Auth Platform terminology:

### Step 1 — Project + API
- Create/select a Google Cloud project.
- Open API Library.
- Enable **YouTube Data API v3**.

### Step 2 — Google Auth Platform
- Open **Google Auth Platform**.
- Complete Branding/Audience as needed.
- In **Data Access**, make sure the app can request the YouTube scope used by Subtitle Localizer.
- For a personal/testing setup, keep the app in testing and add the Google account that will authorize the app when the console requires test users.
- Important: an External OAuth app in Testing generally receives refresh tokens that expire after 7 days when it requests scopes beyond basic profile identity. The UI must explain that "remember" cannot override Google token policy.

### Step 3 — OAuth Client
- Open **Google Auth Platform → Clients**.
- Create Client.
- Application type: **Web application**.
- Add the exact redirect URI shown by Subtitle Localizer to **Authorized redirect URIs**.
- Google requires an exact URI match (scheme, host, path, trailing slash).

### Step 4 — Connect
- Paste Client ID and Client Secret into Subtitle Localizer.
- Save the Google project credentials.
- Then perform the separate **Google로 YouTube 연결** OAuth authorization step.

## UX direction
Follow the attached `ui-polish` workflow and Karrot/SEED-inspired tokens:
- structure before styling
- one primary action per state
- quiet chrome, content-first hierarchy
- System typography
- product Primary `#ff6f0f`
- neutral background/surface/foreground roles
- 4px spacing rhythm
- flat/light surfaces; no decorative shadow stack
- short state transitions only; preserve `prefers-reduced-motion`

For the Google wizard:
- use a compact numbered vertical stepper inside the existing BYOC card
- collapse completed steps to a concise summary
- keep the current step expanded
- do not use motion to hide required information
- show checklist rows with explicit completion controls where automatic verification is impossible
- distinguish "Google Cloud 설정 저장" from "Google OAuth 승인" visually and verbally

## Security rules retained from v1.4.0
- OpenAI API key, Google Client Secret, OAuth access/refresh tokens stay in encrypted HttpOnly cookies.
- No secret in localStorage/sessionStorage.
- Sensitive status endpoints use `Cache-Control: no-store`.
- `APP_SESSION_SECRET` is operator-side encryption material only; it is not a paid API credential.

## Official external terminology checked for v1.5.0
- Google Auth Platform pages: Overview, Branding, Audience, Clients, Data Access, Verification Center.
- OAuth client creation: Clients → Create Client → Web application.
- YouTube Data API must be enabled in the project API Library.
- Authorized redirect URI must exactly match the URI sent by the app.

## Final implementation review
- Timing QA now compares by cue ID and reports timing matches, ID matches, missing cues, unexpected cues, timing mismatches, and order mismatches.
- Review rows show full start → end ranges using tabular numerals without introducing a separate display typeface.
- Google BYOC setup is a four-step guided flow with compact console mini-previews, direct console links, manual completion checks, and a separate OAuth authorization state.
- Resetting Google configuration resets wizard progress to prevent stale setup state.
- The UI warns that External + Testing Google OAuth projects can issue refresh tokens that expire after 7 days; persistent cookies cannot override Google token policy.
- `.env.example` and `.gitignore` are present in the project package.

## Verification summary
- Node test suite: 44/44 passing.
- TS/TSX syntax transpile check: 28 files, 0 syntax errors.
- CSS brace sanity check: balanced.
- No hardcoded `sk-*` key found.
- No `localStorage`/`sessionStorage` secret persistence found in app/lib runtime code.
- Dependency-aware `tsc --noEmit` / Next production build remains environment-dependent because npm registry installation timed out in this workspace.
