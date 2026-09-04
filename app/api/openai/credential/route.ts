import { NextRequest, NextResponse } from "next/server";
import {
  OPENAI_CREDENTIAL_COOKIE,
  sealOpenAiCredential,
  unsealOpenAiCredential,
  validateOpenAiCredential
} from "@/lib/openai-credential";
import { appSessionSecret, rememberedCookieOptions, secureCookieOptions } from "@/lib/secure-session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return NextResponse.json({ serverConfigured: false, configured: false, remember: false }, { headers: { "Cache-Control": "no-store" } });
  const cookie = request.cookies.get(OPENAI_CREDENTIAL_COOKIE)?.value;
  if (!cookie) return NextResponse.json({ serverConfigured: true, configured: false, remember: false }, { headers: { "Cache-Control": "no-store" } });
  try {
    const credential = unsealOpenAiCredential(cookie, server.secret);
    return NextResponse.json({ serverConfigured: true, configured: true, remember: credential.remember }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    const response = NextResponse.json({ serverConfigured: true, configured: false, remember: false }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(OPENAI_CREDENTIAL_COOKIE, "", { ...secureCookieOptions, maxAge: 0 });
    return response;
  }
}

export async function POST(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return NextResponse.json({ error: "배포 서버에 APP_SESSION_SECRET가 설정되지 않았습니다." }, { status: 503 });
  try {
    const body = await request.json() as Partial<{ apiKey: string; remember: boolean }>;
    const credential = validateOpenAiCredential(body);
    const response = NextResponse.json({ ok: true, configured: true, remember: credential.remember }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(OPENAI_CREDENTIAL_COOKIE, sealOpenAiCredential(credential, server.secret), rememberedCookieOptions(credential.remember));
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OpenAI API Key를 저장하지 못했습니다." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return NextResponse.json({ error: "배포 서버에 APP_SESSION_SECRET가 설정되지 않았습니다." }, { status: 503 });
  const cookie = request.cookies.get(OPENAI_CREDENTIAL_COOKIE)?.value;
  if (!cookie) return NextResponse.json({ error: "먼저 OpenAI API Key를 저장해 주세요." }, { status: 401 });
  try {
    const body = await request.json() as { remember?: unknown };
    const current = unsealOpenAiCredential(cookie, server.secret);
    const credential = { ...current, remember: Boolean(body.remember) };
    const response = NextResponse.json({ ok: true, configured: true, remember: credential.remember }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(OPENAI_CREDENTIAL_COOKIE, sealOpenAiCredential(credential, server.secret), rememberedCookieOptions(credential.remember));
    return response;
  } catch {
    return NextResponse.json({ error: "OpenAI API Key 기억 설정을 변경하지 못했습니다." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, configured: false }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(OPENAI_CREDENTIAL_COOKIE, "", { ...secureCookieOptions, maxAge: 0 });
  return response;
}
