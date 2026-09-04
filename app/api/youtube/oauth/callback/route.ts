import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  oauthRedirectUri,
  sealSession,
  YOUTUBE_SESSION_COOKIE,
  YOUTUBE_STATE_COOKIE,
  youtubeConfig,
  youtubeCookieOptions
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

function sameState(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const home = new URL("/", request.url);
  const errorParam = request.nextUrl.searchParams.get("error");
  if (errorParam) {
    home.searchParams.set("youtube", "denied");
    return NextResponse.redirect(home);
  }

  const config = youtubeConfig();
  const code = request.nextUrl.searchParams.get("code") ?? "";
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const expectedState = request.cookies.get(YOUTUBE_STATE_COOKIE)?.value ?? "";
  if (!config.configured || !code || !state || !expectedState || !sameState(state, expectedState)) {
    home.searchParams.set("youtube", "invalid-state");
    return NextResponse.redirect(home);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
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

  const session = sealSession({
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
    scope: token.scope
  }, config.sessionSecret);

  home.searchParams.set("youtube", "connected");
  const response = NextResponse.redirect(home);
  response.cookies.set(YOUTUBE_SESSION_COOKIE, session, {
    ...youtubeCookieOptions,
    maxAge: 30 * 24 * 60 * 60
  });
  response.cookies.set(YOUTUBE_STATE_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  return response;
}
