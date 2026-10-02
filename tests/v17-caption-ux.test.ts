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

test("YouTube에서 가져온 원본 자막 언어를 자동 지정하고 같은 번역 대상은 제외한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /function appLanguageCodeForYouTube/);
  assert.match(page, /const importedSourceCode = appLanguageCodeForYouTube/);
  assert.match(page, /applySourceSrt\(payload\.srt, importedFileName, importedSourceCode\)/);
  assert.match(page, /setSourceLanguageCode\(nextSourceLanguageCode\)/);
  assert.match(page, /current\.filter\(\(item\) => item !== nextSourceLanguageCode\)/);
  assert.match(page, /pt: "pt-BR"/);
  assert.match(page, /"zh-hans": "zh-CN"/);
  assert.match(page, /"zh-hant": "zh-TW"/);
});

test("YouTube 원본 영상 변경 시 이전 가져오기 성공 상태를 지운다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /setSourceVideoId\(event\.target\.value\); setImportReceipt\(null\);/);
  assert.match(page, /setImportReceipt\(null\);\n    clearOutputs\(\);/);
});


test("원본 자막 언어는 번역 대상에서 선택할 수 없고 번역 실행 전 필수다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /const \[sourceLanguageCode, setSourceLanguageCode\] = useState\(""/);
  assert.match(page, /원본 자막 언어/);
  assert.match(page, /code !== sourceLanguageCode/);
  assert.match(page, /if \(code === sourceLanguageCode\) return/);
  assert.match(page, /disabled=\{!cues\.length \|\| running \|\| isSourceLanguage\}/);
  assert.match(page, /원본 언어 · 번역 불필요/);
  assert.match(page, /!sourceLanguageCode \|\| !selectedLanguages\.length/);
});

test("원본 자막 업로드는 기본 ON이며 번역 없이 원본 cue를 그대로 사용한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /const \[includeSourceInUpload, setIncludeSourceInUpload\] = useState\(true\)/);
  assert.match(page, /원본 자막도 업로드에 포함/);
  assert.match(page, /includeSourceInUpload\s*&& cues\.length/);
  assert.match(page, /code === sourceLanguageCode\s*\? \(includeSourceInUpload && !sourceAlreadyOnSelectedVideo \? cues : undefined\)/);
  assert.match(page, /원본 그대로/);
});

test("같은 YouTube 영상에서 가져온 원본 트랙은 중복 업로드 대상에서 제외한다", () => {
  const page = read("app/page.tsx");
  assert.match(page, /const sourceAlreadyOnSelectedVideo = Boolean/);
  assert.match(page, /sourceVideoId === selectedVideoId/);
  assert.match(page, /!sourceAlreadyOnSelectedVideo/);
  assert.match(page, /이미 존재하므로 중복 업로드하지 않습니다/);
});
