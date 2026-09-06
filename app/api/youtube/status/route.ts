import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import { getMyYouTubeChannel } from "@/lib/youtube";
import {
  activeConnectionMeta,
  emptyConnectionRegistry,
  oauthRedirectUri,
  refreshYouTubeSession,
  sealConnectionRegistry,
  sealSession,
  unsealClientConfig,
  unsealConnectionRegistry,
  unsealSession,
  upsertConnectionRegistry,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_CONNECTIONS_COOKIE,
  YOUTUBE_CONNECTION_COOKIE_PREFIX,
  YOUTUBE_SESSION_COOKIE,
  youtubeConnectionCookieName,
  youtubeCookieOptions,
  youtubeRememberCookieOptions,
  type YouTubeClientConfig
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

function json(data: object) {
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  const base = { serverConfigured: server.configured, redirectUri: oauthRedirectUri(request.url) };
  if (!server.configured) return json({ ...base, configured: false, connected: false, remember: false, connections: [] });

  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!configCookie) return json({ ...base, configured: false, connected: false, remember: false, connections: [] });

  let client: YouTubeClientConfig;
  try {
    client = unsealClientConfig(configCookie, server.secret);
  } catch {
    const response = json({ ...base, configured: false, connected: false, remember: false, connections: [] });
    response.cookies.set(YOUTUBE_CONFIG_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }

  const registryCookie = request.cookies.get(YOUTUBE_CONNECTIONS_COOKIE)?.value;
  if (registryCookie) {
    try {
      const registry = unsealConnectionRegistry(registryCookie, server.secret);
      const active = activeConnectionMeta(registry);
      if (!active) {
        const response = json({ ...base, configured: true, connected: false, remember: client.remember, connections: [] });
        response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
        return response;
      }

      const cookieName = youtubeConnectionCookieName(active.connectionId);
      const sessionCookie = request.cookies.get(cookieName)?.value;
      if (!sessionCookie) {
        return json({
          ...base,
          configured: true,
          connected: true,
          remember: client.remember,
          activeConnectionId: active.connectionId,
          connections: registry.connections,
          activeConnectionError: "현재 작업 채널의 인증 세션이 없습니다. 연결 관리에서 같은 채널을 다시 연결해 주세요."
        });
      }

      try {
        const original = unsealSession(sessionCookie, server.secret);
        const session = await refreshYouTubeSession(original, client);
        const response = json({
          ...base,
          configured: true,
          connected: true,
          remember: client.remember,
          activeConnectionId: active.connectionId,
          connections: registry.connections
        });
        if (session.accessToken !== original.accessToken) {
          response.cookies.set(cookieName, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
        }
        return response;
      } catch {
        const response = json({
          ...base,
          configured: true,
          connected: true,
          remember: client.remember,
          activeConnectionId: active.connectionId,
          connections: registry.connections,
          activeConnectionError: "현재 작업 채널의 Google 인증이 만료되었습니다. 연결 관리에서 같은 채널을 다시 연결해 주세요."
        });
        response.cookies.set(cookieName, "", { ...youtubeCookieOptions, maxAge: 0 });
        return response;
      }
    } catch {
      const response = json({ ...base, configured: true, connected: false, remember: client.remember, connections: [] });
      response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
      for (const cookie of request.cookies.getAll()) {
        if (cookie.name.startsWith(YOUTUBE_CONNECTION_COOKIE_PREFIX)) response.cookies.set(cookie.name, "", { ...youtubeCookieOptions, maxAge: 0 });
      }
      return response;
    }
  }

  // v1.6 단일 세션을 첫 번째 v1.7 채널 연결로 자동 변환한다.
  const legacyCookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (legacyCookie) {
    try {
      const original = unsealSession(legacyCookie, server.secret);
      const session = await refreshYouTubeSession(original, client);
      const channel = await getMyYouTubeChannel(session.accessToken);
      let registry = emptyConnectionRegistry();
      registry = upsertConnectionRegistry(registry, {
        connectionId: randomUUID(),
        channelId: channel.id,
        channelTitle: channel.title,
        channelThumbnail: channel.thumbnail,
        connectedAt: Date.now()
      });
      const active = activeConnectionMeta(registry)!;
      const response = json({
        ...base,
        configured: true,
        connected: true,
        remember: client.remember,
        migrated: true,
        activeConnectionId: active.connectionId,
        connections: registry.connections
      });
      response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(registry, server.secret), youtubeRememberCookieOptions(client.remember));
      response.cookies.set(youtubeConnectionCookieName(active.connectionId), sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
      response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
      return response;
    } catch {
      const response = json({
        ...base,
        configured: true,
        connected: false,
        remember: client.remember,
        migrationFailed: true,
        connections: []
      });
      // Cloud Client 설정은 보존하고 기존 YouTube 세션만 정리한다.
      response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
      return response;
    }
  }

  return json({ ...base, configured: true, connected: false, remember: client.remember, connections: [] });
}
