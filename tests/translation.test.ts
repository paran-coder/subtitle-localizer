import test from "node:test";
import assert from "node:assert/strict";
import { translateChunk, validateTranslationItems } from "../lib/translation.ts";

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


test("translateChunk는 호출자가 전달한 사용자 API Key를 Authorization에 사용한다", async () => {
  const originalFetch = globalThis.fetch;
  let authorization = "";
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    authorization = new Headers(init?.headers).get("Authorization") ?? "";
    return new Response(JSON.stringify({ output_text: JSON.stringify({ items: [{ id: 10, text: "안녕하세요" }] }) }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }) as typeof fetch;
  try {
    const result = await translateChunk({
      targetLanguageCode: "ko",
      targetLanguageName: "Korean",
      style: "natural",
      cues: [{ id: 10, text: "Hello", durationMs: 1000 }]
    }, "user-owned-key");
    assert.equal(authorization, "Bearer user-owned-key");
    assert.deepEqual(result, [{ id: 10, text: "안녕하세요" }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
