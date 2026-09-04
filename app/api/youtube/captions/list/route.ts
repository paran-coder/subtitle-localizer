import { NextRequest, NextResponse } from "next/server";
import { listCaptionTracks } from "@/lib/youtube";
import { refreshYouTubeSession, sealSession, unsealSession, YOUTUBE_SESSION_COOKIE, youtubeConfig, youtubeCookieOptions } from "@/lib/youtube-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const config = youtubeConfig();
  const cookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!config.configured) return NextResponse.json({ error: "YouTube OAuth가 설정되지 않았습니다." }, { status: 503 });
  if (!cookie) return NextResponse.json({ error: "YouTube 연결이 필요합니다." }, { status: 401 });

  let videoId = "";
  try {
    const body = await request.json() as { videoId?: unknown };
    videoId = typeof body.videoId === "string" ? body.videoId.trim() : "";
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!/^[\w-]{6,32}$/.test(videoId)) {
    return NextResponse.json({ error: "YouTube 영상 ID가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const original = unsealSession(cookie, config.sessionSecret);
    const session = await refreshYouTubeSession(original);
    const tracks = await listCaptionTracks(session.accessToken, videoId);
    const response = NextResponse.json({ tracks }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, config.sessionSecret), {
        ...youtubeCookieOptions,
        maxAge: 30 * 24 * 60 * 60
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 자막 목록을 불러오지 못했습니다.";
    const authError = /인증|세션|permission|unauthorized/i.test(message);
    const response = NextResponse.json({ error: message }, { status: authError ? 401 : 500 });
    if (authError) response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
