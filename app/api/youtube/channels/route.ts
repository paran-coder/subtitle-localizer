import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import {
  activeConnectionMeta,
  emptyConnectionRegistry,
  removeConnectionRegistry,
  sealConnectionRegistry,
  selectConnectionRegistry,
  unsealClientConfig,
  unsealConnectionRegistry,
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
    const next = selectConnectionRegistry(registry, connectionId);
    const response = noStore({ ok: true, activeConnectionId: next.activeConnectionId, connections: next.connections });
    response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(next, server.secret), youtubeRememberCookieOptions(client.remember));
    return response;
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
