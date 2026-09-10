import type { TranslationItem, TranslationStyle } from "./types";

const STYLE_INSTRUCTIONS: Record<TranslationStyle, string> = {
  natural: "Write natural, idiomatic subtitles that sound native to the target audience. Preserve the source tone without sounding translated.",
  faithful: "Stay close to the source meaning and tone. Avoid unnecessary paraphrasing while remaining grammatical and natural in the target language.",
  concise: "Prefer shorter subtitle wording when the same meaning can be preserved. Remove verbal filler only when it does not change intent or tone.",
  education: "Prioritize terminology accuracy, conceptual consistency, and clear instructional wording. Do not oversimplify technical meaning.",
  business: "Use polished, professional wording with the same degree of formality as the source. Avoid inflated corporate language."
};

const LANGUAGE_NOTES: Record<string, string> = {
  en: "For English: use natural, concise subtitle English; preserve the source register and intent; avoid literal calques and source-language word order when they sound unnatural in English.",
  ko: "For Korean: prefer natural subtitle Korean over source-language word order; omit redundant subjects/pronouns when context makes them clear; keep speech level consistent with the source tone.",
  ja: "For Japanese: prefer natural Japanese subtitle order; avoid unnecessary explicit pronouns; keep politeness/register consistent and concise.",
  es: "For Spanish: default to broadly understandable neutral Spanish unless the glossary specifies a locale; avoid expanding simple source wording into unnecessarily long phrasing.",
  "pt-BR": "For Brazilian Portuguese: use natural Brazilian usage and preserve conversational tone; avoid European Portuguese wording unless explicitly requested.",
  "zh-CN": "For Simplified Chinese: use concise natural Mainland-style Simplified Chinese unless context clearly indicates otherwise.",
  "zh-TW": "For Traditional Chinese: use natural Traditional Chinese and avoid mechanically converting Simplified wording when a more idiomatic expression exists.",
  ru: "For Russian: use natural, concise Russian subtitle phrasing; avoid literal calques and unnatural source-language word order; preserve register and tone, and infer grammatical gender or number only when supported by the source."
};

export type TranslateCueInput = {
  id: number;
  text: string;
  durationMs?: number;
};

export type TranslateChunkInput = {
  targetLanguageCode: string;
  targetLanguageName: string;
  style: TranslationStyle;
  glossary?: string;
  contextBefore?: Array<{ id: number; text: string }>;
  cues: TranslateCueInput[];
  contextAfter?: Array<{ id: number; text: string }>;
};

type ResponsesPayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: { message?: string };
};

class OpenAIRequestError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "OpenAIRequestError";
    this.retryable = retryable;
  }
}

function extractOutputText(payload: ResponsesPayload): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string" && content.text.trim()) return content.text;
    }
  }
  throw new Error(payload.error?.message || "번역 모델의 응답 텍스트를 찾지 못했습니다.");
}

export function validateTranslationItems(
  source: Array<{ id: number; text: string }>,
  translated: unknown
): TranslationItem[] {
  if (!translated || typeof translated !== "object") throw new Error("번역 응답 형식이 잘못되었습니다.");
  const items = (translated as { items?: unknown }).items;
  if (!Array.isArray(items)) throw new Error("번역 응답에 items 배열이 없습니다.");

  const normalized = items.map((item) => {
    if (!item || typeof item !== "object") throw new Error("번역 항목 형식이 잘못되었습니다.");
    const id = (item as { id?: unknown }).id;
    const text = (item as { text?: unknown }).text;
    if (!Number.isInteger(id) || typeof text !== "string" || !text.trim()) {
      throw new Error("번역 항목의 id/text가 올바르지 않습니다.");
    }
    return { id: id as number, text: text.trim() };
  });

  const expectedIds = source.map((item) => item.id);
  const actualIds = normalized.map((item) => item.id);
  if (new Set(actualIds).size !== actualIds.length) throw new Error("번역 응답에 중복 id가 있습니다.");
  if (expectedIds.length !== actualIds.length || expectedIds.some((id) => !actualIds.includes(id))) {
    throw new Error("번역 응답의 자막 id가 원본과 일치하지 않습니다.");
  }

  return expectedIds.map((id) => normalized.find((item) => item.id === id)!);
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export async function translateChunk(input: TranslateChunkInput, apiKey: string): Promise<TranslationItem[]> {
  const normalizedApiKey = apiKey.trim();
  if (!normalizedApiKey) throw new Error("OpenAI API Key를 입력해 주세요.");
  if (normalizedApiKey.length > 512) throw new Error("OpenAI API Key 형식이 올바르지 않습니다.");

  const model = process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.6-luna";
  const sourceIds = input.cues.map((cue) => cue.id);
  const languageNote = LANGUAGE_NOTES[input.targetLanguageCode] ?? "Use idiomatic target-language subtitle conventions rather than source-language word order.";

  const instructions = [
    "You are a professional subtitle localizer for YouTube.",
    `Translate ONLY the cues in the \"cues\" array into ${input.targetLanguageName} (${input.targetLanguageCode}).`,
    "Detect and understand the source language from the supplied subtitle text. Do not assume the source language is English.",
    "contextBefore and contextAfter are reference context only. Never output them.",
    "Keep every cue aligned to the same ID. Never merge, split, add, remove, renumber, or reorder cue IDs.",
    "Read across cue boundaries to understand the full sentence, but keep each returned cue semantically aligned to its source segment.",
    "The optional durationMs is a reading-time hint. Prefer concise phrasing for short cues, but never drop essential meaning just to shorten text.",
    "Prefer at most two subtitle lines. Do not insert forced line breaks unless they improve readability.",
    "Preserve names, brands, URLs, technical identifiers, version numbers, quantities, and meaningful punctuation unless there is a well-established localized form.",
    "Preserve subtitle formatting tags such as <i>, <b>, and <u>, plus speaker/music markers when present; translate only human-readable language inside them.",
    "Do not add explanations, translator notes, labels, markdown fences, or quotation marks around subtitle text.",
    STYLE_INSTRUCTIONS[input.style],
    languageNote,
    input.glossary?.trim() ? `Glossary / terminology rules (highest terminology priority):\n${input.glossary.trim()}` : ""
  ].filter(Boolean).join("\n");

  const body = {
    model,
    store: false,
    ...(model.toLowerCase().startsWith("gpt-5") ? { reasoning: { effort: "none" } } : {}),
    instructions,
    input: JSON.stringify({
      contextBefore: input.contextBefore ?? [],
      cues: input.cues,
      contextAfter: input.contextAfter ?? []
    }),
    text: {
      format: {
        type: "json_schema",
        name: "subtitle_translation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              minItems: sourceIds.length,
              maxItems: sourceIds.length,
              items: {
                type: "object",
                properties: {
                  id: { type: "integer", enum: sourceIds },
                  text: { type: "string", minLength: 1 }
                },
                required: ["id", "text"],
                additionalProperties: false
              }
            }
          },
          required: ["items"],
          additionalProperties: false
        }
      }
    }
  };

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${normalizedApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(55_000)
      });

      const payload = (await response.json()) as ResponsesPayload;
      if (!response.ok) {
        const friendlyMessage = response.status === 401
          ? "OpenAI API Key가 올바르지 않거나 비활성화되어 있습니다."
          : response.status === 429
            ? "OpenAI 계정의 사용 한도 또는 요청 속도 제한에 도달했습니다."
            : response.status === 403
              ? "이 OpenAI API Key에는 요청한 모델을 사용할 권한이 없습니다."
              : payload.error?.message || `OpenAI API 오류 (${response.status})`;
        throw new OpenAIRequestError(friendlyMessage, isRetryableStatus(response.status));
      }

      const outputText = extractOutputText(payload);
      return validateTranslationItems(input.cues, JSON.parse(outputText));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("알 수 없는 번역 오류가 발생했습니다.");
      const retryable = !(lastError instanceof OpenAIRequestError) || lastError.retryable;
      if (attempt === 0 && retryable) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        continue;
      }
      break;
    }
  }

  throw lastError ?? new Error("번역에 실패했습니다.");
}
