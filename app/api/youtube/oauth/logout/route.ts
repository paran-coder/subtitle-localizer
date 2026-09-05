import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import {
  activeConnectionMeta,
  removeConnectionRegistry,
  sealConnectionRegistry,
  unsealClientConfig,
  unsealConnectionRegistry,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_CONNECTIONS_COOKIE,
  YOUTUBE_SESSION_COOKIE,
  youtubeConnectionCookieName,
  youtubeCookieOptions,
  youtubeRememberCookieOptions
} from "@/lib/youtube-auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  const server = appSessionSecret();
  if (!server.configured) return response;
  const registryCookie = request.cookies.get(YOUTUBE_CONNECTIONS_COOKIE)?.value;
  if (!registryCookie) {
    response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
  try {
    const registry = unsealConnectionRegistry(registryCookie, server.secret);
    const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
    const remember = configCookie ? unsealClientConfig(configCookie, server.secret).remember : false;
    let requested = "";
    try {
      const body = await request.json() as { connectionId?: unknown };
      requested = typeof body.connectionId === "string" ? body.connectionId.trim() : "";
    } catch {}
    const connectionId = requested || activeConnectionMeta(registry)?.connectionId || "";
    if (!connectionId) return response;
    const next = removeConnectionRegistry(registry, connectionId);
    response.cookies.set(youtubeConnectionCookieName(connectionId), "", { ...youtubeCookieOptions, maxAge: 0 });
    if (next.connections.length) response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(next, server.secret), youtubeRememberCookieOptions(remember));
    else response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  } catch {
    response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  }
  return response;
}
