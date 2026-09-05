import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

function read(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

test("배포 env 예시는 운영자 유료 API 자격 증명을 요구하지 않는다", () => {
  const env = read(".env.example");
  assert.equal(/^OPENAI_API_KEY=/m.test(env), false);
  assert.equal(/^SUBTITLE_APP_ACCESS_KEY=/m.test(env), false);
  assert.equal(/^GOOGLE_CLIENT_ID=/m.test(env), false);
  assert.equal(/^GOOGLE_CLIENT_SECRET=/m.test(env), false);
  assert.match(env, /^APP_SESSION_SECRET=/m);
});

test("번역 API는 사용자 OpenAI 자격 증명 쿠키를 서버에서 복호화한다", () => {
  const route = read("app/api/translate/route.ts");
  assert.match(route, /OPENAI_CREDENTIAL_COOKIE/);
  assert.match(route, /unsealOpenAiCredential/);
  assert.equal(route.includes("process.env.OPENAI_API_KEY"), false);
  assert.equal(route.includes("x-openai-api-key"), false);
});

test("UI에는 기억하기가 있지만 localStorage/sessionStorage에 API 키를 저장하지 않는다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /이 브라우저에 기억하기/);
  assert.match(page, /내 YouTube API 프로젝트/);
  assert.match(page, /Google OAuth Client Secret/);
  assert.equal(page.includes("localStorage"), false);
  assert.equal(page.includes("sessionStorage"), false);
  assert.equal(page.includes("SUBTITLE_APP_ACCESS_KEY"), false);
});


test("보안 헤더와 비밀 상태 응답의 no-store 정책을 유지한다", () => {
  const config = read("next.config.ts");
  assert.match(config, /X-Content-Type-Options/);
  assert.match(config, /X-Frame-Options/);
  assert.match(config, /Referrer-Policy/);
  const openAiRoute = read("app/api/openai/credential/route.ts");
  const youtubeStatus = read("app/api/youtube/status/route.ts");
  assert.match(openAiRoute, /Cache-Control/);
  assert.match(openAiRoute, /no-store/);
  assert.match(youtubeStatus, /Cache-Control/);
  assert.match(youtubeStatus, /no-store/);
});


test("v1.5 UI는 타임코드 수치 검증과 Google OAuth 분리 흐름을 노출한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /타임코드<\/strong>.*timingMatches/);
  assert.match(page, /Cue ID<\/strong>.*cueIdMatches/);
  assert.match(page, /누락<\/strong>/);
  assert.match(page, /Google Cloud 설정 저장/);
  assert.match(page, /Google로 YouTube 연결/);
  assert.match(page, /Google Auth Platform/);
  assert.match(page, /YouTube Data API v3/);
});
