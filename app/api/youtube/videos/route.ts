import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import { listMyYouTubeVideos } from "@/lib/youtube";
import {
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
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return NextResponse.json({ error: "배포 서버의 세션 암호화 설정이 필요합니다." }, { status: 503 });
  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  const sessionCookie = request.cookies.get(YOUTUBE_SESSION_COOKIE)?.value;
  if (!configCookie) return NextResponse.json({ error: "본인의 Google OAuth Client 설정이 필요합니다." }, { status: 401 });
  if (!sessionCookie) return NextResponse.json({ error: "YouTube 연결이 필요합니다." }, { status: 401 });

  try {
    const client = unsealClientConfig(configCookie, server.secret);
    const original = unsealSession(sessionCookie, server.secret);
    const session = await refreshYouTubeSession(original, client);
    const data = await listMyYouTubeVideos(session.accessToken);
    const response = NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(YOUTUBE_SESSION_COOKIE, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 영상 목록을 불러오지 못했습니다.";
    const authError = /인증|세션|invalid_grant|permission|unauthorized/i.test(message);
    const response = NextResponse.json({ error: message }, { status: authError ? 401 : 500 });
    if (authError) response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
