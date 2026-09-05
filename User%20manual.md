# Subtitle Localizer v1.6.0 — User Manual

## 1. Workspace first
Open `/` and start with subtitles immediately. API setup is no longer permanently displayed above the workspace.

1. Upload an SRT or choose `YouTube 자막`.
2. Select target languages and localization style.
3. Start translation.
4. Review full `start → end` timestamps and structure metrics.
5. Download SRT/ZIP or upload to YouTube.

The header only shows compact connection status: `OpenAI ✓/○`, `YouTube ✓/○`, and `연결 관리`.

## 2. OpenAI is requested only when needed
If you press `번역 시작` without a connected OpenAI key, the app opens `/connections` at the OpenAI section.

- Enter your own OpenAI API key.
- Optionally enable `이 브라우저에 기억하기`.
- The key is sealed into an HttpOnly cookie.
- OpenAI usage is billed to your OpenAI account.
- After connecting, choose `작업으로 돌아가기`.

## 3. YouTube is optional
If you only upload SRT, translate, and download SRT, Google setup is not required.

Google/YouTube setup is requested only when you choose `YouTube 자막` or try to upload translated subtitles to YouTube.

## 4. Connection management
Choose `연결 관리` in the header to open `/connections`.

### OpenAI
- See connected/not-connected status.
- Add or replace a key.
- Toggle browser remembering.
- Delete the stored key.

### YouTube / Google Cloud
Google Cloud configuration and Google OAuth consent are separate.

#### 1 / 4 — Project + YouTube Data API
Create/select a Google Cloud project and enable YouTube Data API v3.

#### 2 / 4 — Google Auth Platform
Configure Branding / Audience / Data Access. If using a testing configuration, Google policy may require periodic re-authorization.

#### 3 / 4 — OAuth Web Client
Create a Web application OAuth Client. Copy the exact Redirect URI shown by Subtitle Localizer into Authorized redirect URIs.

#### 4 / 4 — Save Cloud Client
Enter Client ID and Client Secret and save. This step only stores Cloud Client configuration.

### Google OAuth approval
After Cloud Client setup is ready, choose `Google로 YouTube 연결` and approve access with the actual YouTube account. OAuth success returns to the connection page.

## 5. Returning users
Once connections are configured, the home page remains focused on subtitle work. The Google setup wizard does not occupy workspace space.

## 6. Costs
- OpenAI translation cost: your OpenAI account.
- YouTube API quota: your Google Cloud project.
- Vercel hosting/function cost: app deployer.
