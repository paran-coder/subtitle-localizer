import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("v1.7 연결 화면은 8단계 초보자 마법사와 필수 고정값을 제공한다", () => {
  const page = read("components/connections-v17.tsx");
  assert.match(page, /STEP_TITLES/);
  assert.equal((page.match(/"전용 프로젝트 만들기"|"YouTube API 켜기"|"앱 기본 정보와 공개 링크"|"추가 계정을 위한 상태 설정"|"YouTube 권한 추가"|"OAuth Client 만들기"|"Client 정보 저장"|"첫 YouTube 채널 연결"/g) ?? []).length, 8);
  assert.match(page, /Subtitle Localizer Web/);
  assert.match(page, /youtube\.force-ssl/);
  assert.match(page, /승인된 JavaScript 원본/);
  assert.match(page, /비워두세요/);
  assert.match(page, /승인된 리디렉션 URI/);
  assert.match(page, /In Production/);
  assert.match(page, /Testing으로 계속 사용하려면/);
});

test("Branding 단계는 Google 앱 도메인에 넣을 공개 URL 3개를 제공한다", () => {
  const page = read("components/connections-v17.tsx");
  assert.match(page, /https:\/\/subtitle-localizer\.vercel\.app\//);
  assert.match(page, /https:\/\/subtitle-localizer\.vercel\.app\/privacy/);
  assert.match(page, /https:\/\/subtitle-localizer\.vercel\.app\/terms/);
  assert.match(page, /애플리케이션 홈페이지/);
  assert.match(page, /개인정보처리방침/);
  assert.match(page, /서비스 약관/);
  assert.match(page, /403 access_denied/);
});

test("Client 저장과 Google Publishing 완료 상태를 분리해 안내한다", () => {
  const page = read("components/connections-v17.tsx");
  assert.match(page, /setWizardStep\(8\)/);
  assert.match(page, /setShowFinalWizardStep\(true\)/);
  assert.match(page, /youtubeStatus === "disconnected" && !showFinalWizardStep/);
  assert.match(page, /Google로 첫 YouTube 채널 연결/);
  assert.match(page, /Cloud Client는 저장되어 있습니다/);
  assert.match(page, /실제 게시 상태까지 자동 판별하지는 못합니다/);
  assert.equal(page.includes("Google Cloud 설정은 끝났습니다."), false);
});

test("연결 완료 화면은 Publishing 확인과 여러 채널 누적 관리를 함께 제공한다", () => {
  const page = read("components/connections-v17.tsx");
  assert.match(page, /v17-channel-manager/);
  assert.match(page, /\+ 계정 또는 채널 추가/);
  assert.match(page, /channelThumbnail/);
  assert.match(page, /\/api\/youtube\/channels/);
  assert.match(page, /method: "PATCH"/);
  assert.match(page, /method: "DELETE"/);
  assert.match(page, /Google Cloud Client · 저장됨/);
  assert.match(page, /Branding 확인/);
  assert.match(page, /Audience \/ 게시 상태 확인/);
});

test("공개 가이드·개인정보처리방침·서비스 약관을 사이트에서 찾을 수 있다", () => {
  const layout = read("app/layout.tsx");
  const footer = read("components/site-policy-footer.tsx");
  const guideEntry = read("components/first-use-guide-link.tsx");
  const privacy = read("app/privacy/page.tsx");
  const terms = read("app/terms/page.tsx");
  assert.match(layout, /FirstUseGuideLink/);
  assert.match(layout, /SitePolicyFooter/);
  assert.match(footer, /href="\/guide"/);
  assert.match(footer, /href="\/privacy"/);
  assert.match(footer, /href="\/terms"/);
  assert.match(guideEntry, /처음 사용 가이드/);
  assert.match(privacy, /개인정보처리방침/);
  assert.match(privacy, /HttpOnly cookie/);
  assert.match(privacy, /OpenAI/);
  assert.match(privacy, /Google \/ YouTube/);
  assert.match(terms, /서비스 약관/);
  assert.match(terms, /BYOK\/BYOC/);
  assert.match(terms, /OpenAI API 사용료/);
  assert.match(terms, /YouTube Data API quota/);
});

test("첫 사용자 가이드는 OpenAI와 YouTube 연결을 실제 값 기준으로 안내한다", () => {
  const guide = read("app/guide/page.tsx");
  assert.match(guide, /OpenAI API Keys 열기/);
  assert.match(guide, /ChatGPT 구독과 OpenAI API 결제는 별도/);
  assert.match(guide, /Create new secret key/);
  assert.match(guide, /HttpOnly cookie/);
  assert.match(guide, /YouTube Data API v3/);
  assert.match(guide, /Subtitle Localizer Web/);
  assert.match(guide, /youtube\.force-ssl/);
  assert.match(guide, /Authorized JavaScript origins/);
  assert.match(guide, /Authorized redirect URIs/);
  assert.match(guide, /api\/youtube\/oauth\/callback/);
  assert.match(guide, /403 access_denied/);
  assert.match(guide, /In Production/);
  assert.match(guide, /확인되지 않은 앱/);
});

test("workspace 채널 바는 썸네일·채널 선택·빈 영상 행동을 제공한다", () => {
  const bar = read("components/workspace-channel-bar.tsx");
  assert.match(bar, /현재 YouTube 작업 채널/);
  assert.match(bar, /channelThumbnail/);
  assert.match(bar, /\/api\/youtube\/channels/);
  assert.match(bar, /window\.location\.reload\(\)/);
  assert.match(bar, /이 채널에는 업로드된 영상이 없습니다/);
  assert.match(bar, /YouTube Studio 열기/);
  assert.match(bar, /다시 불러오기/);
  assert.match(bar, /v1\.7\.0/);
});

test("v1.7 UI·가이드·공개 정책 페이지는 모바일 재배치와 focus-visible/reduced-motion을 유지한다", () => {
  const css = read("app/v17.css");
  const legalCss = read("app/legal.css");
  const guideCss = read("app/guide.css");
  const guideEntryCss = read("app/first-use-guide.css");
  assert.match(css, /grid-template-columns:repeat\(8/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.v17-do-dont\{grid-template-columns:1fr\}/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(legalCss, /@media\(max-width:760px\)/);
  assert.match(legalCss, /focus-visible/);
  assert.match(legalCss, /prefers-reduced-motion/);
  assert.match(guideCss, /@media\(max-width:760px\)/);
  assert.match(guideCss, /focus-visible/);
  assert.match(guideCss, /prefers-reduced-motion/);
  assert.match(guideEntryCss, /@media\(max-width:760px\)/);
  assert.match(guideEntryCss, /focus-visible/);
});
