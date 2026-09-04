import type { TranslationItem, TranslationStyle } from "./types";

const STYLE_INSTRUCTIONS: Record<TranslationStyle, string> = {
  natural: "Natural subtitle localization for YouTube. Prioritize fluent, idiomatic phrasing and readability while preserving meaning.",
  faithful: "Stay close to the source meaning and tone. Avoid unnecessary paraphrasing while remaining grammatical in the target language.",
  concise: "Make the subtitle concise and easy to read within a short on-screen duration. Remove verbal filler only when it does not change meaning.",
  education: "Prioritize terminology accuracy, conceptual consistency, and clear instructional wording.",
  business: "Use polished, professional, and appropriately formal wording for business content."
};

export type TranslateChunkInput = {
  targetLanguageCode: string;
  targetLanguageName: string;
  style: TranslationStyle;
  glossary?: string;
  contextBefore?: Array<{ id: number; text: string }>;
  cues: Array<{ id: number; text: string }>;
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
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text;
  }
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

export async function translateChunk(input: TranslateChunkInput): Promise<TranslationItem[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");

  const model = process.env.OPENAI_TRANSLATION_MODEL || "gpt-5.6-luna";
  const sourceIds = input.cues.map((cue) => cue.id);

  const instructions = [
    "You are a professional subtitle localizer.",
    `Translate ONLY the cues in the \"cues\" array into ${input.targetLanguageName} (${input.targetLanguageCode}).`,
    "contextBefore and contextAfter are reference context only. Never output them.",
    "Keep each cue aligned to the same ID. Never merge, split, add, remove, renumber, or reorder cue IDs.",
    "Return exactly one translated text for every input cue ID.",
    "Preserve names, brands, URLs, technical identifiers, numbers, and meaningful punctuation unless the target language has a well-established localized form.",
    "Preserve subtitle formatting tags such as <i>, <b>, and <u>, plus speaker/music markers when present; translate only the human-readable language inside them.",
    "Translate across cue boundaries with awareness of the surrounding sentence, but keep each returned cue semantically aligned to its source segment.",
    "Do not add explanations, translator notes, labels, markdown, or quotation marks around subtitle text.",
    "Keep line breaks only when useful. Prefer at most two subtitle lines.",
    STYLE_INSTRUCTIONS[input.style],
    input.glossary?.trim() ? `Glossary / terminology rules:\n${input.glossary.trim()}` : ""
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
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(55_000)
      });

      const payload = (await response.json()) as ResponsesPayload;
      if (!response.ok) {
        throw new OpenAIRequestError(
          payload.error?.message || `OpenAI API 오류 (${response.status})`,
          isRetryableStatus(response.status)
        );
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
