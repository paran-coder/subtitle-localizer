import { NextRequest, NextResponse } from "next/server";
import { refreshYouTubeSession, sealSession, unsealSession, YOUTUBE_SESSION_COOKIE, youtubeConfig, youtubeCookieOptions } from "@/lib/youtube-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const config = youtubeConfig();
  if (!config.configured) return NextResponse.json({ configured: false, connected: false });
  const cookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!cookie) return NextResponse.json({ configured: true, connected: false });

  try {
    const original = unsealSession(cookie, config.sessionSecret);
    const session = await refreshYouTubeSession(original);
    const response = NextResponse.json({ configured: true, connected: true }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, config.sessionSecret), {
        ...youtubeCookieOptions,
        maxAge: 30 * 24 * 60 * 60
      });
    }
    return response;
  } catch {
    const response = NextResponse.json({ configured: true, connected: false }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
