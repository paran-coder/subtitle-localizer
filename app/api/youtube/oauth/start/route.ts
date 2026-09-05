import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { appSessionSecret } from "@/lib/secure-session";
import {
  oauthRedirectUri,
  unsealClientConfig,
  YOUTUBE_CONFIG_COOKIE,
  YOUTUBE_SCOPE,
  YOUTUBE_STATE_COOKIE,
  youtubeCookieOptions
} from "@/lib/youtube-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  const home = new URL("/connections", request.url);
  if (!server.configured) {
    home.searchParams.set("youtube", "server-not-configured");
    return NextResponse.redirect(home);
  }

  const configCookie = request.cookies.get(YOUTUBE_CONFIG_COOKIE)?.value;
  if (!configCookie) {
    home.searchParams.set("youtube", "client-not-configured");
    return NextResponse.redirect(home);
  }

  try {
    const client = unsealClientConfig(configCookie, server.secret);
    const state = randomBytes(24).toString("base64url");
    const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    auth.searchParams.set("client_id", client.clientId);
    auth.searchParams.set("redirect_uri", oauthRedirectUri(request.url));
    auth.searchParams.set("response_type", "code");
    auth.searchParams.set("scope", YOUTUBE_SCOPE);
    auth.searchParams.set("access_type", "offline");
    auth.searchParams.set("prompt", "consent");
    auth.searchParams.set("include_granted_scopes", "true");
    auth.searchParams.set("state", state);

    const response = NextResponse.redirect(auth);
    response.cookies.set(YOUTUBE_STATE_COOKIE, state, { ...youtubeCookieOptions, maxAge: 10 * 60 });
    return response;
  } catch {
    home.searchParams.set("youtube", "client-not-configured");
    return NextResponse.redirect(home);
  }
}
