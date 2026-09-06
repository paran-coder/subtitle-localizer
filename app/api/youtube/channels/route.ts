import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import { getMyYouTubeChannel } from "@/lib/youtube";
import {
  activeConnectionMeta,
  emptyConnectionRegistry,
  refreshYouTubeSession,
  removeConnectionRegistry,
  sealConnectionRegistry,
  sealSession,
  selectConnectionRegistry,
  unsealClientConfig,
  unsealConnectionRegistry,
  unsealSession,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_CONNECTIONS_COOKIE,
  youtubeConnectionCookieName,
  youtubeCookieOptions,
  youtubeRememberCookieOptions
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

function noStore(data: object, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function load(request: NextRequest, secret: string) {
  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!configCookie) throw new Error("본인의 Google OAuth Client 설정이 필요합니다.");
  const client = unsealClientConfig(configCookie, secret);
  const registryCookie = request.cookies.get(YOUTUBE_CONNECTIONS_COOKIE)?.value;
  const registry = registryCookie ? unsealConnectionRegistry(registryCookie, secret) : emptyConnectionRegistry();
  return { client, registry };
}

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return noStore({ error: "배포 서버의 세션 암호화 설정이 필요합니다." }, 503);
  try {
    const { registry } = load(request, server.secret);
    return noStore({ activeConnectionId: registry.activeConnectionId, connections: registry.connections });
  } catch (error) {
    return noStore({ error: error instanceof Error ? error.message : "YouTube 채널 연결을 불러오지 못했습니다." }, 401);
  }
}

export async function PATCH(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return noStore({ error: "배포 서버의 세션 암호화 설정이 필요합니다." }, 503);
  try {
    const { client, registry } = load(request, server.secret);
    const body = await request.json() as { connectionId?: unknown };
    const connectionId = typeof body.connectionId === "string" ? body.connectionId.trim() : "";
    const selected = registry.connections.find((item) => item.connectionId === connectionId);
    if (!selected) return noStore({ error: "선택한 YouTube 채널 연결을 찾지 못했습니다." }, 404);

    const sessionCookieName = youtubeConnectionCookieName(selected.connectionId);
    const sessionCookie = request.cookies.get(sessionCookieName)?.value;
    if (!sessionCookie) {
      return noStore({ error: "이 채널의 인증 세션이 없습니다. 계정 또는 채널 추가에서 같은 채널을 다시 연결해 주세요." }, 409);
    }

    try {
      const original = unsealSession(sessionCookie, server.secret);
      const session = await refreshYouTubeSession(original, client);
      const channel = await getMyYouTubeChannel(session.accessToken);
      if (channel.id !== selected.channelId) {
        throw new Error("저장된 인증 세션과 선택한 YouTube 채널이 일치하지 않습니다. 같은 채널을 다시 연결해 주세요.");
      }

      const next = selectConnectionRegistry(registry, connectionId);
      const response = noStore({ ok: true, activeConnectionId: next.activeConnectionId, connections: next.connections });
      response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(next, server.secret), youtubeRememberCookieOptions(client.remember));
      if (session.accessToken !== original.accessToken) {
        response.cookies.set(sessionCookieName, sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
      }
      return response;
    } catch (error) {
      return noStore({
        error: error instanceof Error
          ? error.message
          : "이 채널의 Google 인증을 확인하지 못했습니다. 같은 채널을 다시 연결해 주세요."
      }, 409);
    }
  } catch (error) {
    return noStore({ error: error instanceof Error ? error.message : "YouTube 채널을 선택하지 못했습니다." }, 400);
  }
}

export async function DELETE(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return noStore({ error: "배포 서버의 세션 암호화 설정이 필요합니다." }, 503);
  try {
    const { client, registry } = load(request, server.secret);
    const requested = request.nextUrl.searchParams.get("connectionId")?.trim();
    const connectionId = requested || activeConnectionMeta(registry)?.connectionId || "";
    if (!connectionId || !registry.connections.some((item) => item.connectionId === connectionId)) {
      return noStore({ error: "해제할 YouTube 채널 연결을 찾지 못했습니다." }, 404);
    }
    const next = removeConnectionRegistry(registry, connectionId);
    const response = noStore({ ok: true, activeConnectionId: next.activeConnectionId, connections: next.connections });
    response.cookies.set(youtubeConnectionCookieName(connectionId), "", { ...youtubeCookieOptions, maxAge: 0 });
    if (next.connections.length) response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(next, server.secret), youtubeRememberCookieOptions(client.remember));
    else response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  } catch (error) {
    return noStore({ error: error instanceof Error ? error.message : "YouTube 채널 연결을 해제하지 못했습니다." }, 400);
  }
}
