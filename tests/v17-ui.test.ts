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

test("주요 화면은 초기 설정·연결 관리·작업하기 탭으로 구분한다", () => {
  const layout = read("app/layout.tsx");
  const footer = read("components/site-policy-footer.tsx");
  const nav = read("components/first-use-guide-link.tsx");
  const privacy = read("app/privacy/page.tsx");
  const terms = read("app/terms/page.tsx");
  assert.match(layout, /PrimarySectionNav/);
  assert.match(layout, /SitePolicyFooter/);
  assert.match(nav, /초기 설정/);
  assert.match(nav, /연결 관리/);
  assert.match(nav, /작업하기/);
  assert.match(nav, /href: "\/guide"/);
  assert.match(nav, /href: "\/connections"/);
  assert.match(nav, /href: "\/"/);
  assert.match(nav, /aria-current/);
  assert.match(nav, /v1\.7\.0/);
  assert.equal(nav.includes('className="primary-titlebar-action"'), false);
  assert.equal(nav.includes("처음 사용하시나요?"), false);
  assert.equal(nav.includes("설정이 낯설다면"), false);
  assert.match(footer, /href="\/guide">초기 설정/);
  assert.match(footer, /href="\/privacy"/);
  assert.match(footer, /href="\/terms"/);
  assert.match(privacy, /개인정보처리방침/);
  assert.match(privacy, /HttpOnly cookie/);
  assert.match(privacy, /OpenAI/);
  assert.match(privacy, /Google \/ YouTube/);
  assert.match(terms, /서비스 약관/);
  assert.match(terms, /BYOK\/BYOC/);
  assert.match(terms, /OpenAI API 사용료/);
  assert.match(terms, /YouTube Data API quota/);
});

test("공통 상단 계층은 타이틀바·탭·작업 채널 순서를 유지한다", () => {
  const layout = read("app/layout.tsx");
  const nav = read("components/first-use-guide-link.tsx");
  const css = read("app/first-use-guide.css");
  const primaryIndex = layout.indexOf("<PrimarySectionNav />");
  const channelIndex = layout.indexOf("<WorkspaceChannelBar />");
  assert.ok(primaryIndex >= 0 && channelIndex > primaryIndex);
  assert.match(nav, /primary-titlebar/);
  assert.match(nav, /Subtitle Localizer/);
  assert.match(nav, /OpenAI/);
  assert.match(nav, /YouTube/);
  assert.match(nav, /primary-section-nav/);
  assert.match(css, /\.primary-titlebar/);
  assert.match(css, /\.app-shell>\.topbar/);
  assert.match(css, /\.v17-connections-shell>\.v17-topbar/);
  assert.match(css, /\.guide-shell>\.guide-topbar/);
  assert.match(css, /margin:18px auto 0/);
});

test("초기 설정 화면은 OpenAI와 YouTube 연결을 실제 값 기준으로 안내한다", () => {
  const guide = read("app/guide/page.tsx");
  assert.match(guide, /OpenAI API Keys 열기/);
  assert.match(guide, /OpenAI API Billing/);
  assert.match(guide, /결제 수단/);
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
  assert.match(guide, /Google 카드 등록은 이 8단계의 필수 항목이 아닙니다/);
  assert.match(guide, /guide-static-code/);
  assert.match(guide, /FIRST-TIME SETUP/);
  assert.equal(guide.includes("FIRST-TIME SETUP · v1.7.0"), false);
  assert.equal(guide.includes("앱의 8단계 마법사와 함께 진행 →"), false);
  assert.equal(guide.includes("연결 관리 7단계로 이동 →"), false);
});

test("작업 화면은 SRT 파일명 기반 트랙 이름·YouTube quota·단일 페이지 스크롤을 유지한다", () => {
  const page = read("app/page.tsx");
  const polish = read("app/ui-polish-v17.css");
  assert.match(page, /function defaultTrackName\(filename: string\)/);
  assert.match(page, /setTrackName\(defaultTrackName\(filename\)\)/);
  assert.match(page, /setTrackName\(sourceFileName \? defaultTrackName\(sourceFileName\) : ""\)/);
  assert.match(page, /placeholder="SRT 파일을 불러오면 파일명이 자동으로 입력됩니다"/);
  assert.match(page, /기본 quota · 10,000 units \/ 일/);
  assert.match(page, /PT 자정에 초기화/);
  assert.match(page, /quota 확장 심사/);
  assert.match(page, /trackName: trackName\.trim\(\) \|\| defaultTrackName\(sourceFileName\) \|\| "Subtitle Localizer"/);
  assert.match(polish, /\.guide-static-code/);
  assert.match(polish, /text-decoration: none/);
  assert.match(polish, /\.v17-connections-hero > span/);
  assert.match(polish, /color: var\(--primary, #ff6f0f\)/);
  assert.match(polish, /\.side-column \{[\s\S]*position: static;[\s\S]*max-height: none;[\s\S]*overflow: visible;/);
  assert.equal(/overflow-y:\s*auto/.test(polish), false);
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
  assert.equal(bar.includes("v17-workspace-version"), false);
});

test("v1.7 UI·초기 설정·공개 정책 페이지는 모바일 재배치와 focus-visible/reduced-motion을 유지한다", () => {
  const css = read("app/v17.css");
  const legalCss = read("app/legal.css");
  const guideCss = read("app/guide.css");
  const navCss = read("app/first-use-guide.css");
  assert.match(css, /grid-template-columns:repeat\(8/);
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /\.v17-do-dont\{grid-template-columns:1fr\}/);
  assert.match(css, /focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(legalCss, /@media\(max-width:760px\)/);
  assert.match(legalCss, /focus-visible/);
  assert.match(legalCss, /prefers-reduced-motion/);
  assert.match(guideCss, /@media\(max-width:760px\)/);
  assert.match(guideCss, /\.guide-ready-card p\{[^}]*white-space:nowrap/);
  assert.match(guideCss, /\.guide-ready-card p\{white-space:normal\}/);
  assert.match(guideCss, /focus-visible/);
  assert.match(guideCss, /prefers-reduced-motion/);
  assert.match(navCss, /@media\(max-width:760px\)/);
  assert.match(navCss, /focus-visible/);
  assert.match(navCss, /prefers-reduced-motion/);
  assert.match(navCss, /\.primary-section-nav/);
});

test("작업 화면은 영어·러시아어를 추천 언어에 포함하고 원본 YouTube 자막을 영어 우선으로 고정하지 않는다", () => {
  const page = read("app/page.tsx");
  const languages = read("lib/languages.ts");
  assert.match(page, /POPULAR_LANGUAGE_CODES = \["en", "ko", "ja", "es", "fr", "de", "ru"/);
  assert.match(page, /추천 10개/);
  assert.equal(page.includes("aEnglish"), false);
  assert.equal(page.includes("bEnglish"), false);
  assert.match(languages, /code: "en"/);
  assert.match(languages, /code: "ru"/);
  assert.match(languages, /Русский/);
});

test("사용자는 현재 번역 언어 조합을 브라우저 기본값으로 저장하고 제품 기본값으로 되돌릴 수 있다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /DEFAULT_LANGUAGE_CODES = \["ko", "ja", "es"\]/);
  assert.match(page, /DEFAULT_LANGUAGE_STORAGE_KEY = "subtitle-localizer:default-languages:v1"/);
  assert.match(page, /useState<string\[\]>\(DEFAULT_LANGUAGE_CODES\)/);
  assert.match(page, /localStorage\.getItem\(DEFAULT_LANGUAGE_STORAGE_KEY\)/);
  assert.match(page, /localStorage\.setItem\(DEFAULT_LANGUAGE_STORAGE_KEY, JSON\.stringify\(selectedLanguages\)\)/);
  assert.match(page, /localStorage\.removeItem\(DEFAULT_LANGUAGE_STORAGE_KEY\)/);
  assert.match(page, /현재 선택을 기본값으로 저장/);
  assert.match(page, /기본값 초기화/);
});
