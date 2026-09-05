import test from "node:test";
import assert from "node:assert/strict";
import {
  activeConnectionMeta,
  emptyConnectionRegistry,
  readStoredYouTubeSession,
  removeConnectionRegistry,
  sealClientConfig,
  sealConnectionRegistry,
  sealSession,
  selectConnectionRegistry,
  unsealClientConfig,
  unsealConnectionRegistry,
  unsealSession,
  upsertConnectionRegistry,
  validateYouTubeClientConfig,
  YOUTUBE_CONNECTIONS_COOKIE,
  YOUTUBE_SESSION_COOKIE,
  youtubeConnectionCookieName,
  youtubeRememberCookieOptions
} from "../lib/youtube-auth.ts";

const secret = "test-session-secret-that-is-long-enough-123456";

const connectionA = {
  connectionId: "11111111-1111-4111-8111-111111111111",
  channelId: "UCaaaaaaaaaaaaaaaaaaaaaa",
  channelTitle: "Channel A",
  connectedAt: 1000
};
const connectionB = {
  connectionId: "22222222-2222-4222-8222-222222222222",
  channelId: "UCbbbbbbbbbbbbbbbbbbbbbb",
  channelTitle: "Channel B",
  connectedAt: 2000
};

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

test("다중 YouTube 연결 registry를 암호화하고 활성 채널을 보존한다", () => {
  let registry = emptyConnectionRegistry();
  registry = upsertConnectionRegistry(registry, connectionA);
  registry = upsertConnectionRegistry(registry, connectionB);
  const sealed = sealConnectionRegistry(registry, secret);
  assert.equal(sealed.includes("Channel A"), false);
  const opened = unsealConnectionRegistry(sealed, secret);
  assert.equal(opened.connections.length, 2);
  assert.equal(activeConnectionMeta(opened)?.channelId, connectionB.channelId);
});

test("같은 channelId를 다시 연결하면 중복 대신 기존 connectionId를 갱신한다", () => {
  let registry = upsertConnectionRegistry(emptyConnectionRegistry(), connectionA);
  registry = upsertConnectionRegistry(registry, {
    ...connectionA,
    connectionId: "33333333-3333-4333-8333-333333333333",
    channelTitle: "Channel A renamed",
    connectedAt: 3000
  });
  assert.equal(registry.connections.length, 1);
  assert.equal(registry.connections[0]?.connectionId, connectionA.connectionId);
  assert.equal(registry.connections[0]?.channelTitle, "Channel A renamed");
});

test("활성 YouTube 채널을 선택하고 한 연결만 제거한다", () => {
  let registry = upsertConnectionRegistry(emptyConnectionRegistry(), connectionA);
  registry = upsertConnectionRegistry(registry, connectionB);
  registry = selectConnectionRegistry(registry, connectionA.connectionId);
  assert.equal(activeConnectionMeta(registry)?.channelId, connectionA.channelId);
  registry = removeConnectionRegistry(registry, connectionA.connectionId);
  assert.equal(registry.connections.length, 1);
  assert.equal(activeConnectionMeta(registry)?.channelId, connectionB.channelId);
});

test("다중 연결 cookie에서는 활성 채널의 세션만 읽는다", () => {
  let registry = upsertConnectionRegistry(emptyConnectionRegistry(), connectionA);
  registry = upsertConnectionRegistry(registry, connectionB);
  const sessionA = sealSession({ accessToken: "token-a", expiresAt: 111 }, secret);
  const sessionB = sealSession({ accessToken: "token-b", expiresAt: 222 }, secret);
  const values = new Map([
    [YOUTUBE_CONNECTIONS_COOKIE, sealConnectionRegistry(registry, secret)],
    [youtubeConnectionCookieName(connectionA.connectionId), sessionA],
    [youtubeConnectionCookieName(connectionB.connectionId), sessionB]
  ]);
  const stored = readStoredYouTubeSession({ get: (name) => values.has(name) ? { value: values.get(name)! } : undefined }, secret);
  assert.equal(stored.session.accessToken, "token-b");
  assert.equal(stored.connection?.channelId, connectionB.channelId);
  assert.equal(stored.legacy, false);
});

test("v1.6 단일 세션 cookie는 마이그레이션 전에도 legacy fallback으로 읽힌다", () => {
  const legacy = sealSession({ accessToken: "legacy-token", expiresAt: 333 }, secret);
  const values = new Map([[YOUTUBE_SESSION_COOKIE, legacy]]);
  const stored = readStoredYouTubeSession({ get: (name) => values.has(name) ? { value: values.get(name)! } : undefined }, secret);
  assert.equal(stored.session.accessToken, "legacy-token");
  assert.equal(stored.legacy, true);
});
