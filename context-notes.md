# Subtitle Localizer v1.4.0 — Context Notes

## Product decision
- Hosting/deployment is operated by the app owner.
- Paid OpenAI usage must be billed to each end user's own OpenAI account.
- YouTube Data API quota must belong to each end user's own Google Cloud project.
- The app must not require operator-owned `OPENAI_API_KEY`, `SUBTITLE_APP_ACCESS_KEY`, `GOOGLE_CLIENT_ID`, or `GOOGLE_CLIENT_SECRET`.

## v1.4.0 architecture
### OpenAI BYOK
- User enters their own OpenAI API key.
- Key is posted once to the same-origin backend and encrypted with AES-256-GCM.
- Default “remember” behavior is an HttpOnly session cookie.
- Optional “이 브라우저에 기억하기” uses an encrypted HttpOnly persistent cookie (30 days).
- OpenAI key is never stored in localStorage/sessionStorage, database, filesystem, repository, response payload, or logs.
- Translation route decrypts the key in memory and calls OpenAI server-side.
- This follows OpenAI's recommendation not to expose API keys to client-side JavaScript storage.

### Google / YouTube BYOC
- User supplies their own Google OAuth Client ID and Client Secret from their own Google Cloud project.
- Client credentials are encrypted in HttpOnly cookies using the same app session secret.
- OAuth access/refresh tokens are encrypted in HttpOnly cookies.
- `youtube.force-ssl` is used for caption read/write operations.
- YouTube Data API quota is consumed from the user's own Google Cloud project because the user's OAuth client credentials are used.

### Operator deployment secret
- `APP_SESSION_SECRET` is the only sensitive operator-side secret required by the app architecture.
- It does not authenticate to OpenAI/Google and does not itself incur third-party API usage fees.
- `NEXT_PUBLIC_APP_URL` defines the OAuth redirect origin.
- `OPENAI_TRANSLATION_MODEL` is only a model default, not a credential.

## Cost boundary
- OpenAI bill: end user.
- YouTube API quota: end user's Google Cloud project.
- Vercel hosting/function/bandwidth usage: deployment owner. This cannot be automatically transferred to end users without a separate billing/product architecture.

## UI direction
Use the attached ui-polish guidance and Karrot/SEED-inspired token reference:
- structure before decoration
- clear primary action
- restrained motion and reduced-motion support
- product Primary `#ff6f0f`
- quiet neutral surfaces/backgrounds
- System typography
- 4px spacing rhythm
- orange reserved for primary action/selected state

## Version scope
v1.4.0 changes credential ownership and cost ownership while preserving SRT parsing, translation QA, sample loading, YouTube caption import, and YouTube caption upload.


## Security hardening
- Sensitive credential/status responses use `Cache-Control: no-store`.
- Global headers disable framing, MIME sniffing, referrer leakage, and unused browser permissions.
- Stored secrets are not exposed back to client JavaScript.
- Remembered secrets use a 30-day encrypted HttpOnly cookie; session mode omits `maxAge`.
