import { NextRequest, NextResponse } from "next/server";
import { LANGUAGES } from "@/lib/languages";
import { OPENAI_CREDENTIAL_COOKIE, unsealOpenAiCredential } from "@/lib/openai-credential";
import { DEFAULT_CHUNK_OPTIONS, MAX_TRANSLATABLE_CUE_CHARS } from "@/lib/srt";
import { appSessionSecret, secureCookieOptions } from "@/lib/secure-session";
import { translateChunk } from "@/lib/translation";
import type { TranslationStyle } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const STYLES = new Set<TranslationStyle>(["natural", "faithful", "concise", "education", "business"]);
const MAX_CUES = DEFAULT_CHUNK_OPTIONS.maxCues;
const MAX_CUE_CHARS = MAX_TRANSLATABLE_CUE_CHARS;
const MAX_CHUNK_CHARS = DEFAULT_CHUNK_OPTIONS.maxChars;
const MAX_CONTEXT_CHARS = 4_000;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function isCueArray(value: unknown, maxChars: number): value is Array<{ id: number; text: string; durationMs?: number }> {
  if (!Array.isArray(value) || value.length > MAX_CUES) return false;
  const ids = new Set<number>();
  let totalChars = 0;
  for (const item of value) {
    if (!item || typeof item !== "object") return false;
    const id = (item as { id?: unknown }).id;
    const text = (item as { text?: unknown }).text;
    const durationMs = (item as { durationMs?: unknown }).durationMs;
    if (!Number.isInteger(id) || typeof text !== "string" || !text.trim() || text.length > MAX_CUE_CHARS) return false;
    if (durationMs !== undefined && (!Number.isFinite(durationMs) || (durationMs as number) <= 0 || (durationMs as number) > 86_400_000)) return false;
    if (ids.has(id as number)) return false;
    ids.add(id as number);
    totalChars += text.length;
    if (totalChars > maxChars) return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  const server = appSessionSecret();
  if (!server.configured) return json({ error: "배포 서버에 APP_SESSION_SECRET가 설정되지 않았습니다." }, 503);
  const credentialCookie = request.cookies.get(OPENAI_CREDENTIAL_COOKIE)?.value;
  if (!credentialCookie) return json({ error: "본인의 OpenAI API Key를 먼저 연결해 주세요." }, 401);

  let apiKey = "";
  try {
    apiKey = unsealOpenAiCredential(credentialCookie, server.secret).apiKey;
  } catch {
    const response = json({ error: "저장된 OpenAI API Key 세션을 읽지 못했습니다. 키를 다시 연결해 주세요." }, 401);
    response.cookies.set(OPENAI_CREDENTIAL_COOKIE, "", { ...secureCookieOptions, maxAge: 0 });
    return response;
  }

  try {
    const body = (await request.json()) as {
      languageCode?: unknown;
      style?: unknown;
      glossary?: unknown;
      cues?: unknown;
      contextBefore?: unknown;
      contextAfter?: unknown;
    };

    const language = LANGUAGES.find((item) => item.code === body.languageCode);
    if (!language) return json({ error: "지원하지 않는 번역 언어입니다." }, 400);
    if (typeof body.style !== "string" || !STYLES.has(body.style as TranslationStyle)) return json({ error: "번역 스타일이 올바르지 않습니다." }, 400);
    if (!isCueArray(body.cues, MAX_CHUNK_CHARS) || body.cues.length === 0) return json({ error: "번역할 자막 데이터가 올바르지 않거나 너무 큽니다." }, 400);
    if (body.contextBefore !== undefined && !isCueArray(body.contextBefore, MAX_CONTEXT_CHARS)) return json({ error: "이전 문맥 데이터가 올바르지 않습니다." }, 400);
    if (body.contextAfter !== undefined && !isCueArray(body.contextAfter, MAX_CONTEXT_CHARS)) return json({ error: "다음 문맥 데이터가 올바르지 않습니다." }, 400);
    if (body.glossary !== undefined && (typeof body.glossary !== "string" || body.glossary.length > 8_000)) return json({ error: "Glossary가 너무 깁니다." }, 400);

    const items = await translateChunk({
      targetLanguageCode: language.code,
      targetLanguageName: language.label,
      style: body.style as TranslationStyle,
      glossary: typeof body.glossary === "string" ? body.glossary : "",
      cues: body.cues,
      contextBefore: (body.contextBefore as Array<{ id: number; text: string }> | undefined) ?? [],
      contextAfter: (body.contextAfter as Array<{ id: number; text: string }> | undefined) ?? []
    }, apiKey);

    return json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "번역 요청 처리 중 문제가 발생했습니다.";
    const status = /한도|속도 제한/.test(message) ? 429 : /권한/.test(message) ? 403 : /API Key|키/.test(message) ? 401 : 500;
    const response = json({ error: message }, status);
    if (status === 401) response.cookies.set(OPENAI_CREDENTIAL_COOKIE, "", { ...secureCookieOptions, maxAge: 0 });
    return response;
  }
}
