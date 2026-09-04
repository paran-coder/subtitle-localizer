import { NextResponse } from "next/server";
import { LANGUAGES } from "@/lib/languages";
import { translateChunk } from "@/lib/translation";
import type { TranslationStyle } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const STYLES = new Set<TranslationStyle>(["natural", "faithful", "concise", "education", "business"]);

function isCueArray(value: unknown): value is Array<{ id: number; text: string }> {
  return (
    Array.isArray(value) &&
    value.length <= 48 &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        Number.isInteger((item as { id?: unknown }).id) &&
        typeof (item as { text?: unknown }).text === "string" &&
        (item as { text: string }).text.trim().length > 0 &&
        (item as { text: string }).text.length <= 2_000
    )
  );
}

export async function POST(request: Request) {
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
    if (!language) return NextResponse.json({ error: "지원하지 않는 번역 언어입니다." }, { status: 400 });
    if (typeof body.style !== "string" || !STYLES.has(body.style as TranslationStyle)) {
      return NextResponse.json({ error: "번역 스타일이 올바르지 않습니다." }, { status: 400 });
    }
    if (!isCueArray(body.cues) || body.cues.length === 0) {
      return NextResponse.json({ error: "번역할 자막 데이터가 올바르지 않습니다." }, { status: 400 });
    }
    if (body.contextBefore !== undefined && !isCueArray(body.contextBefore)) {
      return NextResponse.json({ error: "이전 문맥 데이터가 올바르지 않습니다." }, { status: 400 });
    }
    if (body.contextAfter !== undefined && !isCueArray(body.contextAfter)) {
      return NextResponse.json({ error: "다음 문맥 데이터가 올바르지 않습니다." }, { status: 400 });
    }
    if (body.glossary !== undefined && (typeof body.glossary !== "string" || body.glossary.length > 8_000)) {
      return NextResponse.json({ error: "Glossary가 너무 깁니다." }, { status: 400 });
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

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "번역 요청 처리 중 오류가 발생했습니다.";
    const missingKey = message.includes("OPENAI_API_KEY");
    return NextResponse.json({ error: message }, { status: missingKey ? 503 : 500 });
  }
}
