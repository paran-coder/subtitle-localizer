import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import {
  oauthRedirectUri,
  sealClientConfig,
  unsealClientConfig,
  validateYouTubeClientConfig,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_SESSION_COOKIE,
  YOUTUBE_STATE_COOKIE,
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
    response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
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
    response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    response.cookies.set(YOUTUBE_STATE_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Google OAuth 설정을 저장하지 못했습니다." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true, ...baseStatus(request), configured: false }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(YOUTUBE_CONFIG_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  response.cookies.set(YOUTUBE_STATE_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  return response;
}
