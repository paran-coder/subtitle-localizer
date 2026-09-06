import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

test("활성 채널 전환 API는 선택 세션을 검증한 뒤 registry를 바꾼다", () => {
  const route = read("app/api/youtube/channels/route.ts");
  assert.match(route, /refreshYouTubeSession/);
  assert.match(route, /getMyYouTubeChannel/);
  assert.match(route, /저장된 인증 세션과 선택한 YouTube 채널이 일치하지 않습니다/);
  assert.ok(route.indexOf("getMyYouTubeChannel") < route.indexOf("selectConnectionRegistry"));
});

test("YouTube status는 활성 채널 인증 오류 때 다른 채널로 조용히 전환하지 않는다", () => {
  const route = read("app/api/youtube/status/route.ts");
  assert.match(route, /activeConnectionError/);
  assert.match(route, /현재 작업 채널의 인증 세션이 없습니다/);
  assert.match(route, /현재 작업 채널의 Google 인증이 만료되었습니다/);
  assert.equal(route.includes("removeConnectionRegistry"), false);
});

test("workspace 채널 전환은 브라우저 cookie 반영을 재조회해 확인한다", () => {
  const bar = read("components/workspace-channel-bar.tsx");
  assert.match(bar, /verifyResponse = await fetch\("\/api\/youtube\/channels"/);
  assert.match(bar, /verified\.activeConnectionId !== connectionId/);
  assert.match(bar, /채널 전환이 브라우저에 저장되지 않았습니다/);
  assert.match(bar, /activeConnectionError/);
});
