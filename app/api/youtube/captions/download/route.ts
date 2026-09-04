import { NextRequest, NextResponse } from "next/server";
import { parseSrt } from "@/lib/srt";
import { downloadCaptionTrackAsSrt } from "@/lib/youtube";
import { refreshYouTubeSession, sealSession, unsealSession, YOUTUBE_SESSION_COOKIE, youtubeConfig, youtubeCookieOptions } from "@/lib/youtube-auth";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const config = youtubeConfig();
  const cookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!config.configured) return NextResponse.json({ error: "YouTube OAuth가 설정되지 않았습니다." }, { status: 503 });
  if (!cookie) return NextResponse.json({ error: "YouTube 연결이 필요합니다." }, { status: 401 });

  let captionId = "";
  try {
    const body = await request.json() as { id?: unknown };
    captionId = typeof body.id === "string" ? body.id.trim() : "";
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }
  if (!captionId || captionId.length > 256) {
    return NextResponse.json({ error: "자막 트랙 ID가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const original = unsealSession(cookie, config.sessionSecret);
    const session = await refreshYouTubeSession(original);
    const srt = await downloadCaptionTrackAsSrt(session.accessToken, captionId);
    if (Buffer.byteLength(srt, "utf8") > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "가져온 자막이 5MB를 초과합니다." }, { status: 413 });
    }
    parseSrt(srt);
    const response = NextResponse.json({ srt }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, config.sessionSecret), {
        ...youtubeCookieOptions,
        maxAge: 30 * 24 * 60 * 60
      });
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 자막을 가져오지 못했습니다.";
    const authError = /인증|세션|permission|unauthorized/i.test(message);
    const status = authError ? 401 : /SRT|자막.*형식|파싱/i.test(message) ? 422 : 500;
    const response = NextResponse.json({ error: message }, { status });
    if (authError) response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
