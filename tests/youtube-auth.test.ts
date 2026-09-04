import test from "node:test";
import assert from "node:assert/strict";
import {
  sealClientConfig,
  sealSession,
  unsealClientConfig,
  unsealSession,
  validateYouTubeClientConfig,
  youtubeRememberCookieOptions
} from "../lib/youtube-auth.ts";

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

test("사용자 Google OAuth Client Secret을 평문으로 노출하지 않고 암호화한다", () => {
  const original = {
    clientId: "123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
    clientSecret: "GOCSPX-example-user-secret",
    remember: true
  };
  const sealed = sealClientConfig(original, secret);
  assert.equal(sealed.includes(original.clientSecret), false);
  assert.deepEqual(unsealClientConfig(sealed, secret), original);
});

test("Google OAuth Client 입력을 최소 검증한다", () => {
  assert.throws(() => validateYouTubeClientConfig({ clientId: "short", clientSecret: "secret" }));
  assert.throws(() => validateYouTubeClientConfig({ clientId: "123456789012-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com", clientSecret: "x" }));
});

test("Google 연결 기억하기를 끄면 YouTube 쿠키는 세션 쿠키로 남는다", () => {
  assert.equal("maxAge" in youtubeRememberCookieOptions(false), false);
  assert.equal(youtubeRememberCookieOptions(true).maxAge, 30 * 24 * 60 * 60);
});

test("잘못된 비밀키로 OAuth 세션을 열 수 없다", () => {
  const sealed = sealSession({ accessToken: "x", expiresAt: 123 }, secret);
  assert.throws(() => unsealSession(sealed, "another-session-secret-that-is-long-enough-987654"));
});
