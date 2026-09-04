import test from "node:test";
import assert from "node:assert/strict";
import { validateTranslationItems } from "../lib/translation.ts";

const source = [
  { id: 10, text: "Hello" },
  { id: 11, text: "World" }
];

test("구조화 번역 응답을 원본 id 순서로 정렬한다", () => {
  const result = validateTranslationItems(source, {
    items: [
      { id: 11, text: "세계" },
      { id: 10, text: "안녕하세요" }
    ]
  });
  assert.deepEqual(result, [
    { id: 10, text: "안녕하세요" },
    { id: 11, text: "세계" }
  ]);
});

test("누락 id를 거부한다", () => {
  assert.throws(() => validateTranslationItems(source, { items: [{ id: 10, text: "안녕하세요" }] }));
});

test("중복 id를 거부한다", () => {
  assert.throws(() => validateTranslationItems(source, {
    items: [
      { id: 10, text: "안녕하세요" },
      { id: 10, text: "다시" }
    ]
  }));
});

test("빈 번역 텍스트를 거부한다", () => {
  assert.throws(() => validateTranslationItems(source, {
    items: [
      { id: 10, text: "안녕하세요" },
      { id: 11, text: "   " }
    ]
  }));
});
