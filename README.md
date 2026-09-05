# Subtitle Localizer v1.5.0

A YouTube subtitle-localization web app built around **user-owned paid API credentials** and explicit subtitle-structure QA.

## What v1.5.0 adds
- Review rows show full `start → end` timestamps.
- Structural QA reports cue-ID matches, timestamp matches, missing cues, and unexpected cues.
- Google/YouTube setup is split into **Google Cloud configuration** and **Google OAuth authorization**.
- A 4-step Google Cloud setup wizard uses current Google Auth Platform terminology.
- `.env.example` and `.gitignore` are included in the package.

## Cost ownership
- **OpenAI translation usage:** each user supplies their own OpenAI API key; OpenAI usage is billed to that user's account.
- **YouTube Data API quota:** each user supplies OAuth credentials from their own Google Cloud project; quota is consumed from that user's project.
- **Vercel hosting/function usage:** remains part of the operator's hosting account.

## Main flow
1. Load/upload an English SRT or import an existing caption from YouTube.
2. Connect the user's own OpenAI API key.
3. Select languages and localization style.
4. Translate.
5. Review text plus exact cue/timing preservation metrics.
6. Download SRT/ZIP.
7. Optionally configure the user's Google Cloud OAuth client and authorize their YouTube account.
8. Upload localized caption tracks to YouTube.

## Deployment environment variables
```env
APP_SESSION_SECRET=use-a-long-random-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://your-app.example.com
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
```

The operator does **not** configure an OpenAI API key, Google Client ID, or Google Client Secret.

## Google Cloud setup — user-owned project
The in-app wizard mirrors the current console flow:

1. **Project + YouTube Data API v3**
   - Create/select a Google Cloud project.
   - Enable YouTube Data API v3 in API Library.
2. **Google Auth Platform**
   - Configure Branding and Audience as needed.
   - Review Data Access for the YouTube permission requested by the app.
   - If the app is in Testing, add the Google account that will authorize it when required.
   - External + Testing projects can have refresh tokens expire after 7 days for non-basic scopes, so long-lived YouTube authorization may require re-approval or an appropriate production/verification setup.
3. **Clients**
   - Google Auth Platform → Clients → Create Client.
   - Type: Web application.
   - Add the exact redirect URI shown by Subtitle Localizer to Authorized redirect URIs.
4. **Connect**
   - Paste the Client ID and Client Secret in Subtitle Localizer.
   - Save configuration.
   - Click **Google로 YouTube 연결** to perform the separate OAuth consent flow.

## Secret handling
- OpenAI key, Google Client Secret, and OAuth tokens are encrypted with AES-256-GCM.
- Secrets live in HttpOnly cookies, not localStorage/sessionStorage.
- Remember mode uses encrypted persistent cookies; session mode expires with the browser session.
- Stored secrets are never returned to browser JavaScript.

## Local verification
```bash
npm install
npm run check
```

## Manual GitHub upload note
If you upload the extracted project through the GitHub web UI, make sure the two dotfiles below are included:
- `.env.example`
- `.gitignore`

They are present at the root of the v1.5.0 package. `.env.example` contains placeholders only; never put a real `APP_SESSION_SECRET` in the repository.

## Official references used for the Google setup guide
- Google Auth Platform setup: https://support.google.com/cloud/answer/15544987
- YouTube Data API OAuth for web server apps: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
- Google OAuth refresh-token behavior: https://developers.google.com/identity/protocols/oauth2
