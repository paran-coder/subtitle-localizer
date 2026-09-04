import test from "node:test";
import assert from "node:assert/strict";
import {
  chunkCues,
  normalizeSrtInput,
  parseSrt,
  replaceCueTexts,
  serializeSrt,
  timecodeToMs
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
