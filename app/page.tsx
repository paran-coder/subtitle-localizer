"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import {
  analyzeCueQuality,
  analyzeLocalizedCueQuality,
  chunkSubtitleCues,
  cueDurationMs,
  durationMs,
  formatDuration,
  hasPreservedTiming,
  MAX_TRANSLATABLE_CUE_CHARS,
  parseSrt,
  replaceCueTexts,
  serializeSrt
} from "@/lib/srt";
import type { LanguageProgress, SubtitleCue, TranslationItem, TranslationStyle } from "@/lib/types";

type YouTubeVideo = { id: string; title: string; thumbnail?: string; publishedAt?: string };
type YouTubeChannel = { id: string; title: string; thumbnail?: string };
type YouTubeCaptionTrack = {
  id: string;
  language: string;
  name: string;
  trackKind: string;
  status: string;
  isDraft: boolean;
  lastUpdated?: string;
};
type YouTubeStatus = "checking" | "unavailable" | "disconnected" | "connected";

type UploadState = { status: "idle" | "uploading" | "done" | "error"; error?: string };

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_CUE_COUNT = 20_000;
const POPULAR_LANGUAGE_CODES = ["ko", "ja", "es", "fr", "de", "pt-BR", "zh-CN", "id"];

const STYLE_OPTIONS: Array<{ value: TranslationStyle; title: string; description: string }> = [
  { value: "natural", title: "자연스럽게", description: "현지 시청자가 번역투 없이 읽는 표현" },
  { value: "faithful", title: "원문 충실", description: "의미와 톤을 최대한 가깝게 유지" },
  { value: "concise", title: "짧게", description: "빠르게 지나가는 자막을 더 간결하게" },
  { value: "education", title: "교육·강의", description: "용어 정확성과 설명 일관성 우선" },
  { value: "business", title: "비즈니스", description: "정중하고 전문적인 표현" }
];

function downloadBlob(content: BlobPart, filename: string, type = "text/plain;charset=utf-8") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function stripExtension(filename: string) {
  return filename.replace(/\.srt$/i, "") || "subtitles";
}

function mapToItems(cache: Map<number, string>): TranslationItem[] {
  return Array.from(cache.entries()).map(([id, text]) => ({ id, text }));
}

function formatVideoDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

async function translateLanguage(
  languageCode: string,
  cues: SubtitleCue[],
  style: TranslationStyle,
  glossary: string,
  accessKey: string,
  cache: Map<number, string>,
  onProgress: (completed: number, total: number) => void
): Promise<SubtitleCue[]> {
  const chunks = chunkSubtitleCues(cues);
  const indexById = new Map(cues.map((cue, index) => [cue.id, index]));

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (chunk.every((cue) => cache.has(cue.id))) {
      onProgress(index + 1, chunks.length);
      continue;
    }

    const firstCueIndex = indexById.get(chunk[0].id) ?? 0;
    const lastCueIndex = indexById.get(chunk[chunk.length - 1].id) ?? firstCueIndex;
    const contextBefore = cues
      .slice(Math.max(0, firstCueIndex - 2), firstCueIndex)
      .map(({ id, text }) => ({ id, text }));
    const contextAfter = cues
      .slice(lastCueIndex + 1, lastCueIndex + 3)
      .map(({ id, text }) => ({ id, text }));

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessKey.trim() ? { "x-subtitle-access-key": accessKey.trim() } : {})
      },
      body: JSON.stringify({
        languageCode,
        style,
        glossary,
        cues: chunk.map((cue) => ({ id: cue.id, text: cue.text, durationMs: cueDurationMs(cue) })),
        contextBefore,
        contextAfter
      }),
      signal: AbortSignal.timeout(65_000)
    });

    const payload = (await response.json()) as { items?: TranslationItem[]; error?: string };
    if (!response.ok || !payload.items) throw new Error(payload.error || `번역 요청 실패 (${response.status})`);
    for (const item of payload.items) cache.set(item.id, item.text);
    onProgress(index + 1, chunks.length);
  }

  return replaceCueTexts(cues, mapToItems(cache));
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const partialTranslationsRef = useRef<Record<string, Map<number, string>>>({});
  const [sourceFileName, setSourceFileName] = useState("");
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["ko", "ja", "es"]);
  const [style, setStyle] = useState<TranslationStyle>("natural");
  const [glossary, setGlossary] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [progress, setProgress] = useState<Record<string, LanguageProgress>>({});
  const [results, setResults] = useState<Record<string, SubtitleCue[]>>({});
  const [activePreview, setActivePreview] = useState<string>("source");
  const [running, setRunning] = useState(false);
  const [sourceMode, setSourceMode] = useState<"file" | "youtube">("file");
  const [sourceVideoId, setSourceVideoId] = useState("");
  const [captionTracks, setCaptionTracks] = useState<YouTubeCaptionTrack[]>([]);
  const [captionLoading, setCaptionLoading] = useState(false);
  const [selectedCaptionId, setSelectedCaptionId] = useState("");
  const [importingCaption, setImportingCaption] = useState(false);

  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>("checking");
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [trackName, setTrackName] = useState("Subtitle Localizer");
  const [uploadLanguages, setUploadLanguages] = useState<string[]>([]);
  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({});
  const [uploadRunning, setUploadRunning] = useState(false);

  const chunks = useMemo(() => chunkSubtitleCues(cues), [cues]);
  const stats = useMemo(() => {
    if (!cues.length) return null;
    const quality = cues.map(analyzeCueQuality);
    return {
      count: cues.length,
      duration: formatDuration(durationMs(cues)),
      warnings: quality.reduce((sum, cue) => sum + cue.warnings.length, 0),
      chunks: chunks.length
    };
  }, [cues, chunks]);

  const completedCodes = useMemo(() => Object.keys(results), [results]);
  const expectedRequests = (stats?.chunks ?? 0) * selectedLanguages.length;
  const activeLanguage = activePreview === "source" ? null : getLanguage(activePreview);
  const previewCues = activePreview === "source" ? cues : results[activePreview] ?? [];
  const activeTimingPreserved = activeLanguage && results[activePreview]
    ? hasPreservedTiming(cues, results[activePreview])
    : false;
  const activeWarnings = useMemo(() => {
    if (!activeLanguage || !results[activeLanguage.code]) return 0;
    return results[activeLanguage.code]
      .map((cue) => analyzeLocalizedCueQuality(cue, activeLanguage.code))
      .reduce((sum, item) => sum + item.warnings.length, 0);
  }, [activeLanguage, results]);

  useEffect(() => {
    let cancelled = false;
    async function checkYouTube() {
      try {
        const response = await fetch("/api/youtube/status", { cache: "no-store" });
        const payload = (await response.json()) as { configured?: boolean; connected?: boolean };
        if (cancelled) return;
        setYoutubeStatus(!payload.configured ? "unavailable" : payload.connected ? "connected" : "disconnected");
      } catch {
        if (!cancelled) setYoutubeStatus("unavailable");
      }
    }
    void checkYouTube();

    const query = new URLSearchParams(window.location.search).get("youtube");
    if (query === "connected") setYoutubeMessage("YouTube 채널이 연결되었습니다.");
    if (query === "denied") setYoutubeMessage("YouTube 연결이 취소되었습니다.");
    if (query === "invalid-state") setYoutubeMessage("YouTube 인증 상태를 확인하지 못했습니다. 다시 연결해 주세요.");
    if (query === "token-error") setYoutubeMessage("Google 인증 토큰을 발급받지 못했습니다.");
    if (query === "not-configured") setYoutubeMessage("YouTube OAuth 환경변수를 먼저 설정해 주세요.");
    if (query) window.history.replaceState({}, "", window.location.pathname);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (youtubeStatus !== "connected") return;
    let cancelled = false;
    async function loadVideos() {
      setYoutubeLoading(true);
      try {
        const response = await fetch("/api/youtube/videos", { cache: "no-store" });
        const payload = (await response.json()) as { channel?: YouTubeChannel; videos?: YouTubeVideo[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "영상 목록을 불러오지 못했습니다.");
        if (cancelled) return;
        setYoutubeChannel(payload.channel ?? null);
        setYoutubeVideos(payload.videos ?? []);
        setSelectedVideoId((current) => current && payload.videos?.some((video) => video.id === current) ? current : "");
        setSourceVideoId((current) => current && payload.videos?.some((video) => video.id === current) ? current : "");
      } catch (error) {
        if (!cancelled) setYoutubeMessage(error instanceof Error ? error.message : "영상 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setYoutubeLoading(false);
      }
    }
    void loadVideos();
    return () => { cancelled = true; };
  }, [youtubeStatus]);

  useEffect(() => {
    if (youtubeStatus !== "connected" || !sourceVideoId) {
      setCaptionTracks([]);
      setSelectedCaptionId("");
      return;
    }
    let cancelled = false;
    async function loadCaptionTracks() {
      setCaptionLoading(true);
      setYoutubeMessage("");
      try {
        const response = await fetch("/api/youtube/captions/list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: sourceVideoId }),
          cache: "no-store"
        });
        const payload = (await response.json()) as { tracks?: YouTubeCaptionTrack[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "자막 트랙을 불러오지 못했습니다.");
        if (cancelled) return;
        const tracks = [...(payload.tracks ?? [])].sort((a, b) => {
          const aEnglish = /^en(?:-|$)/i.test(a.language) ? 0 : 1;
          const bEnglish = /^en(?:-|$)/i.test(b.language) ? 0 : 1;
          if (aEnglish !== bEnglish) return aEnglish - bEnglish;
          if (a.status === "serving" && b.status !== "serving") return -1;
          if (a.status !== "serving" && b.status === "serving") return 1;
          return a.language.localeCompare(b.language);
        });
        setCaptionTracks(tracks);
        const preferred = tracks.find((track) => /^en(?:-|$)/i.test(track.language) && track.status === "serving")
          ?? tracks.find((track) => track.status === "serving")
          ?? tracks[0];
        setSelectedCaptionId(preferred?.id ?? "");
      } catch (error) {
        if (!cancelled) {
          setCaptionTracks([]);
          setSelectedCaptionId("");
          setYoutubeMessage(error instanceof Error ? error.message : "자막 트랙을 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) setCaptionLoading(false);
      }
    }
    void loadCaptionTracks();
    return () => { cancelled = true; };
  }, [youtubeStatus, sourceVideoId]);

  useEffect(() => {
    if (!running) setUploadLanguages(completedCodes);
  }, [completedCodes, running]);

  function clearOutputs() {
    setResults({});
    setProgress({});
    setActivePreview("source");
    setUploadLanguages([]);
    setUploadState({});
    partialTranslationsRef.current = {};
  }

  function applySourceSrt(content: string, filename: string) {
    const parsed = parseSrt(content);
    if (parsed.length > MAX_CUE_COUNT) throw new Error(`자막은 최대 ${MAX_CUE_COUNT.toLocaleString()}개 cue까지 처리할 수 있습니다.`);
    const oversizedCue = parsed.find((cue) => cue.text.length > MAX_TRANSLATABLE_CUE_CHARS);
    if (oversizedCue) throw new Error(`${oversizedCue.id}번 자막이 너무 깁니다. 원본 cue를 더 짧게 나눠 주세요.`);
    setCues(parsed);
    setSourceFileName(filename);
    clearOutputs();
    return parsed;
  }

  async function loadFile(file?: File) {
    if (running) return;
    setFileError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".srt")) return setFileError(".srt 파일만 업로드할 수 있습니다.");
    if (file.size > MAX_FILE_SIZE) return setFileError("파일 크기는 5MB 이하여야 합니다.");
    try {
      applySourceSrt(await file.text(), file.name);
    } catch (error) {
      setCues([]);
      setSourceFileName("");
      clearOutputs();
      setFileError(error instanceof Error ? error.message : "SRT 파일을 읽지 못했습니다.");
    }
  }

  async function loadSampleSrt() {
    if (running) return;
    setFileError("");
    try {
      const response = await fetch("/samples/localization-challenge-en.srt", { cache: "no-store" });
      if (!response.ok) throw new Error("샘플 SRT를 불러오지 못했습니다.");
      applySourceSrt(await response.text(), "localization-challenge-en.srt");
      setSourceMode("file");
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "샘플 SRT를 불러오지 못했습니다.");
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void loadFile(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void loadFile(event.dataTransfer.files?.[0]);
  }

  function applyLanguageSelection(codes: string[]) {
    if (running) return;
    if (Object.keys(results).length || Object.keys(progress).length) clearOutputs();
    setSelectedLanguages(codes);
  }

  function toggleLanguage(code: string) {
    applyLanguageSelection(selectedLanguages.includes(code)
      ? selectedLanguages.filter((item) => item !== code)
      : [...selectedLanguages, code]);
  }

  function changeStyle(next: TranslationStyle) {
    if (next === style) return;
    if (Object.keys(results).length || Object.keys(progress).length) clearOutputs();
    setStyle(next);
  }

  function changeGlossary(next: string) {
    if (Object.keys(results).length || Object.keys(progress).length) clearOutputs();
    setGlossary(next);
  }

  async function runOneLanguage(code: string) {
    const totalChunks = chunks.length;
    const cache = partialTranslationsRef.current[code] ?? new Map<number, string>();
    partialTranslationsRef.current[code] = cache;
    const cachedChunks = chunks.filter((chunk) => chunk.every((cue) => cache.has(cue.id))).length;
    setProgress((current) => ({
      ...current,
      [code]: { languageCode: code, status: "translating", completedChunks: cachedChunks, totalChunks }
    }));

    try {
      const translatedCues = await translateLanguage(code, cues, style, glossary, accessKey, cache, (completed, total) => {
        setProgress((current) => ({
          ...current,
          [code]: { ...current[code], completedChunks: completed, totalChunks: total }
        }));
      });
      setResults((current) => ({ ...current, [code]: translatedCues }));
      setProgress((current) => ({
        ...current,
        [code]: { ...current[code], status: "done", completedChunks: totalChunks }
      }));
      setActivePreview((current) => current === "source" ? code : current);
    } catch (error) {
      setProgress((current) => ({
        ...current,
        [code]: {
          ...current[code],
          status: "error",
          error: error instanceof Error ? error.message : "번역 실패"
        }
      }));
    }
  }

  async function retryLanguage(code: string) {
    if (running || !cues.length) return;
    setRunning(true);
    await runOneLanguage(code);
    setRunning(false);
  }

  async function startTranslation() {
    if (!cues.length || !selectedLanguages.length || running) return;
    setRunning(true);
    setResults({});
    setUploadState({});
    setActivePreview("source");
    partialTranslationsRef.current = {};
    setProgress(Object.fromEntries(selectedLanguages.map((code) => [
      code,
      { languageCode: code, status: "queued", completedChunks: 0, totalChunks: chunks.length } satisfies LanguageProgress
    ])));

    const queue = [...selectedLanguages];
    const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
      while (queue.length) {
        const code = queue.shift();
        if (!code) return;
        await runOneLanguage(code);
      }
    });
    await Promise.all(workers);
    setRunning(false);
  }

  function downloadSrt(code: string) {
    const translatedCues = results[code];
    const language = getLanguage(code);
    if (!translatedCues || !language) return;
    downloadBlob(`\uFEFF${serializeSrt(translatedCues)}`, `${stripExtension(sourceFileName)}.${language.fileSuffix}.srt`);
  }

  async function downloadZip() {
    if (!completedCodes.length) return;
    const zip = new JSZip();
    const base = stripExtension(sourceFileName);
    for (const code of completedCodes) {
      const language = getLanguage(code);
      if (language) zip.file(`${base}.${language.fileSuffix}.srt`, `\uFEFF${serializeSrt(results[code])}`);
    }
    downloadBlob(await zip.generateAsync({ type: "blob" }), `${base}-subtitles.zip`, "application/zip");
  }

  async function importYouTubeCaption() {
    if (running || importingCaption || !selectedCaptionId || !sourceVideoId) return;
    setImportingCaption(true);
    setFileError("");
    setYoutubeMessage("");
    try {
      const response = await fetch("/api/youtube/captions/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedCaptionId }),
        cache: "no-store"
      });
      const payload = (await response.json()) as { srt?: string; error?: string };
      if (!response.ok || typeof payload.srt !== "string") throw new Error(payload.error || "YouTube 자막을 가져오지 못했습니다.");
      const video = youtubeVideos.find((item) => item.id === sourceVideoId);
      const track = captionTracks.find((item) => item.id === selectedCaptionId);
      const safeTitle = (video?.title || "youtube-video").replace(/[\/:*?"<>|]+/g, "-").slice(0, 80);
      const parsed = applySourceSrt(payload.srt, `${safeTitle}.${track?.language || "source"}.youtube.srt`);
      setSelectedVideoId(sourceVideoId);
      setYoutubeMessage(`${track?.language || "원본"} 자막 ${parsed.length.toLocaleString()}개 cue를 가져왔습니다.`);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "YouTube 자막을 가져오지 못했습니다.");
    } finally {
      setImportingCaption(false);
    }
  }

  async function disconnectYouTube() {
    await fetch("/api/youtube/oauth/logout", { method: "POST" });
    setYoutubeStatus("disconnected");
    setYoutubeChannel(null);
    setYoutubeVideos([]);
    setSelectedVideoId("");
    setSourceVideoId("");
    setCaptionTracks([]);
    setSelectedCaptionId("");
    setSourceMode("file");
    setYoutubeMessage("YouTube 연결을 해제했습니다.");
  }

  function toggleUploadLanguage(code: string) {
    setUploadLanguages((current) => current.includes(code)
      ? current.filter((item) => item !== code)
      : [...current, code]);
  }

  async function uploadToYouTube() {
    if (uploadRunning || !selectedVideoId || !uploadLanguages.length) return;
    setUploadRunning(true);
    setYoutubeMessage("");
    for (const code of uploadLanguages) {
      const translated = results[code];
      if (!translated) continue;
      setUploadState((current) => ({ ...current, [code]: { status: "uploading" } }));
      try {
        const response = await fetch("/api/youtube/captions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: selectedVideoId,
            languageCode: code,
            trackName: trackName.trim() || "Subtitle Localizer",
            srt: serializeSrt(translated)
          }),
          signal: AbortSignal.timeout(65_000)
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error || "YouTube 자막 업로드에 실패했습니다.");
        setUploadState((current) => ({ ...current, [code]: { status: "done" } }));
        setUploadLanguages((current) => current.filter((item) => item !== code));
      } catch (error) {
        setUploadState((current) => ({
          ...current,
          [code]: { status: "error", error: error instanceof Error ? error.message : "업로드 실패" }
        }));
      }
    }
    setUploadRunning(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#top" aria-label="Subtitle Localizer 홈">
            <span className="brand-symbol" aria-hidden="true">S</span>
            <span><strong>Subtitle Localizer</strong><small>v1.3.0</small></span>
          </a>
          <div className="topbar-actions">
            <span className="privacy-label">파일을 서버에 저장하지 않습니다</span>
            {youtubeStatus === "connected" ? (
              <a className="quiet-button" href="#youtube-title">YouTube 연결됨</a>
            ) : youtubeStatus === "disconnected" ? (
              <a className="quiet-button" href="/api/youtube/oauth/start">YouTube 연결</a>
            ) : null}
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy-block">
          <span className="eyebrow">SRT LOCALIZATION WORKSPACE</span>
          <h1>타임코드는 그대로.<br />자막은 현지 언어처럼.</h1>
          <p>SRT를 올리거나 YouTube의 기존 자막을 바로 가져와 여러 언어로 현지화하고, 검토 후 다시 YouTube에 올립니다.</p>
        </div>
        <div className="hero-facts" aria-label="핵심 기능">
          <span><strong>17</strong> 지원 언어</span>
          <span><strong>100%</strong> 타임코드 보존</span>
          <span><strong>YouTube</strong> 자막 직접 가져오기</span>
        </div>
      </section>

      <div className="workspace">
        <div className="flow-column">
          <section className="section-block" aria-labelledby="source-title">
            <div className="section-heading">
              <span className="step-badge">1</span>
              <div><h2 id="source-title">원본 자막</h2><p>파일을 올리거나 내 YouTube 영상의 기존 자막을 가져옵니다.</p></div>
            </div>

            <div className="source-tabs" role="tablist" aria-label="원본 자막 가져오기 방식">
              <button role="tab" aria-selected={sourceMode === "file"} className={sourceMode === "file" ? "active" : ""} type="button" onClick={() => setSourceMode("file")}>SRT 파일</button>
              <button role="tab" aria-selected={sourceMode === "youtube"} className={sourceMode === "youtube" ? "active" : ""} type="button" onClick={() => setSourceMode("youtube")}>YouTube 자막</button>
            </div>

            {sourceMode === "file" ? (
              <>
              <div
                className={`dropzone ${dragging ? "is-dragging" : ""} ${cues.length ? "has-file" : ""}`}
                onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => { if (!running) inputRef.current?.click(); }}
                onKeyDown={(event) => {
                  if (!running && (event.key === "Enter" || event.key === " ")) inputRef.current?.click();
                }}
                role="button"
                tabIndex={running ? -1 : 0}
                aria-disabled={running}
              >
                <input ref={inputRef} type="file" accept=".srt,application/x-subrip,text/plain" hidden disabled={running} onChange={handleFileChange} />
                <div className="upload-symbol" aria-hidden="true">↑</div>
                {cues.length ? (
                  <div className="file-copy">
                    <strong>{sourceFileName}</strong>
                    <span>{stats?.count.toLocaleString()} cues · {stats?.duration} · {stats?.chunks} API chunks</span>
                    <small>새 파일을 드롭하거나 클릭하면 교체됩니다.</small>
                  </div>
                ) : (
                  <div className="file-copy">
                    <strong>SRT 파일을 드롭하세요</strong>
                    <span>또는 클릭해서 파일 선택</span>
                    <small>최대 5MB · UTF-8 권장</small>
                  </div>
                )}
              </div>
              <div className="sample-row">
                <span>SRT가 아직 없으신가요?</span>
                <button type="button" disabled={running} onClick={() => void loadSampleSrt()}>30-cue 샘플로 테스트</button>
              </div>
              </>
            ) : (
              <div className="youtube-source-panel">
                {youtubeStatus === "checking" && <p className="source-empty">YouTube 연결 상태를 확인하고 있습니다.</p>}
                {youtubeStatus === "unavailable" && <p className="source-empty">Vercel에 Google OAuth 환경변수를 설정하면 YouTube 자막 가져오기를 사용할 수 있습니다.</p>}
                {youtubeStatus === "disconnected" && (
                  <div className="source-empty"><strong>YouTube 채널을 먼저 연결해 주세요.</strong><a className="primary-button source-connect" href="/api/youtube/oauth/start">YouTube 연결</a></div>
                )}
                {youtubeStatus === "connected" && (
                  <div className="youtube-source-grid">
                    <div className="field-block compact">
                      <div className="field-row"><label htmlFor="source-youtube-video">원본 영상</label><span>{youtubeVideos.length}개</span></div>
                      <select id="source-youtube-video" className="text-input" disabled={youtubeLoading || importingCaption || !youtubeVideos.length} value={sourceVideoId} onChange={(event) => setSourceVideoId(event.target.value)}>
                        <option value="">영상을 선택하세요</option>
                        {youtubeVideos.map((video) => <option key={video.id} value={video.id}>{video.title} {video.publishedAt ? `· ${formatVideoDate(video.publishedAt)}` : ""}</option>)}
                      </select>
                    </div>
                    <div className="field-block compact">
                      <div className="field-row"><label htmlFor="source-caption-track">기존 자막</label><span>{captionLoading ? "확인 중" : `${captionTracks.length}개`}</span></div>
                      <select id="source-caption-track" className="text-input" disabled={!sourceVideoId || captionLoading || importingCaption || !captionTracks.length} value={selectedCaptionId} onChange={(event) => setSelectedCaptionId(event.target.value)}>
                        {!sourceVideoId && <option value="">먼저 영상을 선택하세요</option>}
                        {sourceVideoId && captionLoading && <option value="">자막 목록 불러오는 중…</option>}
                        {sourceVideoId && !captionLoading && !captionTracks.length && <option value="">가져올 수 있는 자막이 없습니다</option>}
                        {captionTracks.map((track) => <option key={track.id} value={track.id}>{track.language} · {track.name}{track.trackKind === "ASR" ? " · 자동 생성" : ""}{track.isDraft ? " · 초안" : ""}</option>)}
                      </select>
                    </div>
                    <div className="youtube-import-action">
                      <div>
                        <strong>타임코드까지 그대로 가져옵니다</strong>
                        <span>선택한 트랙을 SRT로 받아 기존 번역 파이프라인에 연결합니다.</span>
                      </div>
                      <button className="primary-button" type="button" disabled={!selectedCaptionId || importingCaption || running} onClick={() => void importYouTubeCaption()}>
                        {importingCaption ? "자막 가져오는 중…" : "SRT 가져오기"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {fileError && <p className="feedback error" role="alert">{fileError}</p>}
            {stats && stats.warnings > 0 && <p className="feedback neutral">원본에서 읽기 길이 참고 항목 {stats.warnings}개를 감지했습니다. 원본 타임코드는 수정하지 않습니다.</p>}
          </section>

          <section className={`section-block ${!cues.length ? "is-muted" : ""}`} aria-labelledby="localize-title">
            <div className="section-heading">
              <span className="step-badge">2</span>
              <div><h2 id="localize-title">현지화 설정</h2><p>언어와 말투만 정하면 나머지는 구조를 유지해 처리합니다.</p></div>
            </div>

            <div className="field-block">
              <div className="field-row"><label>번역 언어</label><span>{selectedLanguages.length}개 선택</span></div>
              <div className="inline-actions">
                <button type="button" disabled={!cues.length || running} onClick={() => applyLanguageSelection(POPULAR_LANGUAGE_CODES)}>추천 8개</button>
                <button type="button" disabled={!cues.length || running} onClick={() => applyLanguageSelection(LANGUAGES.map((item) => item.code))}>전체</button>
                <button type="button" disabled={!cues.length || running} onClick={() => applyLanguageSelection([])}>초기화</button>
              </div>
              <div className="language-grid">
                {LANGUAGES.map((language) => {
                  const selected = selectedLanguages.includes(language.code);
                  return (
                    <button
                      className={`language-option ${selected ? "selected" : ""}`}
                      key={language.code}
                      type="button"
                      aria-pressed={selected}
                      disabled={!cues.length || running}
                      onClick={() => toggleLanguage(language.code)}
                    >
                      <span className="selection-dot" aria-hidden="true">{selected ? "✓" : ""}</span>
                      <span><strong>{language.nativeLabel}</strong><small>{language.label}</small></span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field-block">
              <div className="field-row"><label>번역 스타일</label><span>기본: 자연스럽게</span></div>
              <div className="style-tabs" role="radiogroup" aria-label="번역 스타일">
                {STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={style === option.value ? "active" : ""}
                    role="radio"
                    aria-checked={style === option.value}
                    disabled={!cues.length || running}
                    onClick={() => changeStyle(option.value)}
                  >
                    <strong>{option.title}</strong><small>{option.description}</small>
                  </button>
                ))}
              </div>
            </div>

            <details className="advanced-settings">
              <summary>고급 설정</summary>
              <div className="advanced-grid">
                <div className="field-block compact">
                  <div className="field-row"><label htmlFor="glossary">용어집</label><span>선택</span></div>
                  <textarea id="glossary" rows={5} maxLength={8000} disabled={!cues.length || running} value={glossary} onChange={(event) => changeGlossary(event.target.value)} placeholder={"OpenAI = OpenAI\nChatGPT = ChatGPT\nprompt = 프롬프트"} />
                  <small className="field-help">브랜드명·인명·전문용어 규칙을 한 줄씩 입력합니다.</small>
                </div>
                <div className="field-block compact">
                  <div className="field-row"><label htmlFor="access-key">배포 보호 키</label><span>운영 배포</span></div>
                  <input id="access-key" className="text-input" type="password" autoComplete="off" maxLength={200} disabled={!cues.length || running} value={accessKey} onChange={(event) => setAccessKey(event.target.value)} placeholder="SUBTITLE_APP_ACCESS_KEY" />
                  <small className="field-help">OpenAI 키가 아니라 이 앱의 공개 API 호출을 막는 보호용 키입니다.</small>
                </div>
              </div>
            </details>

            <div className="action-bar">
              <div className="action-meta">
                <span>{selectedLanguages.length}개 언어</span>
                <span>예상 {expectedRequests.toLocaleString()} 요청</span>
                <span>실패 시 완료 청크부터 이어서 재시도</span>
              </div>
              <button className="primary-button" type="button" disabled={!cues.length || !selectedLanguages.length || running} onClick={() => void startTranslation()}>
                {running ? "번역하고 있습니다…" : "번역 시작"}
              </button>
            </div>
          </section>

          {(running || Object.keys(progress).length > 0) && (
            <section className="section-block" aria-labelledby="progress-title">
              <div className="section-heading">
                <span className="step-badge">3</span>
                <div><h2 id="progress-title">번역 진행</h2><p>언어별로 완료 상태를 확인할 수 있습니다.</p></div>
              </div>
              <div className="progress-list">
                {selectedLanguages.map((code) => {
                  const language = getLanguage(code);
                  const item = progress[code];
                  const percent = item?.totalChunks ? Math.round((item.completedChunks / item.totalChunks) * 100) : 0;
                  return (
                    <div className="progress-row" key={code}>
                      <div className="progress-copy"><strong>{language?.nativeLabel}</strong><span>{item?.status === "done" ? "완료" : item?.status === "error" ? "확인 필요" : item?.status === "translating" ? `${percent}%` : "대기"}</span></div>
                      <div className="progress-track" aria-label={`${language?.nativeLabel} ${percent}%`}><i style={{ width: `${percent}%` }} /></div>
                      {item?.status === "error" && (
                        <div className="progress-error"><span>{item.error}</span><button type="button" disabled={running} onClick={() => void retryLanguage(code)}>이어서 재시도</button></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {completedCodes.length > 0 && (
            <section className="section-block" aria-labelledby="review-title">
              <div className="section-heading review-heading">
                <span className="step-badge">4</span>
                <div><h2 id="review-title">검토 & 다운로드</h2><p>원문과 번역을 나란히 확인한 뒤 파일을 받습니다.</p></div>
                <button className="dark-button" type="button" onClick={() => void downloadZip()}>완료 언어 ZIP</button>
              </div>

              <div className="preview-tabs" role="tablist">
                {completedCodes.map((code) => {
                  const language = getLanguage(code);
                  return <button role="tab" aria-selected={activePreview === code} className={activePreview === code ? "active" : ""} key={code} type="button" onClick={() => setActivePreview(code)}>{language?.nativeLabel}</button>;
                })}
              </div>

              {activeLanguage && (
                <div className="quality-strip">
                  <span className={activeTimingPreserved ? "ok" : "bad"}>{activeTimingPreserved ? "타임코드·ID 보존 확인" : "구조 확인 필요"}</span>
                  <span>읽기 길이 참고 {activeWarnings}개</span>
                  <button type="button" onClick={() => downloadSrt(activeLanguage.code)}>{activeLanguage.nativeLabel} SRT 다운로드</button>
                </div>
              )}

              <div className="comparison-table">
                <div className="comparison-head"><span>원문</span><span>{activeLanguage ? activeLanguage.nativeLabel : "원문"}</span></div>
                {previewCues.slice(0, 80).map((cue, index) => (
                  <div className="cue-row" key={`${activePreview}-${cue.id}`}>
                    <div className="cue-cell"><small>#{cues[index]?.id} · {cues[index]?.start}</small><p>{cues[index]?.text}</p></div>
                    <div className="cue-cell target"><small>#{cue.id} · {cue.start}</small><p>{cue.text}</p></div>
                  </div>
                ))}
                {cues.length > 80 && <p className="preview-limit">화면에서는 앞 80개 cue만 보여줍니다. 다운로드 파일에는 전체 자막이 포함됩니다.</p>}
              </div>
            </section>
          )}
        </div>

        <aside className="side-column">
          <section className="side-card sticky-card" aria-labelledby="youtube-title">
            <div className="side-heading">
              <span className="youtube-mark" aria-hidden="true">▶</span>
              <div><h2 id="youtube-title">YouTube에 올리기</h2><p>완료된 SRT를 영상에 자막 트랙으로 추가합니다.</p></div>
            </div>

            {youtubeMessage && <p className="feedback neutral side-feedback">{youtubeMessage}</p>}

            {youtubeStatus === "checking" && <p className="side-empty">YouTube 연결 상태를 확인하고 있습니다.</p>}
            {youtubeStatus === "unavailable" && (
              <div className="side-empty"><strong>OAuth 설정이 필요합니다</strong><p>로컬 번역과 다운로드는 그대로 사용할 수 있습니다. Vercel에 Google OAuth 환경변수를 추가하면 이 기능이 활성화됩니다.</p></div>
            )}
            {youtubeStatus === "disconnected" && (
              <div className="side-empty"><strong>내 채널과 연결</strong><p>영상 목록을 불러오고 자막을 올릴 때만 YouTube 권한을 사용합니다.</p><a className="dark-button full" href="/api/youtube/oauth/start">YouTube 연결</a></div>
            )}

            {youtubeStatus === "connected" && (
              <div className="youtube-connected">
                <div className="channel-row">
                  {youtubeChannel?.thumbnail ? <img src={youtubeChannel.thumbnail} alt="" /> : <span className="channel-placeholder" aria-hidden="true">Y</span>}
                  <div><strong>{youtubeChannel?.title ?? "연결된 채널"}</strong><span>최근 업로드 최대 50개</span></div>
                  <button type="button" onClick={() => void disconnectYouTube()}>해제</button>
                </div>

                <div className="field-block compact">
                  <div className="field-row"><label htmlFor="youtube-video">영상 선택</label><span>{youtubeVideos.length}개</span></div>
                  <select id="youtube-video" className="text-input" disabled={youtubeLoading || !youtubeVideos.length} value={selectedVideoId} onChange={(event) => setSelectedVideoId(event.target.value)}>
                    <option value="">업로드할 영상을 선택하세요</option>
                    {youtubeLoading && <option value="">영상 목록 불러오는 중…</option>}
                    {!youtubeLoading && !youtubeVideos.length && <option value="">업로드한 영상을 찾지 못했습니다</option>}
                    {youtubeVideos.map((video) => <option key={video.id} value={video.id}>{video.title} {video.publishedAt ? `· ${formatVideoDate(video.publishedAt)}` : ""}</option>)}
                  </select>
                </div>

                <div className="field-block compact">
                  <div className="field-row"><label htmlFor="track-name">자막 트랙 이름</label><span>최대 150자</span></div>
                  <input id="track-name" className="text-input" maxLength={150} value={trackName} onChange={(event) => setTrackName(event.target.value)} />
                </div>

                <div className="field-block compact">
                  <div className="field-row"><label>업로드 언어</label><span>{uploadLanguages.length}개</span></div>
                  {!completedCodes.length ? <p className="small-empty">먼저 번역을 완료해 주세요.</p> : (
                    <div className="upload-language-list">
                      {completedCodes.map((code) => {
                        const language = getLanguage(code);
                        const checked = uploadLanguages.includes(code);
                        const state = uploadState[code];
                        return (
                          <label key={code} className="upload-language-row">
                            <input type="checkbox" checked={checked} disabled={uploadRunning} onChange={() => toggleUploadLanguage(code)} />
                            <span><strong>{language?.nativeLabel}</strong><small>{state?.status === "done" ? "업로드 완료" : state?.status === "uploading" ? "업로드 중" : state?.status === "error" ? state.error : `${language?.fileSuffix}.srt`}</small></span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="quota-note">자막 목록 조회 50 units · 원본 자막 다운로드 200 units · 자막 업로드는 언어 1개당 400 units를 사용합니다.</div>
                <button className="dark-button full" type="button" disabled={uploadRunning || !selectedVideoId || !uploadLanguages.length} onClick={() => void uploadToYouTube()}>
                  {uploadRunning ? "YouTube에 올리는 중…" : `${uploadLanguages.length || 0}개 자막 YouTube에 올리기`}
                </button>
              </div>
            )}
          </section>

          <section className="side-card summary-card">
            <h3>현재 작업</h3>
            <dl>
              <div><dt>원본</dt><dd>{sourceFileName || "아직 없음"}</dd></div>
              <div><dt>대상 언어</dt><dd>{selectedLanguages.length}개</dd></div>
              <div><dt>완료</dt><dd>{completedCodes.length}개</dd></div>
              <div><dt>타임코드</dt><dd>변경하지 않음</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <footer className="footer">Subtitle Localizer v1.3.0 · SRT 구조를 유지하는 다국어 자막 작업 도구</footer>
    </main>
  );
}
