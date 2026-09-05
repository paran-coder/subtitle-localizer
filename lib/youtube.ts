import { randomUUID } from "node:crypto";

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail?: string;
  publishedAt?: string;
};

export type YouTubeChannel = {
  id: string;
  title: string;
  thumbnail?: string;
};

export type YouTubeCaptionTrack = {
  id: string;
  language: string;
  name: string;
  trackKind: "ASR" | "forced" | "standard" | string;
  status: string;
  isDraft: boolean;
  lastUpdated?: string;
};

type GoogleError = { error?: { message?: string; errors?: Array<{ reason?: string }> } };

async function youtubeJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  const payload = (await response.json()) as T & GoogleError;
  if (!response.ok) {
    throw new Error(payload.error?.message || `YouTube API 요청 실패 (${response.status})`);
  }
  return payload;
}

async function getMyYouTubeChannelItem(accessToken: string) {
  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("part", "snippet,contentDetails");
  channelUrl.searchParams.set("mine", "true");

  const channelPayload = await youtubeJson<{
    items?: Array<{
      id: string;
      snippet?: { title?: string; thumbnails?: { default?: { url?: string } } };
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
    }>;
  }>(channelUrl.toString(), accessToken);

  const channelItem = channelPayload.items?.[0];
  if (!channelItem) throw new Error("연결된 Google 계정에서 YouTube 채널을 찾지 못했습니다.");
  return channelItem;
}

export async function getMyYouTubeChannel(accessToken: string): Promise<YouTubeChannel> {
  const channelItem = await getMyYouTubeChannelItem(accessToken);
  return {
    id: channelItem.id,
    title: channelItem.snippet?.title || "YouTube 채널",
    thumbnail: channelItem.snippet?.thumbnails?.default?.url
  };
}

export async function listMyYouTubeVideos(accessToken: string): Promise<{
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
}> {
  const channelItem = await getMyYouTubeChannelItem(accessToken);
  const uploads = channelItem.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("연결된 YouTube 채널의 업로드 목록을 찾지 못했습니다.");

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "snippet,contentDetails");
  playlistUrl.searchParams.set("playlistId", uploads);
  playlistUrl.searchParams.set("maxResults", "50");

  const playlistPayload = await youtubeJson<{
    items?: Array<{
      snippet?: {
        title?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
        resourceId?: { videoId?: string };
      };
      contentDetails?: { videoId?: string; videoPublishedAt?: string };
    }>;
  }>(playlistUrl.toString(), accessToken);

  const videos = (playlistPayload.items ?? []).flatMap((item) => {
    const id = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    if (!id) return [];
    return [{
      id,
      title: item.snippet?.title || "제목 없는 영상",
      thumbnail: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url,
      publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt
    }];
  });

  return {
    channel: {
      id: channelItem.id,
      title: channelItem.snippet?.title || "YouTube 채널",
      thumbnail: channelItem.snippet?.thumbnails?.default?.url
    },
    videos
  };
}

export async function listCaptionTracks(accessToken: string, videoId: string): Promise<YouTubeCaptionTrack[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/captions");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);

  const payload = await youtubeJson<{
    items?: Array<{
      id?: string;
      snippet?: {
        language?: string;
        name?: string;
        trackKind?: string;
        status?: string;
        isDraft?: boolean;
        lastUpdated?: string;
      };
    }>;
  }>(url.toString(), accessToken);

  return (payload.items ?? []).flatMap((item) => {
    if (!item.id || !item.snippet?.language) return [];
    return [{
      id: item.id,
      language: item.snippet.language,
      name: item.snippet.name || "기본 자막",
      trackKind: item.snippet.trackKind || "standard",
      status: item.snippet.status || "serving",
      isDraft: Boolean(item.snippet.isDraft),
      lastUpdated: item.snippet.lastUpdated
    }];
  });
}

export async function downloadCaptionTrackAsSrt(accessToken: string, captionId: string): Promise<string> {
  const url = new URL(`https://www.googleapis.com/youtube/v3/captions/${encodeURIComponent(captionId)}`);
  url.searchParams.set("tfmt", "srt");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store"
  });
  if (!response.ok) {
    let message = `YouTube 자막 다운로드 실패 (${response.status})`;
    try {
      const payload = await response.json() as GoogleError;
      message = payload.error?.message || message;
    } catch {}
    throw new Error(message);
  }
  return response.text();
}

export async function uploadCaptionTrack(input: {
  accessToken: string;
  videoId: string;
  languageCode: string;
  trackName: string;
  srt: string;
}) {
  const boundary = `subtitle-localizer-${randomUUID()}`;
  const metadata = JSON.stringify({
    snippet: {
      videoId: input.videoId,
      language: input.languageCode,
      name: input.trackName,
      isDraft: false
    }
  });

  const prefix = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/octet-stream\r\n\r\n`,
    "utf8"
  );
  const media = Buffer.from(input.srt, "utf8");
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`, "utf8");

  const url = new URL("https://www.googleapis.com/upload/youtube/v3/captions");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("uploadType", "multipart");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body: Buffer.concat([prefix, media, suffix]),
    cache: "no-store"
  });

  const payload = (await response.json()) as {
    id?: string;
    snippet?: { language?: string; name?: string; status?: string };
    error?: { message?: string; errors?: Array<{ reason?: string }> };
  };

  if (!response.ok) {
    const reason = payload.error?.errors?.[0]?.reason;
    if (response.status === 409 || reason === "captionExists") {
      throw new Error("같은 언어와 같은 트랙 이름의 자막이 이미 있습니다. 트랙 이름을 바꿔 다시 업로드해 주세요.");
    }
    throw new Error(payload.error?.message || `YouTube 자막 업로드 실패 (${response.status})`);
  }
  return payload;
}
