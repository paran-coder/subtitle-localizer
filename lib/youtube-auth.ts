import { sealJson, unsealJson, secureCookieOptions, rememberedCookieOptions } from "./secure-session.ts";

export const YOUTUBE_CONFIG_COOKIE = "subtitle_youtube_client";
export const YOUTUBE_SESSION_COOKIE = "subtitle_youtube_session";
export const YOUTUBE_STATE_COOKIE = "subtitle_youtube_oauth_state";
export const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

export type YouTubeClientConfig = {
  clientId: string;
  clientSecret: string;
  remember: boolean;
};

export type YouTubeSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
};

export function validateYouTubeClientConfig(value: Partial<YouTubeClientConfig>): YouTubeClientConfig {
  const clientId = typeof value.clientId === "string" ? value.clientId.trim() : "";
  const clientSecret = typeof value.clientSecret === "string" ? value.clientSecret.trim() : "";
  const remember = Boolean(value.remember);
  if (clientId.length < 20 || clientId.length > 300) throw new Error("Google OAuth Client ID를 확인해 주세요.");
  if (clientSecret.length < 6 || clientSecret.length > 300) throw new Error("Google OAuth Client Secret을 확인해 주세요.");
  return { clientId, clientSecret, remember };
}

export function sealClientConfig(config: YouTubeClientConfig, secret: string): string {
  return sealJson(validateYouTubeClientConfig(config), secret);
}

export function unsealClientConfig(value: string, secret: string): YouTubeClientConfig {
  return validateYouTubeClientConfig(unsealJson<Partial<YouTubeClientConfig>>(value, secret));
}

export function sealSession(session: YouTubeSession, secret: string): string {
  return sealJson(session, secret);
}

export function unsealSession(value: string, secret: string): YouTubeSession {
  const parsed = unsealJson<Partial<YouTubeSession>>(value, secret);
  if (!parsed.accessToken || !Number.isFinite(parsed.expiresAt)) throw new Error("YouTube 세션 데이터가 올바르지 않습니다.");
  return parsed as YouTubeSession;
}

export function oauthRedirectUri(requestUrl: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const origin = configuredOrigin || new URL(requestUrl).origin;
  return `${origin}/api/youtube/oauth/callback`;
}

export async function refreshYouTubeSession(
  session: YouTubeSession,
  client: YouTubeClientConfig
): Promise<YouTubeSession> {
  if (session.expiresAt > Date.now() + 60_000) return session;
  if (!session.refreshToken) throw new Error("YouTube 인증이 만료되었습니다. 다시 연결해 주세요.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: session.refreshToken,
      grant_type: "refresh_token"
    }),
    cache: "no-store"
  });

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
    error_description?: string;
  };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || "YouTube 인증 갱신에 실패했습니다.");

  return {
    ...session,
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    scope: payload.scope ?? session.scope
  };
}

export const youtubeCookieOptions = secureCookieOptions;
export const youtubeRememberCookieOptions = rememberedCookieOptions;
