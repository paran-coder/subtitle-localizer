import { randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import { getMyYouTubeChannel } from "@/lib/youtube";
import {
  emptyConnectionRegistry,
  oauthRedirectUri,
  sealConnectionRegistry,
  sealSession,
  unsealClientConfig,
  unsealConnectionRegistry,
  unsealSession,
  upsertConnectionRegistry,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_CONNECTIONS_COOKIE,
  YOUTUBE_SESSION_COOKIE,
  YOUTUBE_STATE_COOKIE,
  youtubeConnectionCookieName,
  youtubeCookieOptions,
  youtubeRememberCookieOptions
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

function sameState(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const home = new URL("/connections", request.url);
  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam) {
    home.searchParams.set("youtube", "denied");
    return NextResponse.redirect(home);
  }

  const server = appSessionSecret();
  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value ?? "";
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const expectedState = request.cookies.get(YOUTUBE_STATE_COOKIE)?.value ?? "";
  if (!server.configured || !configCookie || !code || !state || !expectedState || !sameState(state, expectedState)) {
    home.searchParams.set("youtube", "invalid-state");
    return NextResponse.redirect(home);
  }

  try {
    const client = unsealClientConfig(configCookie, server.secret);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: client.clientId,
        client_secret: client.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: oauthRedirectUri(request.url)
      }),
      cache: "no-store"
    });

    const token = (await tokenResponse.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      error_description?: string;
    };
    if (!tokenResponse.ok || !token.access_token) {
      home.searchParams.set("youtube", "token-error");
      return NextResponse.redirect(home);
    }

    let channel: Awaited<ReturnType<typeof getMyYouTubeChannel>>;
    try {
      channel = await getMyYouTubeChannel(token.access_token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      home.searchParams.set("youtube", /채널을 찾지 못했습니다/.test(message) ? "no-channel" : "channel-error");
      return NextResponse.redirect(home);
    }

    let registry = emptyConnectionRegistry();
    const registryCookie = request.cookies.get(YOUTUBE_CONNECTIONS_COOKIE)?.value;
    if (registryCookie) {
      try { registry = unsealConnectionRegistry(registryCookie, server.secret); } catch {}
    }

    const existing = registry.connections.find((item) => item.channelId === channel.id);
    const connectionId = existing?.connectionId ?? randomUUID();
    let refreshToken = token.refresh_token;
    if (!refreshToken && existing) {
      try {
        const priorCookie = request.cookies.get(youtubeConnectionCookieName(existing.connectionId))?.value;
        if (priorCookie) refreshToken = unsealSession(priorCookie, server.secret).refreshToken;
      } catch {}
    }

    const session = {
      accessToken: token.access_token,
      refreshToken,
      expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
      scope: token.scope
    };
    registry = upsertConnectionRegistry(registry, {
      connectionId,
      channelId: channel.id,
      channelTitle: channel.title,
      channelThumbnail: channel.thumbnail,
      connectedAt: Date.now()
    });
    const active = registry.connections.find((item) => item.channelId === channel.id)!;

    home.searchParams.set("youtube", "connected");
    home.searchParams.set("connection", active.connectionId);
    const response = NextResponse.redirect(home);
    response.cookies.set(YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(registry, server.secret), youtubeRememberCookieOptions(client.remember));
    response.cookies.set(youtubeConnectionCookieName(active.connectionId), sealSession(session, server.secret), youtubeRememberCookieOptions(client.remember));
    response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    response.cookies.set(YOUTUBE_STATE_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
    return response;
  } catch {
    home.searchParams.set("youtube", "token-error");
    return NextResponse.redirect(home);
  }
}
