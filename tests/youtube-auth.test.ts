import test from "node:test";
import assert from "node:assert/strict";
import { sealSession, unsealSession } from "../lib/youtube-auth.ts";

const secret = "test-session-secret-that-is-long-enough-123456";

test("YouTube OAuth 세션을 암호화하고 복호화한다", () => {
  const original = {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: 1234567890,
    scope: "youtube.force-ssl"
  };
  const sealed = sealSession(original, secret);
  assert.ok(!sealed.includes("access-token"));
  assert.deepEqual(unsealSession(sealed, secret), original);
});

test("잘못된 비밀키로 OAuth 세션을 열 수 없다", () => {
  const sealed = sealSession({ accessToken: "x", expiresAt: 123 }, secret);
  assert.throws(() => unsealSession(sealed, "another-session-secret-that-is-long-enough-987654"));
});
