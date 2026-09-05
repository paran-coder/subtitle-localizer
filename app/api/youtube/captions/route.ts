import { NextRequest, NextResponse } from "next/server";
import { getLanguage } from "@/lib/languages";
import { parseSrt } from "@/lib/srt";
import { uploadCaptionTrack } from "@/lib/youtube";
import {
  readStoredYouTubeSession,
  refreshYouTubeSession,
  sealSession,
  unsealClientConfig,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_SESSION_COOKIE,
  youtubeCookieOptions,
  youtubeRememberCookieOptions
} from "@/lib/youtube-auth";
import { appSessionSecret } from "@/lib/secure-session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const server = appSessionSecret();
  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!server.configured) return NextResponse.json({ error: "배포 서버의 YouTube 세션 암호화 설정이 필요합니다." }, { status: 503 });
  if (!configCookie) return NextResponse.json({ error: "본인의 Google OAuth Client 설정이 필요합니다." }, { status: 401 });

  let sessionCookieName = YOUTUBE_SESSION_COOKIE;
  try {
    const body = (await request.json()) as {
      videoId?: unknown;
      languageCode?: unknown;
      trackName?: unknown;
      srt?: unknown;
    };
    if (typeof body.videoId !== "string" || !/^[\w-]{6,32}$/.test(body.videoId)) {
      return NextResponse.json({ error: "YouTube 영상 ID가 올바르지 않습니다." }, { status: 400 });
    }
    const language = typeof body.languageCode === "string" ? getLanguage(body.languageCode) : undefined;
    if (!language) return NextResponse.json({ error: "지원하지 않는 자막 언어입니다." }, { status: 400 });
    if (typeof body.srt !== "string" || body.srt.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "업로드할 SRT가 없거나 5MB를 초과했습니다." }, { status: 400 });
    }
    try {
      parseSrt(body.srt);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "SRT 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const trackName = typeof body.trackName === "string" && body.trackName.trim()
      ? body.trackName.trim()
      : "Subtitle Localizer";
    if (trackName.length > 150) return NextResponse.json({ error: "자막 트랙 이름은 150자 이하여야 합니다." }, { status: 400 });

    const client = unsealClientConfig(configCookie, server.secret);
    const stored = readStoredYouTubeSession(request.cookies, server.secret);
    sessionCookieName = stored.cookieName;
    const original = stored.session;
    const session = await refreshYouTubeSession(original, client);
    const uploaded = await uploadCaptionTrack({
      accessToken: session.accessToken,
      videoId: body.videoId,
      languageCode: language.code,
      trackName,
      srt: body.srt
    });
    const response = NextResponse.json({ ok: true, captionId: uploaded.id, language: language.code, activeConnectionId: stored.connection?.connectionId }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(sessionCookieName, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 자막 업로드에 실패했습니다.";
    const authError = /인증|세션|permission|unauthorized/i.test(message);
    const status = message.includes("이미 있습니다") ? 409 : authError ? 401 : 500;
    const response = NextResponse.json({ error: message }, { status });
    if (authError) response.cookies.set(sessionCookieName, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
