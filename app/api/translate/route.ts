import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { LANGUAGES } from "@/lib/languages";
import { DEFAULT_CHUNK_OPTIONS, MAX_TRANSLATABLE_CUE_CHARS } from "@/lib/srt";
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
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function checkAccess(request: Request): string | null {
  const expected = process.env.SUBTITLE_APP_ACCESS_KEY?.trim();
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      return "서버에 SUBTITLE_APP_ACCESS_KEY가 설정되지 않았습니다.";
    }
    return null;
  }

  const provided = request.headers.get("x-subtitle-access-key")?.trim() ?? "";
  if (!provided || !safeEqual(provided, expected)) {
    return "배포 보호 키가 올바르지 않습니다.";
  }
  return null;
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
    if (!Number.isInteger(id) || typeof text !== "string" || !text.trim() || text.length > MAX_CUE_CHARS) {
      return false;
    }
    if (durationMs !== undefined && (!Number.isFinite(durationMs) || (durationMs as number) <= 0 || (durationMs as number) > 86_400_000)) return false;
    if (ids.has(id as number)) return false;
    ids.add(id as number);
    totalChars += text.length;
    if (totalChars > maxChars) return false;
  }
  return true;
}

export async function POST(request: Request) {
  try {
    const accessError = checkAccess(request);
    if (accessError) {
      const status = accessError.includes("설정되지") ? 503 : 401;
      return json({ error: accessError }, status);
    }

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
    if (typeof body.style !== "string" || !STYLES.has(body.style as TranslationStyle)) {
      return json({ error: "번역 스타일이 올바르지 않습니다." }, 400);
    }
    if (!isCueArray(body.cues, MAX_CHUNK_CHARS) || body.cues.length === 0) {
      return json({ error: "번역할 자막 데이터가 올바르지 않거나 너무 큽니다." }, 400);
    }
    if (body.contextBefore !== undefined && !isCueArray(body.contextBefore, MAX_CONTEXT_CHARS)) {
      return json({ error: "이전 문맥 데이터가 올바르지 않습니다." }, 400);
    }
    if (body.contextAfter !== undefined && !isCueArray(body.contextAfter, MAX_CONTEXT_CHARS)) {
      return json({ error: "다음 문맥 데이터가 올바르지 않습니다." }, 400);
    }
    if (body.glossary !== undefined && (typeof body.glossary !== "string" || body.glossary.length > 8_000)) {
      return json({ error: "Glossary가 너무 깁니다." }, 400);
    }

    const items = await translateChunk({
      targetLanguageCode: language.code,
      targetLanguageName: language.label,
      style: body.style as TranslationStyle,
      glossary: typeof body.glossary === "string" ? body.glossary : "",
      cues: body.cues,
      contextBefore: (body.contextBefore as Array<{ id: number; text: string }> | undefined) ?? [],
      contextAfter: (body.contextAfter as Array<{ id: number; text: string }> | undefined) ?? []
    });

    return json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "번역 요청 처리 중 오류가 발생했습니다.";
    const missingKey = message.includes("OPENAI_API_KEY");
    return json({ error: message }, missingKey ? 503 : 500);
  }
}
