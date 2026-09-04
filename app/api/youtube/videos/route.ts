import { NextRequest, NextResponse } from "next/server";
import { listMyYouTubeVideos } from "@/lib/youtube";
import { refreshYouTubeSession, sealSession, unsealSession, YOUTUBE_SESSION_COOKIE, youtubeConfig, youtubeCookieOptions } from "@/lib/youtube-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const config = youtubeConfig();
  const cookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!config.configured) return NextResponse.json({ error: "YouTube OAuth가 설정되지 않았습니다." }, { status: 503 });
  if (!cookie) return NextResponse.json({ error: "YouTube 연결이 필요합니다." }, { status: 401 });

  try {
    const original = unsealSession(cookie, config.sessionSecret);
    const session = await refreshYouTubeSession(original);
    const data = await listMyYouTubeVideos(session.accessToken);
    const response = NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, config.sessionSecret), {
        ...youtubeCookieOptions,
        maxAge: 30 * 24 * 60 * 60
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 영상 목록을 불러오지 못했습니다.";
    const authError = /인증|세션/.test(message);
    const response = NextResponse.json({ error: message }, { status: authError ? 401 : 500 });
    if (authError) response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
