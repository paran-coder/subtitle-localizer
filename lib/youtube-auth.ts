import { sealJson, unsealJson, secureCookieOptions, rememberedCookieOptions } from "./secure-session.ts";

export const YOUTUBE_CONFIG_COOKIE = "subtitle_youtube_client";
// v1.6 legacy single-session cookie. v1.7 reads it only for migration/backward compatibility.
export const YOUTUBE_SESSION_COOKIE = "subtitle_youtube_session";
export const YOUTUBE_CONNECTIONS_COOKIE = "subtitle_youtube_connections";
export const YOUTUBE_CONNECTION_COOKIE_PREFIX = "subtitle_youtube_connection_";
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

export type YouTubeConnectionMeta = {
  connectionId: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  connectedAt: number;
};

export type YouTubeConnectionRegistry = {
  version: 1;
  activeConnectionId?: string;
  connections: YouTubeConnectionMeta[];
};

type CookieReader = { get(name: string): { value: string } | undefined };

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

function validateConnectionMeta(value: Partial<YouTubeConnectionMeta>): YouTubeConnectionMeta {
  const connectionId = typeof value.connectionId === "string" ? value.connectionId.trim() : "";
  const channelId = typeof value.channelId === "string" ? value.channelId.trim() : "";
  const channelTitle = typeof value.channelTitle === "string" ? value.channelTitle.trim() : "";
  const channelThumbnail = typeof value.channelThumbnail === "string" && value.channelThumbnail.trim() ? value.channelThumbnail.trim() : undefined;
  const connectedAt = Number(value.connectedAt);
  if (!/^[0-9a-f-]{36}$/i.test(connectionId)) throw new Error("YouTube 연결 ID가 올바르지 않습니다.");
  if (!/^[\w-]{6,64}$/.test(channelId)) throw new Error("YouTube 채널 ID가 올바르지 않습니다.");
  if (!channelTitle || channelTitle.length > 200) throw new Error("YouTube 채널 이름이 올바르지 않습니다.");
  if (channelThumbnail && channelThumbnail.length > 2000) throw new Error("YouTube 채널 이미지 주소가 올바르지 않습니다.");
  if (!Number.isFinite(connectedAt) || connectedAt <= 0) throw new Error("YouTube 연결 시간이 올바르지 않습니다.");
  return { connectionId, channelId, channelTitle, channelThumbnail, connectedAt };
}

export function emptyConnectionRegistry(): YouTubeConnectionRegistry {
  return { version: 1, connections: [] };
}

export function validateConnectionRegistry(value: Partial<YouTubeConnectionRegistry>): YouTubeConnectionRegistry {
  const rawConnections = Array.isArray(value.connections) ? value.connections : [];
  const connections = rawConnections.map((item) => validateConnectionMeta(item));
  const ids = new Set<string>();
  const channelIds = new Set<string>();
  for (const item of connections) {
    if (ids.has(item.connectionId) || channelIds.has(item.channelId)) throw new Error("YouTube 연결 목록에 중복 항목이 있습니다.");
    ids.add(item.connectionId);
    channelIds.add(item.channelId);
  }
  const requested = typeof value.activeConnectionId === "string" ? value.activeConnectionId.trim() : "";
  const activeConnectionId = requested && ids.has(requested) ? requested : connections[0]?.connectionId;
  return { version: 1, activeConnectionId, connections };
}

export function sealConnectionRegistry(registry: YouTubeConnectionRegistry, secret: string): string {
  return sealJson(validateConnectionRegistry(registry), secret);
}

export function unsealConnectionRegistry(value: string, secret: string): YouTubeConnectionRegistry {
  return validateConnectionRegistry(unsealJson<Partial<YouTubeConnectionRegistry>>(value, secret));
}

export function youtubeConnectionCookieName(connectionId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(connectionId)) throw new Error("YouTube 연결 ID가 올바르지 않습니다.");
  return `${YOUTUBE_CONNECTION_COOKIE_PREFIX}${connectionId}`;
}

export function upsertConnectionRegistry(
  registry: YouTubeConnectionRegistry,
  meta: YouTubeConnectionMeta
): YouTubeConnectionRegistry {
  const validated = validateConnectionMeta(meta);
  const existing = registry.connections.find((item) => item.channelId === validated.channelId);
  const nextMeta = existing ? { ...validated, connectionId: existing.connectionId } : validated;
  const connections = existing
    ? registry.connections.map((item) => item.channelId === nextMeta.channelId ? nextMeta : item)
    : [...registry.connections, nextMeta];
  return validateConnectionRegistry({ version: 1, activeConnectionId: nextMeta.connectionId, connections });
}

export function selectConnectionRegistry(registry: YouTubeConnectionRegistry, connectionId: string): YouTubeConnectionRegistry {
  if (!registry.connections.some((item) => item.connectionId === connectionId)) throw new Error("선택한 YouTube 채널 연결을 찾지 못했습니다.");
  return { ...registry, activeConnectionId: connectionId };
}

export function removeConnectionRegistry(registry: YouTubeConnectionRegistry, connectionId: string): YouTubeConnectionRegistry {
  const connections = registry.connections.filter((item) => item.connectionId !== connectionId);
  const activeConnectionId = registry.activeConnectionId === connectionId
    ? connections[0]?.connectionId
    : registry.activeConnectionId;
  return validateConnectionRegistry({ version: 1, activeConnectionId, connections });
}

export function activeConnectionMeta(registry: YouTubeConnectionRegistry) {
  return registry.connections.find((item) => item.connectionId === registry.activeConnectionId);
}

export function readStoredYouTubeSession(cookies: CookieReader, secret: string): {
  session: YouTubeSession;
  cookieName: string;
  connection?: YouTubeConnectionMeta;
  registry?: YouTubeConnectionRegistry;
  legacy: boolean;
} {
  const registryCookie = cookies.get(YOUTUBE_CONNECTIONS_COOKIE)?.value;
  if (registryCookie) {
    const registry = unsealConnectionRegistry(registryCookie, secret);
    const connection = activeConnectionMeta(registry);
    if (!connection) throw new Error("연결된 YouTube 채널이 없습니다.");
    const cookieName = youtubeConnectionCookieName(connection.connectionId);
    const sessionCookie = cookies.get(cookieName)?.value;
    if (!sessionCookie) throw new Error("선택한 YouTube 채널의 인증 세션이 없습니다. 다시 연결해 주세요.");
    return { session: unsealSession(sessionCookie, secret), cookieName, connection, registry, legacy: false };
  }

  const legacyCookie = cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!legacyCookie) throw new Error("YouTube 연결이 필요합니다.");
  return { session: unsealSession(legacyCookie, secret), cookieName: YOUTUBE_SESSION_COOKIE, legacy: true };
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
