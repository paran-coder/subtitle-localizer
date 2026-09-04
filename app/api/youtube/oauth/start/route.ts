import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { oauthRedirectUri, YOUTUBE_SCOPE, YOUTUBE_STATE_COOKIE, youtubeConfig, youtubeCookieOptions } from "@/lib/youtube-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const config = youtubeConfig();
  if (!config.configured) {
    return NextResponse.redirect(new URL("/?youtube=not-configured", request.url));
  }

  const state = randomBytes(24).toString("base64url");
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.searchParams.set("client_id", config.clientId);
  auth.searchParams.set("redirect_uri", oauthRedirectUri(request.url));
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", YOUTUBE_SCOPE);
  auth.searchParams.set("access_type", "offline");
  auth.searchParams.set("prompt", "consent");
  auth.searchParams.set("include_granted_scopes", "true");
  auth.searchParams.set("state", state);

  const response = NextResponse.redirect(auth);
  response.cookies.set(YOUTUBE_STATE_COOKIE, state, {
    ...youtubeCookieOptions,
    maxAge: 10 * 60
  });
  return response;
}
