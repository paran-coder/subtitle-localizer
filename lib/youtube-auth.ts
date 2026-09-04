import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const YOUTUBE_SESSION_COOKIE = "subtitle_youtube_session";
export const YOUTUBE_STATE_COOKIE = "subtitle_youtube_oauth_state";
export const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

export type YouTubeSession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scope?: string;
};

function deriveKey(secret: string) {
  if (secret.trim().length < 24) {
    throw new Error("YOUTUBE_SESSION_SECRET는 24자 이상이어야 합니다.");
  }
  return createHash("sha256").update(secret).digest();
}

export function sealSession(session: YouTubeSession, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify(session), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function unsealSession(value: string, secret: string): YouTubeSession {
  const [ivPart, tagPart, cipherPart] = value.split(".");
  if (!ivPart || !tagPart || !cipherPart) throw new Error("YouTube 세션 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(cipherPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
  const parsed = JSON.parse(plaintext) as Partial<YouTubeSession>;
  if (!parsed.accessToken || !Number.isFinite(parsed.expiresAt)) {
    throw new Error("YouTube 세션 데이터가 올바르지 않습니다.");
  }
  return parsed as YouTubeSession;
}

export function youtubeConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";
  const sessionSecret = process.env.YOUTUBE_SESSION_SECRET?.trim() ?? "";
  return {
    configured: Boolean(clientId && clientSecret && sessionSecret.length >= 24),
    clientId,
    clientSecret,
    sessionSecret
  };
}

export function oauthRedirectUri(requestUrl: string) {
  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  const origin = configuredOrigin || new URL(requestUrl).origin;
  return `${origin}/api/youtube/oauth/callback`;
}

export async function refreshYouTubeSession(session: YouTubeSession): Promise<YouTubeSession> {
  if (session.expiresAt > Date.now() + 60_000) return session;
  if (!session.refreshToken) throw new Error("YouTube 인증이 만료되었습니다. 다시 연결해 주세요.");

  const config = youtubeConfig();
  if (!config.configured) throw new Error("YouTube OAuth 환경변수가 설정되지 않았습니다.");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
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
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || "YouTube 인증 갱신에 실패했습니다.");
  }

  return {
    ...session,
    accessToken: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    scope: payload.scope ?? session.scope
  };
}

export const youtubeCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};
