import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("v1.7 OpenAI 기억하기 토글은 기존 저장 키의 지속 쿠키 설정도 갱신한다", () => {
  const bridge = read("components/openai-remember-sync.tsx");
  const page = read("app/connections/page.tsx");
  assert.match(bridge, /\/api\/openai\/credential/);
  assert.match(bridge, /method: "PATCH"/);
  assert.match(bridge, /JSON\.stringify\(\{ remember: target\.checked \}\)/);
  assert.match(page, /OpenAiRememberSync/);
});
