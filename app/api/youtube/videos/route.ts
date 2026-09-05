import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import { listMyYouTubeVideos } from "@/lib/youtube";
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

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return NextResponse.json({ error: "배포 서버의 세션 암호화 설정이 필요합니다." }, { status: 503 });
  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!configCookie) return NextResponse.json({ error: "본인의 Google OAuth Client 설정이 필요합니다." }, { status: 401 });

  let sessionCookieName = YOUTUBE_SESSION_COOKIE;
  try {
    const client = unsealClientConfig(configCookie, server.secret);
    const stored = readStoredYouTubeSession(request.cookies, server.secret);
    sessionCookieName = stored.cookieName;
    const original = stored.session;
    const session = await refreshYouTubeSession(original, client);
    const data = await listMyYouTubeVideos(session.accessToken);
    if (stored.connection && data.channel.id !== stored.connection.channelId) {
      throw new Error("활성 YouTube 채널과 인증 세션이 일치하지 않습니다. 해당 채널을 다시 연결해 주세요.");
    }
    const response = NextResponse.json({ ...data, activeConnectionId: stored.connection?.connectionId }, { headers: { "Cache-Control": "no-store" } });
    if (session.accessToken !== original.accessToken) {
      response.cookies.set(sessionCookieName, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
    }
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "YouTube 영상 목록을 불러오지 못했습니다.";
    const authError = /인증|세션|invalid_grant|permission|unauthorized|일치하지 않습니다/i.test(message);
    const response = NextResponse.json({ error: message }, { status: authError ? 401 : 500 });
    if (authError) response.cookies.set(sessionCookieName, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  }
}
