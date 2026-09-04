import type { SubtitleCue } from "./types";

const TIMECODE_PATTERN = /^(\d{2,}):([0-5]\d):([0-5]\d),(\d{3})$/;
const RANGE_PATTERN = /^(\d{2,}:[0-5]\d:[0-5]\d,\d{3})\s+-->\s+(\d{2,}:[0-5]\d:[0-5]\d,\d{3})(?:\s+.*)?$/;

export const MAX_TRANSLATABLE_CUE_CHARS = 2_000;
export const DEFAULT_CHUNK_OPTIONS = {
  maxCues: 48,
  maxChars: 12_000
} as const;

export class SrtParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SrtParseError";
  }
}

export function normalizeSrtInput(input: string): string {
  return input.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
}

export function timecodeToMs(timecode: string): number {
  const match = timecode.match(TIMECODE_PATTERN);
  if (!match) throw new SrtParseError(`잘못된 타임코드입니다: ${timecode}`);
  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000 +
    Number(milliseconds)
  );
}

export function parseSrt(input: string): SubtitleCue[] {
  const normalized = normalizeSrtInput(input);
  if (!normalized) throw new SrtParseError("SRT 파일이 비어 있습니다.");

  const blocks = normalized.split(/\n{2,}/);
  const cues: SubtitleCue[] = [];
  const seenIds = new Set<number>();

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const lines = blocks[blockIndex].split("\n");
    if (lines.length < 3) {
      throw new SrtParseError(`${blockIndex + 1}번째 자막 블록의 형식이 올바르지 않습니다.`);
    }

    const id = Number(lines[0].trim());
    if (!Number.isInteger(id) || id < 0) {
      throw new SrtParseError(`${blockIndex + 1}번째 자막 번호가 올바르지 않습니다.`);
    }
    if (seenIds.has(id)) {
      throw new SrtParseError(`중복된 자막 번호가 있습니다: ${id}`);
    }

    const rangeMatch = lines[1].trim().match(RANGE_PATTERN);
    if (!rangeMatch) {
      throw new SrtParseError(`${id}번 자막의 시간 형식이 올바르지 않습니다.`);
    }

    const start = rangeMatch[1];
    const end = rangeMatch[2];
    if (timecodeToMs(end) <= timecodeToMs(start)) {
      throw new SrtParseError(`${id}번 자막의 종료 시간이 시작 시간보다 늦어야 합니다.`);
    }

    const text = lines.slice(2).join("\n").trim();
    if (!text) throw new SrtParseError(`${id}번 자막의 텍스트가 비어 있습니다.`);

    seenIds.add(id);
    cues.push({ id, start, end, text });
  }

  if (cues.length === 0) throw new SrtParseError("유효한 자막을 찾지 못했습니다.");
  return cues;
}

export function serializeSrt(cues: SubtitleCue[]): string {
  return `${cues
    .map((cue) => `${cue.id}\n${cue.start} --> ${cue.end}\n${cue.text.trim()}`)
    .join("\n\n")}\n`;
}

export function durationMs(cues: SubtitleCue[]): number {
  if (!cues.length) return 0;
  return Math.max(...cues.map((cue) => timecodeToMs(cue.end)));
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export function chunkCues<T>(items: T[], chunkSize = 32): T[][] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("chunkSize는 1 이상의 정수여야 합니다.");
  }
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function chunkSubtitleCues(
  cues: SubtitleCue[],
  options: { maxCues?: number; maxChars?: number } = {}
): SubtitleCue[][] {
  const maxCues = options.maxCues ?? DEFAULT_CHUNK_OPTIONS.maxCues;
  const maxChars = options.maxChars ?? DEFAULT_CHUNK_OPTIONS.maxChars;

  if (!Number.isInteger(maxCues) || maxCues <= 0) throw new Error("maxCues는 1 이상의 정수여야 합니다.");
  if (!Number.isInteger(maxChars) || maxChars <= 0) throw new Error("maxChars는 1 이상의 정수여야 합니다.");

  const chunks: SubtitleCue[][] = [];
  let current: SubtitleCue[] = [];
  let currentChars = 0;

  for (const cue of cues) {
    // JSON/id 구분자 등의 작은 오버헤드를 보수적으로 포함합니다.
    const estimatedChars = cue.text.length + 24;
    const wouldOverflow =
      current.length > 0 && (current.length >= maxCues || currentChars + estimatedChars > maxChars);

    if (wouldOverflow) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }

    current.push(cue);
    currentChars += estimatedChars;
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

export function replaceCueTexts(
  original: SubtitleCue[],
  translations: Array<{ id: number; text: string }>
): SubtitleCue[] {
  const translationMap = new Map(translations.map((item) => [item.id, item.text]));
  if (translationMap.size !== translations.length) {
    throw new Error("번역 결과에 중복된 자막 번호가 있습니다.");
  }

  return original.map((cue) => {
    const translatedText = translationMap.get(cue.id);
    if (typeof translatedText !== "string" || !translatedText.trim()) {
      throw new Error(`${cue.id}번 자막의 번역 결과가 없습니다.`);
    }
    return { ...cue, text: translatedText.trim() };
  });
}

export type CueQuality = {
  id: number;
  cps: number;
  maxLineLength: number;
  warnings: string[];
};

export function analyzeCueQuality(cue: SubtitleCue): CueQuality {
  const durationSeconds = Math.max((timecodeToMs(cue.end) - timecodeToMs(cue.start)) / 1000, 0.001);
  const textWithoutBreaks = cue.text.replace(/\s+/g, " ").trim();
  const cps = textWithoutBreaks.length / durationSeconds;
  const maxLineLength = Math.max(...cue.text.split("\n").map((line) => line.length));
  const warnings: string[] = [];
  if (cps > 22) warnings.push("읽기 속도가 빠를 수 있습니다.");
  if (maxLineLength > 48) warnings.push("한 줄이 길 수 있습니다.");
  if (cue.text.split("\n").length > 2) warnings.push("자막이 3줄 이상입니다.");
  return { id: cue.id, cps, maxLineLength, warnings };
}

export function hasPreservedTiming(original: SubtitleCue[], translated: SubtitleCue[]): boolean {
  return (
    original.length === translated.length &&
    original.every((cue, index) => {
      const target = translated[index];
      return target?.id === cue.id && target.start === cue.start && target.end === cue.end;
    })
  );
}
