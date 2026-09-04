import { NextRequest, NextResponse } from "next/server";
import { parseSrt } from "@/lib/srt";
import { downloadCaptionTrackAsSrt } from "@/lib/youtube";
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
    const client = unsealClientConfig(configCookie, server.secret);
    const original = unsealSession(cookie, server.secret);
    const session = await refreshYouTubeSession(original, client);
    const srt = await downloadCaptionTrackAsSrt(session.accessToken, captionId);
    if (Buffer.byteLength(srt, "utf8") > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "가져온 자막이 5MB를 초과합니다." }, { status: 413 });
    }
    parseSrt(srt);
    const response = NextResponse.json({ srt }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
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
