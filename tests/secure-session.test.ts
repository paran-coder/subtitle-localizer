import test from "node:test";
import assert from "node:assert/strict";
import { sealOpenAiCredential, unsealOpenAiCredential } from "../lib/openai-credential.ts";
import { rememberedCookieOptions } from "../lib/secure-session.ts";

const secret = "test-app-session-secret-that-is-long-enough-123456";

test("사용자 OpenAI API Key를 평문으로 노출하지 않고 암호화한다", () => {
  const original = { apiKey: "user-owned-openai-key", remember: true };
  const sealed = sealOpenAiCredential(original, secret);
  assert.equal(sealed.includes(original.apiKey), false);
  assert.deepEqual(unsealOpenAiCredential(sealed, secret), original);
});

test("기억하기를 끄면 세션 쿠키, 켜면 지속 쿠키를 사용한다", () => {
  assert.equal("maxAge" in rememberedCookieOptions(false), false);
  assert.equal(rememberedCookieOptions(true).maxAge, 30 * 24 * 60 * 60);
});
