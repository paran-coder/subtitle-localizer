import test from "node:test";
import assert from "node:assert/strict";
import { listMyYouTubeVideos, uploadCaptionTrack } from "../lib/youtube.ts";

test("연결 채널의 uploads playlist에서 영상 목록을 읽는다", async () => {
  const originalFetch = globalThis.fetch;
  const called: string[] = [];
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input);
    called.push(url);
    if (url.includes("/channels?")) {
      return new Response(JSON.stringify({
        items: [{
          id: "channel-1",
          snippet: { title: "My Channel", thumbnails: { default: { url: "https://img/channel.jpg" } } },
          contentDetails: { relatedPlaylists: { uploads: "uploads-1" } }
        }]
      }), { status: 200 });
    }
    return new Response(JSON.stringify({
      items: [{
        snippet: { title: "Video A", resourceId: { videoId: "video123" }, publishedAt: "2026-01-01T00:00:00Z" },
        contentDetails: { videoId: "video123" }
      }]
    }), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await listMyYouTubeVideos("token");
    assert.equal(result.channel.title, "My Channel");
    assert.deepEqual(result.videos.map((video) => video.id), ["video123"]);
    assert.ok(called.some((url) => url.includes("mine=true")));
    assert.ok(called.some((url) => url.includes("playlistId=uploads-1")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("captions.insert용 multipart/related 본문에 metadata와 SRT를 포함한다", async () => {
  const originalFetch = globalThis.fetch;
  let contentType = "";
  let bodyText = "";
  globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
    contentType = new Headers(init?.headers).get("content-type") ?? "";
    const body = init?.body as Uint8Array;
    bodyText = Buffer.from(body).toString("utf8");
    return new Response(JSON.stringify({ id: "caption-1", snippet: { language: "ko", name: "Subtitle Localizer" } }), { status: 200 });
  }) as typeof fetch;

  try {
    const result = await uploadCaptionTrack({
      accessToken: "token",
      videoId: "video123",
      languageCode: "ko",
      trackName: "Subtitle Localizer",
      srt: "1\n00:00:00,000 --> 00:00:01,000\n안녕하세요\n"
    });
    assert.equal(result.id, "caption-1");
    assert.match(contentType, /^multipart\/related; boundary=/);
    assert.ok(bodyText.includes('"videoId":"video123"'));
    assert.ok(bodyText.includes('"language":"ko"'));
    assert.ok(bodyText.includes("안녕하세요"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("captionExists 충돌을 사용자가 이해할 수 있는 메시지로 바꾼다", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    error: { message: "Conflict", errors: [{ reason: "captionExists" }] }
  }), { status: 409 })) as typeof fetch;

  try {
    await assert.rejects(() => uploadCaptionTrack({
      accessToken: "token",
      videoId: "video123",
      languageCode: "ja",
      trackName: "Subtitle Localizer",
      srt: "1\n00:00:00,000 --> 00:00:01,000\nこんにちは\n"
    }), /이미 있습니다/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
