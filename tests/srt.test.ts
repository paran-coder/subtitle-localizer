import test from "node:test";
import assert from "node:assert/strict";
import {
  chunkCues,
  chunkSubtitleCues,
  hasPreservedTiming,
  normalizeSrtInput,
  parseSrt,
  replaceCueTexts,
  serializeSrt,
  timecodeToMs,
  validateSubtitleStructure
} from "../lib/srt.ts";

const sample = `\uFEFF1\r\n00:00:01,200 --> 00:00:04,500\r\nWelcome back\r\n\r\n2\r\n00:00:04,800 --> 00:00:08,100\r\nToday we're going\r\nto talk about AI.\r\n`;

test("BOM과 CRLF를 정규화한다", () => {
  const normalized = normalizeSrtInput(sample);
  assert.ok(!normalized.startsWith("\uFEFF"));
  assert.ok(!normalized.includes("\r"));
});

test("SRT를 파싱하고 multiline cue를 보존한다", () => {
  const cues = parseSrt(sample);
  assert.equal(cues.length, 2);
  assert.equal(cues[0].id, 1);
  assert.equal(cues[1].text, "Today we're going\nto talk about AI.");
});

test("직렬화 후 다시 파싱할 수 있다", () => {
  const cues = parseSrt(sample);
  const serialized = serializeSrt(cues);
  assert.deepEqual(parseSrt(serialized), cues);
});

test("종료 시간이 시작 시간보다 빠르면 거부한다", () => {
  assert.throws(() => parseSrt(`1\n00:00:05,000 --> 00:00:04,000\nBad timing`));
});

test("중복 cue id를 거부한다", () => {
  assert.throws(() => parseSrt(`1\n00:00:01,000 --> 00:00:02,000\nA\n\n1\n00:00:02,000 --> 00:00:03,000\nB`));
});

test("타임코드를 밀리초로 변환한다", () => {
  assert.equal(timecodeToMs("01:02:03,456"), 3_723_456);
});

test("cue를 지정 크기로 나눈다", () => {
  assert.deepEqual(chunkCues([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test("번역 텍스트만 주입하고 타임코드는 보존한다", () => {
  const original = parseSrt(sample);
  const translated = replaceCueTexts(original, [
    { id: 1, text: "다시 오신 것을 환영합니다" },
    { id: 2, text: "오늘은 AI에 대해 이야기합니다" }
  ]);
  assert.equal(translated[0].start, original[0].start);
  assert.equal(translated[1].end, original[1].end);
  assert.equal(translated[0].text, "다시 오신 것을 환영합니다");
});

test("번역 id가 누락되면 실패한다", () => {
  const original = parseSrt(sample);
  assert.throws(() => replaceCueTexts(original, [{ id: 1, text: "번역" }]));
});


test("동적 청크는 cue 수 제한을 지킨다", () => {
  const cues = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    start: `00:00:${String(index % 60).padStart(2, "0")},000`,
    end: `00:00:${String(index % 60).padStart(2, "0")},500`,
    text: "short subtitle"
  }));
  const chunks = chunkSubtitleCues(cues, { maxCues: 48, maxChars: 12_000 });
  assert.deepEqual(chunks.map((chunk) => chunk.length), [48, 48, 4]);
});

test("동적 청크는 텍스트 예산을 넘기기 전에 분할한다", () => {
  const cues = [
    { id: 1, start: "00:00:01,000", end: "00:00:02,000", text: "a".repeat(70) },
    { id: 2, start: "00:00:02,000", end: "00:00:03,000", text: "b".repeat(70) },
    { id: 3, start: "00:00:03,000", end: "00:00:04,000", text: "c".repeat(70) }
  ];
  const chunks = chunkSubtitleCues(cues, { maxCues: 48, maxChars: 150 });
  assert.deepEqual(chunks.map((chunk) => chunk.map((cue) => cue.id)), [[1], [2], [3]]);
});

test("번역 결과의 id/start/end 보존 여부를 검증한다", () => {
  const original = parseSrt(sample);
  const translated = replaceCueTexts(original, [
    { id: 1, text: "환영합니다" },
    { id: 2, text: "AI를 이야기합니다" }
  ]);
  assert.equal(hasPreservedTiming(original, translated), true);
  assert.equal(hasPreservedTiming(original, [{ ...translated[0], start: "00:00:00,000" }, translated[1]]), false);
});



test("구조 검증은 완전 일치 상태를 수치로 반환한다", () => {
  const original = parseSrt(sample);
  const translated = replaceCueTexts(original, [
    { id: 1, text: "환영합니다" },
    { id: 2, text: "AI를 이야기합니다" }
  ]);
  const result = validateSubtitleStructure(original, translated);
  assert.equal(result.preserved, true);
  assert.equal(result.cueIdMatches, 2);
  assert.equal(result.timingMatches, 2);
  assert.deepEqual(result.missingCueIds, []);
  assert.deepEqual(result.unexpectedCueIds, []);
});

test("구조 검증은 누락 cue를 찾는다", () => {
  const original = parseSrt(sample);
  const translated = [{ ...original[0], text: "환영합니다" }];
  const result = validateSubtitleStructure(original, translated);
  assert.equal(result.preserved, false);
  assert.equal(result.cueIdMatches, 1);
  assert.deepEqual(result.missingCueIds, [2]);
});

test("구조 검증은 예상하지 않은 cue를 찾는다", () => {
  const original = parseSrt(sample);
  const translated = [
    ...original.map((cue) => ({ ...cue, text: "번역" })),
    { id: 99, start: "00:00:09,000", end: "00:00:10,000", text: "추가" }
  ];
  const result = validateSubtitleStructure(original, translated);
  assert.equal(result.preserved, false);
  assert.deepEqual(result.unexpectedCueIds, [99]);
});

test("구조 검증은 ID 순서 불일치를 찾는다", () => {
  const original = parseSrt(sample);
  const translated = [
    { ...original[1], text: "두 번째" },
    { ...original[0], text: "첫 번째" }
  ];
  const result = validateSubtitleStructure(original, translated);
  assert.equal(result.cueIdMatches, 2);
  assert.equal(result.orderMismatchCount, 2);
  assert.equal(result.preserved, false);
});

test("구조 검증은 타임코드 불일치 cue를 찾는다", () => {
  const original = parseSrt(sample);
  const translated = original.map((cue) => ({ ...cue, text: "번역" }));
  translated[1] = { ...translated[1], end: "00:00:08,200" };
  const result = validateSubtitleStructure(original, translated);
  assert.equal(result.timingMatches, 1);
  assert.deepEqual(result.timingMismatchIds, [2]);
  assert.equal(result.preserved, false);
});

test("5,000 cue 장문 SRT를 파싱하고 제한된 청크로 분할한다", () => {
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    const seconds = Math.floor((ms % 60_000) / 1_000);
    const millis = ms % 1_000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
  };
  const longSrt = Array.from({ length: 5_000 }, (_, index) => {
    const start = index * 1_000;
    return `${index + 1}\n${formatTime(start)} --> ${formatTime(start + 800)}\nSubtitle line ${index + 1}`;
  }).join("\n\n");

  const parsed = parseSrt(longSrt);
  const chunks = chunkSubtitleCues(parsed);
  assert.equal(parsed.length, 5_000);
  assert.ok(chunks.every((chunk) => chunk.length <= 48));
  assert.equal(chunks.flat().length, 5_000);
});

test("SRT의 기본 서식 태그를 텍스트 일부로 보존한다", () => {
  const tagged = `1\n00:00:01,000 --> 00:00:02,000\n<i>Hello</i>`;
  const parsed = parseSrt(tagged);
  assert.equal(parsed[0].text, "<i>Hello</i>");
  assert.ok(serializeSrt(parsed).includes("<i>Hello</i>"));
});

import { analyzeLocalizedCueQuality } from "../lib/srt.ts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const testDir = dirname(fileURLToPath(import.meta.url));

test("KO/JA/ES 품질 기준 샘플은 원본 타임코드를 그대로 보존한다", () => {
  const source = parseSrt(readFileSync(join(testDir, "../samples/demo-en.srt"), "utf8"));
  for (const suffix of ["ko", "ja", "es"]) {
    const translated = parseSrt(readFileSync(join(testDir, `../samples/demo-${suffix}.srt`), "utf8"));
    assert.equal(hasPreservedTiming(source, translated), true);
  }
});

test("CJK 자막은 더 짧은 줄 길이 기준으로 QA한다", () => {
  const cue = { id: 1, start: "00:00:00,000", end: "00:00:02,000", text: "가".repeat(35) };
  assert.ok(analyzeLocalizedCueQuality(cue, "ko").warnings.includes("한 줄이 길 수 있습니다."));
});

test("현지화 도전 샘플은 30개 cue와 핵심 테스트 문구를 포함한다", () => {
  const challenge = readFileSync(join(testDir, "../samples/localization-challenge-en.srt"), "utf8");
  const parsed = parseSrt(challenge);
  assert.equal(parsed.length, 30);
  assert.ok(parsed.some((cue) => cue.text.includes("break a leg")));
  assert.ok(parsed.some((cue) => cue.text.includes("12,480")));
  assert.ok(parsed.some((cue) => cue.text.includes("ChatGPT")));
  assert.equal(serializeSrt(parsed).includes("00:01:20,800 --> 00:01:23,000"), true);
});
