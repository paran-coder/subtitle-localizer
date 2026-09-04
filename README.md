# Subtitle Localizer v1.4.0

A YouTube subtitle-localization web app built around **user-owned paid API credentials**.

## Cost ownership
- **OpenAI translation usage:** each user supplies their own OpenAI API key, so OpenAI usage is billed to that user's OpenAI account.
- **YouTube Data API quota:** each user supplies OAuth credentials from their own Google Cloud project, so YouTube quota is consumed from that user's project.
- **App operator:** hosts the app and provides only an encryption secret used to protect temporary user credentials/tokens. The app does not require an operator-owned OpenAI key or Google OAuth client.
- **Vercel hosting/function usage:** remains part of the operator's hosting account. v1.4.0 removes operator-owned third-party API spend, but cannot transfer the Vercel platform bill itself to end users.

## Main flow
1. Load/upload an English SRT or import an existing caption from YouTube.
2. Select target languages and localization style.
3. Connect the user's own OpenAI API key.
4. Translate and review localized subtitles.
5. Download SRT/ZIP or upload captions to the user's YouTube video.

## Secret handling
### OpenAI BYOK
- The user enters their own OpenAI API key.
- The key is sent once to a same-origin server route and encrypted with AES-256-GCM.
- Default: stored as an encrypted HttpOnly **session cookie**.
- Optional **“이 브라우저에 기억하기”**: stored as an encrypted HttpOnly persistent cookie for up to 30 days.
- The key is not written to localStorage, sessionStorage, database, repository, server file, or response payload.
- Translation requests read the encrypted cookie server-side and call OpenAI from the backend.

### Google / YouTube BYOC
- The user supplies OAuth Client ID and Client Secret created in their own Google Cloud project.
- Client credentials are encrypted into an HttpOnly cookie; JavaScript cannot read them back.
- OAuth access/refresh tokens are also encrypted in HttpOnly cookies.
- The user's own Google project owns the YouTube Data API quota.

## Deployment environment variables
```env
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
APP_SESSION_SECRET=use-a-long-random-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://your-app.example.com
```

`APP_SESSION_SECRET` is not a paid API credential. It only encrypts user-supplied credentials/tokens.

## Google Cloud setup for each user
1. Create/select a Google Cloud project.
2. Enable **YouTube Data API v3**.
3. Configure OAuth consent.
4. Create an **OAuth 2.0 Client ID → Web application**.
5. Copy the redirect URI shown inside Subtitle Localizer into **Authorized redirect URIs**.
6. Paste that Client ID and Client Secret into the app and connect YouTube.

## Local verification
```bash
npm install
npm run check
```


## App security hardening
- Credential/status API responses use `Cache-Control: no-store`.
- Global response headers include `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and a restrictive `Permissions-Policy`.
- API keys, OAuth client secrets, access tokens, and refresh tokens are never returned to browser JavaScript after they are stored.
