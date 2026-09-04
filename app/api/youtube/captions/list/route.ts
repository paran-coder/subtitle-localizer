import { NextRequest, NextResponse } from "next/server";
import { listCaptionTracks } from "@/lib/youtube";
import { refreshYouTubeSession, sealSession, unsealClientConfig, unsealSession, YOUTUBE_CONFIG_COOKIE, YOUTUBE_SESSION_COOKIE, youtubeCookieOptions, youtubeRememberCookieOptions } from "@/lib/youtube-auth";
import { appSessionSecret } from "@/lib/secure-session";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const server = appSessionSecret();
  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  const cookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!server.configured) return NextResponse.json({ error: "배포 서버의 YouTube 세션 암호화 설정이 필요합니다." }, { status: 503 });
  if (!configCookie) return NextResponse.json({ error: "본인의 Google OAuth Client 설정이 필요합니다." }, { status: 401 });
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
    const client = unsealClientConfig(configCookie, server.secret);
    const original = unsealSession(cookie, server.secret);
    const session = await refreshYouTubeSession(original, client);
    const tracks = await listCaptionTracks(session.accessToken, videoId);
    const response = NextResponse.json({ tracks }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
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
