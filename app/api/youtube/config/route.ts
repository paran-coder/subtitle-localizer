import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import {
  oauthRedirectUri,
  sealClientConfig,
  unsealClientConfig,
  unsealConnectionRegistry,
  validateYouTubeClientConfig,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_CONNECTIONS_COOKIE,
  YOUTUBE_CONNECTION_COOKIE_PREFIX,
  YOUTUBE_SESSION_COOKIE,
  YOUTUBE_STATE_COOKIE,
  youtubeConnectionCookieName,
  youtubeCookieOptions,
  youtubeRememberCookieOptions
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

function baseStatus(request: NextRequest) {
  const server = appSessionSecret();
  return {
    serverConfigured: server.configured,
    redirectUri: oauthRedirectUri(request.url)
  };
}

function clearAllYouTubeConnections(request: NextRequest, response: NextResponse, secret?: string) {
  if (secret) {
    const registryCookie = request.cookies.get(YOUTUBE_CONNECTIONS_COOKIE)?.value;
    if (registryCookie) {
      try {
        const registry = unsealConnectionRegistry(registryCookie, secret);
        for (const item of registry.connections) {
          response.cookies.set(youtubeConnectionCookieName(item.connectionId), "", { ...youtubeCookieOptions, maxAge: 0 });
        }
      } catch {}
    }
  }
  // 손상된 registry도 정리할 수 있도록 요청에 실린 connection cookie를 모두 제거한다.
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith(YOUTUBE_CONNECTION_COOKIE_PREFIX)) response.cookies.set(cookie.name, "", { ...youtubeCookieOptions, maxAge: 0 });
  }
  response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  response.cookies.set(YOUTUBE_STATE_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
}

export async function GET(request: NextRequest) {
  const base = baseStatus(request);
  const server = appSessionSecret();
  if (!base.serverConfigured) return NextResponse.json({ ...base, configured: false, remember: false }, { headers: { "Cache-Control": "no-store" } });
  const cookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!cookie) return NextResponse.json({ ...base, configured: false, remember: false }, { headers: { "Cache-Control": "no-store" } });
  try {
    const config = unsealClientConfig(cookie, server.secret);
    return NextResponse.json({ ...base, configured: true, remember: config.remember }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    const response = NextResponse.json({ ...base, configured: false, remember: false }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(YOUTUBE_CONFIG_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    clearAllYouTubeConnections(request, response, server.secret);
    return response;
  }
}

export async function POST(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return NextResponse.json({ error: "배포 서버에 APP_SESSION_SECRET가 설정되지 않았습니다." }, { status: 503 });

  try {
    const body = await request.json() as Partial<{ clientId: string; clientSecret: string; remember: boolean }>;
    const config = validateYouTubeClientConfig(body);
    const response = NextResponse.json({ ok: true, configured: true, remember: config.remember, redirectUri: oauthRedirectUri(request.url) }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(YOUTUBE_CONFIG_COOKIE, sealClientConfig(config, server.secret), youtubeRememberCookieOptions(config.remember));
    // OAuth Client 자체를 바꾸면 기존 채널 토큰은 새 Client와 갱신할 수 없으므로 채널 연결만 초기화한다.
    clearAllYouTubeConnections(request, response, server.secret);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google OAuth 설정을 저장하지 못했습니다." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const server = appSessionSecret();
  const response = NextResponse.json({ ok: true, ...baseStatus(request), configured: false }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(YOUTUBE_CONFIG_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  clearAllYouTubeConnections(request, response, server.configured ? server.secret : undefined);
  return response;
}
