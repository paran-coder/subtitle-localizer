import { NextRequest, NextResponse } from "next/server";
import { YOUTUBE_SESSION_COOKIE, youtubeCookieOptions } from "@/lib/youtube-auth";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(YOUTUBE_SESSION_COOKIE, "", { ...youtubeCookieOptions, maxAge: 0 });
  return response;
}
