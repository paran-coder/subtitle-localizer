import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("YouTube 자막 업로드 후 같은 원본 영상의 자막 목록을 자동 갱신한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /async function fetchCaptionTracks\(videoId: string\)/);
  assert.match(page, /let shouldRefreshSourceCaptions = false/);
  assert.match(page, /selectedVideoId === sourceVideoId/);
  assert.match(page, /shouldRefreshSourceCaptions = true/);
  assert.match(page, /if \(shouldRefreshSourceCaptions && sourceVideoId\)/);
  assert.match(page, /const tracks = await fetchCaptionTracks\(sourceVideoId\)/);
  assert.match(page, /setCaptionTracks\(tracks\)/);
  assert.match(page, /setSelectedCaptionId\(\(current\) => tracks\.some/);
});

test("YouTube 자막 가져오기 성공을 원본 영역에서 명확히 표시한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /type YouTubeImportReceipt/);
  assert.match(page, /const \[importReceipt, setImportReceipt\]/);
  assert.match(page, /setImportReceipt\(\{/);
  assert.match(page, /가져오기 완료/);
  assert.match(page, /YouTube 자막 가져오기 결과/);
  assert.match(page, /importReceipt\.cueCount/);
  assert.match(page, /importReceipt\.videoTitle/);
  assert.match(page, /importReceipt\.fileName/);
});

test("가져온 원본 언어와 같은 번역 대상은 자동 해제한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /function appLanguageCodeForYouTube/);
  assert.match(page, /const importedTargetCode = appLanguageCodeForYouTube/);
  assert.match(page, /setSelectedLanguages\(\(current\) => current\.filter\(\(item\) => item !== importedTargetCode\)\)/);
  assert.match(page, /pt: "pt-BR"/);
  assert.match(page, /"zh-hans": "zh-CN"/);
  assert.match(page, /"zh-hant": "zh-TW"/);
});

test("YouTube 원본 영상 변경 시 이전 가져오기 성공 상태를 지운다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /setSourceVideoId\(event\.target\.value\); setImportReceipt\(null\);/);
  assert.match(page, /setImportReceipt\(null\);\n    clearOutputs\(\);/);
});
