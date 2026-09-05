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

test("v1.6은 workspace와 연결 관리를 분리한다", () => {
  const workspace = read("app/page.tsx");
  const connections = read("app/connections/page.tsx");
  assert.match(workspace, /원본 자막/);
  assert.match(workspace, /href="\/connections"/);
  assert.equal(workspace.includes("USER-PAID API CONNECTIONS"), false);
  assert.match(connections, /내 OpenAI API Key/);
  assert.match(connections, /YouTube 연결/);
  assert.match(connections, /이 브라우저에 기억하기/);
  assert.equal(connections.includes("localStorage"), false);
  assert.equal(connections.includes("sessionStorage"), false);
});

test("필요 시점의 연결 게이트가 /connections로 이동한다", () => {
  const workspace = read("app/page.tsx");
  assert.match(workspace, /\/connections\?setup=openai&return=\//);
  assert.match(workspace, /\/connections\?setup=youtube&return=\//);
});

test("Google Cloud 설정은 4단계 단일-step wizard와 OAuth 분리를 제공한다", () => {
  const connections = read("app/connections/page.tsx");
  assert.match(connections, /single-step-wizard/);
  assert.match(connections, /wizardStep === 1/);
  assert.match(connections, /wizardStep === 2/);
  assert.match(connections, /wizardStep === 3/);
  assert.match(connections, /wizardStep === 4/);
  assert.match(connections, /Google Auth Platform/);
  assert.match(connections, /YouTube Data API v3/);
  assert.match(connections, /Google Cloud 설정 저장/);
  assert.match(connections, /Google로 YouTube 연결/);
});

test("OAuth 성공/오류 복귀 지점은 연결 관리 페이지다", () => {
  const start = read("app/api/youtube/oauth/start/route.ts");
  const callback = read("app/api/youtube/oauth/callback/route.ts");
  assert.match(start, /new URL\("\/connections"/);
  assert.match(callback, /new URL\("\/connections"/);
});

test("타임코드 수치 검증과 전체 시작-종료 표시는 workspace에 유지된다", () => {
  const workspace = read("app/page.tsx");
  assert.match(workspace, /타임코드<\/strong>.*timingMatches/);
  assert.match(workspace, /Cue ID<\/strong>.*cueIdMatches/);
  assert.match(workspace, /누락<\/strong>/);
  assert.match(workspace, /source\.start[\s\S]*source\.end/);
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

test("v1.6.2 YouTube wizard는 읽기 쉬운 본문과 큰 시각 예시를 유지한다", () => {
  const connections = read("app/connections/page.tsx");
  const css = read("app/globals.css");
  assert.match(connections, /className="wizard-lead"/);
  assert.match(css, /#youtube-connection \.wizard-lead[\s\S]*font-size: 16px/);
  assert.match(css, /#youtube-connection \.wizard-checklist[\s\S]*font-size: 16px/);
  assert.match(css, /#youtube-connection \.console-mini-screen[\s\S]*min-height: 164px/);
});

test("v1.6.2 wizard 비활성 CTA는 neutral이고 활성 CTA만 primary를 사용한다", () => {
  const css = read("app/globals.css");
  assert.match(css, /#youtube-connection \.wizard-nav \.primary-button:disabled[\s\S]*background: #f2f3f6/);
  assert.match(css, /\.primary-button \{ background: var\(--primary\)/);
});
