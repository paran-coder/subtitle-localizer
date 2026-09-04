import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import {
  oauthRedirectUri,
  refreshYouTubeSession,
  sealSession,
  unsealClientConfig,
  unsealSession,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_SESSION_COOKIE,
  youtubeCookieOptions,
  youtubeRememberCookieOptions
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  const base = { serverConfigured: server.configured, redirectUri: oauthRedirectUri(request.url) };
  if (!server.configured) return NextResponse.json({ ...base, configured: false, connected: false, remember: false }, { headers: { "Cache-Control": "no-store" } });

  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!configCookie) return NextResponse.json({ ...base, configured: false, connected: false, remember: false }, { headers: { "Cache-Control": "no-store" } });

  try {
    const client = unsealClientConfig(configCookie, server.secret);
    const sessionCookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
    if (!sessionCookie) return NextResponse.json({ ...base, configured: true, connected: false, remember: client.remember }, { headers: { "Cache-Control": "no-store" } });

    const original = unsealSession(sessionCookie, server.secret);
    const session = await refreshYouTubeSession(original, client);
    const response = NextResponse.json({ ...base, configured: true, connected: true, remember: client.remember }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
    }
    return response;
  } catch {
    const response = NextResponse.json({ ...base, configured: true, connected: false }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
