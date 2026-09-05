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
  MAX_TRANSLATABLE_CUE_CHARS,
  validateSubtitleStructure,
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
type YouTubeStatus = "checking" | "server-unavailable" | "unconfigured" | "disconnected" | "connected";

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
      headers: { "Content-Type": "application/json" },
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
  const [openAiKey, setOpenAiKey] = useState("");
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [openAiServerConfigured, setOpenAiServerConfigured] = useState(true);
  const [rememberOpenAiKey, setRememberOpenAiKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [openAiSaving, setOpenAiSaving] = useState(false);
  const [openAiMessage, setOpenAiMessage] = useState("");
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
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [rememberGoogle, setRememberGoogle] = useState(false);
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [googleConfigSaving, setGoogleConfigSaving] = useState(false);
  const [youtubeRedirectUri, setYoutubeRedirectUri] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState("");
  const [trackName, setTrackName] = useState("Subtitle Localizer");
  const [uploadLanguages, setUploadLanguages] = useState<string[]>([]);
  const [uploadState, setUploadState] = useState<Record<string, UploadState>>({});
  const [uploadRunning, setUploadRunning] = useState(false);
  const [googleWizardStep, setGoogleWizardStep] = useState(1);
  const [googleSetupChecks, setGoogleSetupChecks] = useState({ projectApi: false, authPlatform: false, oauthClient: false });

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
  const activeStructure = activeLanguage && results[activePreview]
    ? validateSubtitleStructure(cues, results[activePreview])
    : null;
  const activeWarnings = useMemo(() => {
    if (!activeLanguage || !results[activeLanguage.code]) return 0;
    return results[activeLanguage.code]
      .map((cue) => analyzeLocalizedCueQuality(cue, activeLanguage.code))
      .reduce((sum, item) => sum + item.warnings.length, 0);
  }, [activeLanguage, results]);

  const previewTargetById = useMemo(() => new Map(previewCues.map((cue) => [cue.id, cue])), [previewCues]);
  const comparisonRows = useMemo(() => cues.map((source) => ({ source, target: previewTargetById.get(source.id) })), [cues, previewTargetById]);

  useEffect(() => {
    let cancelled = false;

    async function checkConnections() {
      const [openAiResult, youtubeResult] = await Promise.allSettled([
        fetch("/api/openai/credential", { cache: "no-store" }),
        fetch("/api/youtube/status", { cache: "no-store" })
      ]);

      if (cancelled) return;

      if (openAiResult.status === "fulfilled") {
        const payload = (await openAiResult.value.json()) as { serverConfigured?: boolean; configured?: boolean; remember?: boolean };
        if (!cancelled) {
          setOpenAiServerConfigured(Boolean(payload.serverConfigured));
          setOpenAiConfigured(Boolean(payload.configured));
          setRememberOpenAiKey(Boolean(payload.remember));
        }
      } else {
        setOpenAiServerConfigured(false);
      }

      if (youtubeResult.status === "fulfilled") {
        const payload = (await youtubeResult.value.json()) as { serverConfigured?: boolean; configured?: boolean; connected?: boolean; remember?: boolean; redirectUri?: string };
        if (!cancelled) {
          setYoutubeRedirectUri(payload.redirectUri ?? "");
          setRememberGoogle(Boolean(payload.remember));
          setYoutubeStatus(!payload.serverConfigured
            ? "server-unavailable"
            : !payload.configured
              ? "unconfigured"
              : payload.connected ? "connected" : "disconnected");
        }
      } else {
        setYoutubeStatus("server-unavailable");
      }
    }
    void checkConnections();

    const query = new URLSearchParams(window.location.search).get("youtube");
    if (query === "connected") setYoutubeMessage("YouTube 채널이 연결되었습니다.");
    if (query === "denied") setYoutubeMessage("YouTube 연결이 취소되었습니다.");
    if (query === "invalid-state") setYoutubeMessage("YouTube 인증 상태를 확인하지 못했습니다. 다시 연결해 주세요.");
    if (query === "token-error") setYoutubeMessage("Google OAuth Client 설정 또는 승인 상태를 확인해 주세요.");
    if (query === "client-not-configured") setYoutubeMessage("본인의 Google OAuth Client ID와 Secret을 먼저 연결해 주세요.");
    if (query === "server-not-configured") setYoutubeMessage("배포 서버에 APP_SESSION_SECRET 설정이 필요합니다.");
    if (query) window.history.replaceState({}, "", window.location.pathname);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (youtubeStatus === "connected" || youtubeStatus === "disconnected") {
      setGoogleSetupChecks({ projectApi: true, authPlatform: true, oauthClient: true });
      setGoogleWizardStep(4);
    }
  }, [youtubeStatus]);

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

  async function persistOpenAiKey(nextRemember = rememberOpenAiKey): Promise<boolean> {
    const key = openAiKey.trim();
    if (!key || openAiSaving) {
      setOpenAiMessage("OpenAI API Key를 입력해 주세요.");
      return false;
    }
    setOpenAiSaving(true);
    setOpenAiMessage("");
    try {
      const response = await fetch("/api/openai/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key, remember: nextRemember }),
        cache: "no-store"
      });
      const payload = (await response.json()) as { error?: string; configured?: boolean; remember?: boolean };
      if (!response.ok) throw new Error(payload.error || "OpenAI API Key를 저장하지 못했습니다.");
      setOpenAiConfigured(true);
      setRememberOpenAiKey(Boolean(payload.remember));
      setOpenAiKey("");
      setOpenAiMessage(payload.remember
        ? "이 브라우저의 암호화된 HttpOnly 쿠키에 OpenAI 키를 기억합니다."
        : "현재 브라우저 세션의 암호화된 HttpOnly 쿠키에서만 OpenAI 키를 사용합니다.");
      return true;
    } catch (error) {
      setOpenAiMessage(error instanceof Error ? error.message : "OpenAI API Key를 저장하지 못했습니다.");
      return false;
    } finally {
      setOpenAiSaving(false);
    }
  }

  async function updateOpenAiRemember(remember: boolean) {
    setRememberOpenAiKey(remember);
    if (!openAiConfigured) return;
    try {
      const response = await fetch("/api/openai/credential", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remember }),
        cache: "no-store"
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "기억 설정을 변경하지 못했습니다.");
      setOpenAiMessage(remember ? "이 브라우저에 암호화해 기억합니다." : "브라우저 세션이 끝나면 키가 삭제됩니다.");
    } catch (error) {
      setOpenAiMessage(error instanceof Error ? error.message : "기억 설정을 변경하지 못했습니다.");
    }
  }

  async function forgetOpenAiKey() {
    await fetch("/api/openai/credential", { method: "DELETE" });
    setOpenAiConfigured(false);
    setOpenAiKey("");
    setRememberOpenAiKey(false);
    setOpenAiMessage("저장된 OpenAI 키를 지웠습니다.");
  }

  async function saveGoogleConfig() {
    const clientId = googleClientId.trim();
    const clientSecret = googleClientSecret.trim();
    if (!clientId || !clientSecret || googleConfigSaving) {
      setYoutubeMessage("Google OAuth Client ID와 Client Secret을 모두 입력해 주세요.");
      return;
    }
    setGoogleConfigSaving(true);
    setYoutubeMessage("");
    try {
      const response = await fetch("/api/youtube/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, remember: rememberGoogle }),
        cache: "no-store"
      });
      const payload = (await response.json()) as { error?: string; redirectUri?: string };
      if (!response.ok) throw new Error(payload.error || "Google OAuth 설정을 저장하지 못했습니다.");
      setYoutubeRedirectUri(payload.redirectUri ?? youtubeRedirectUri);
      setGoogleClientSecret("");
      setYoutubeStatus("disconnected");
      setYoutubeMessage("사용자 Google Cloud 프로젝트 설정을 저장했습니다.");
    } catch (error) {
      setYoutubeMessage(error instanceof Error ? error.message : "Google OAuth 설정을 저장하지 못했습니다.");
    } finally {
      setGoogleConfigSaving(false);
    }
  }

  async function forgetGoogleConfig() {
    await fetch("/api/youtube/config", { method: "DELETE" });
    setGoogleClientId("");
    setGoogleClientSecret("");
    setRememberGoogle(false);
    setYoutubeStatus("unconfigured");
    setYoutubeChannel(null);
    setYoutubeVideos([]);
    setSelectedVideoId("");
    setSourceVideoId("");
    setCaptionTracks([]);
    setSelectedCaptionId("");
    setSourceMode("file");
    setGoogleSetupChecks({ projectApi: false, authPlatform: false, oauthClient: false });
    setGoogleWizardStep(1);
    setYoutubeMessage("저장된 Google OAuth 설정과 YouTube 연결을 지웠습니다.");
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
      const translatedCues = await translateLanguage(code, cues, style, glossary, cache, (completed, total) => {
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
      const message = error instanceof Error ? error.message : "번역 실패";
      if (/OpenAI API Key|API Key/.test(message)) {
        setOpenAiConfigured(false);
        setOpenAiMessage(message);
      }
      setProgress((current) => ({
        ...current,
        [code]: {
          ...current[code],
          status: "error",
          error: message
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
    if (!openAiConfigured) {
      if (openAiKey.trim()) {
        const saved = await persistOpenAiKey();
        if (!saved) return;
      } else {
        setOpenAiMessage("번역 비용을 본인 계정으로 처리하려면 OpenAI API Key를 먼저 연결해 주세요.");
        document.getElementById("api-connections")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
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
            <span><strong>Subtitle Localizer</strong><small>v1.5.0</small></span>
          </a>
          <div className="topbar-actions">
            <span className="privacy-label">파일을 서버에 저장하지 않습니다</span>
            <a className="quiet-button" href="#api-connections">{openAiConfigured ? "OpenAI 연결됨" : "API 연결"}</a>
            {youtubeStatus === "connected" && <a className="quiet-button" href="#youtube-title">YouTube 연결됨</a>}
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

      <section className="api-connections" id="api-connections" aria-labelledby="connections-title">
        <div className="connections-heading">
          <div>
            <span className="eyebrow">USER-PAID API CONNECTIONS</span>
            <h2 id="connections-title">비용이 생기는 API는 각자의 계정으로</h2>
            <p>이 배포는 호스팅만 제공합니다. OpenAI 사용료와 YouTube API quota는 입력한 사용자 계정·프로젝트에서 사용됩니다.</p>
          </div>
          <span className="cost-owner-badge">외부 API 비용 · 사용자 부담</span>
        </div>

        <div className="connection-grid">
          <article className={`connection-card ${openAiConfigured ? "is-ready" : ""}`}>
            <div className="connection-card-head">
              <div><span className="service-kicker">OPENAI · BYOK</span><h3>내 OpenAI API Key</h3></div>
              <span className="connection-status">{openAiConfigured ? "키 저장됨" : "연결 필요"}</span>
            </div>
            <p className="connection-description">번역 요청은 이 키로 실행되며 사용료는 해당 OpenAI 계정에 청구됩니다. 저장 시 키는 암호화된 HttpOnly 쿠키로 보호되며 실제 유효성은 첫 번역 요청에서 확인됩니다.</p>
            {!openAiServerConfigured && <div className="setup-notice"><strong>배포 설정 1개가 필요합니다</strong><span>과금 키가 아니라 자격 증명 암호화용 <code>APP_SESSION_SECRET</code>만 Vercel에 설정하면 됩니다.</span></div>}
            <div className="secret-input-row">
              <input
                className="text-input"
                type={showOpenAiKey ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={openAiKey}
                disabled={!openAiServerConfigured}
                onChange={(event) => { setOpenAiKey(event.target.value); setOpenAiMessage(""); }}
                placeholder={openAiConfigured ? "새 키로 교체하려면 입력" : "OpenAI API Key"}
                aria-label="OpenAI API Key"
              />
              <button type="button" className="input-action" onClick={() => setShowOpenAiKey((value) => !value)}>{showOpenAiKey ? "숨기기" : "보기"}</button>
            </div>
            <label className="remember-row">
              <input
                type="checkbox"
                disabled={!openAiServerConfigured}
                checked={rememberOpenAiKey}
                onChange={(event) => {
                  const checked = event.target.checked;
                  void updateOpenAiRemember(checked);
                }}
              />
              <span><strong>이 브라우저에 기억하기</strong><small>켜면 암호화된 지속 HttpOnly 쿠키로 기억합니다. 끄면 브라우저 세션에서만 유지됩니다.</small></span>
            </label>
            <div className="connection-actions">
              <button className="dark-button" type="button" disabled={!openAiServerConfigured || openAiSaving || !openAiKey.trim()} onClick={() => void persistOpenAiKey()}>{openAiSaving ? "저장 중…" : openAiConfigured ? "키 교체" : "키 연결"}</button>
              {openAiConfigured && <button className="text-button" type="button" onClick={() => void forgetOpenAiKey()}>키 지우기</button>}
            </div>
            {openAiMessage && <p className="connection-message">{openAiMessage}</p>}
          </article>

          <article className={`connection-card google-connection-card ${youtubeStatus === "connected" || youtubeStatus === "disconnected" ? "is-ready" : ""}`}>
            <div className="connection-card-head">
              <div><span className="service-kicker">GOOGLE CLOUD · BYOC</span><h3>내 YouTube API 프로젝트</h3></div>
              <span className="connection-status">{youtubeStatus === "checking" ? "확인 중" : youtubeStatus === "connected" ? "YouTube 연결됨" : youtubeStatus === "disconnected" ? "Cloud 설정됨" : "설정 필요"}</span>
            </div>
            <p className="connection-description">내 Google Cloud 프로젝트를 먼저 설정한 뒤, 별도의 Google OAuth 승인으로 YouTube 계정을 연결합니다. YouTube Data API quota는 내 프로젝트에서 사용됩니다.</p>

            {youtubeStatus === "checking" ? (
              <div className="setup-notice"><strong>연결 상태 확인 중</strong><span>저장된 사용자 Google 프로젝트와 YouTube 연결 상태를 확인하고 있습니다.</span></div>
            ) : youtubeStatus === "server-unavailable" ? (
              <div className="setup-notice"><strong>배포 설정 1개가 필요합니다</strong><span>운영자는 과금 키가 아닌 세션 암호화용 <code>APP_SESSION_SECRET</code>만 Vercel에 설정하면 됩니다.</span></div>
            ) : youtubeStatus === "connected" ? (
              <div className="connected-summary oauth-connected-summary">
                <span className="summary-kicker">GOOGLE OAUTH · CONNECTED</span>
                <strong>{youtubeChannel?.title || "내 YouTube 계정이 연결되었습니다"}</strong>
                <span>Google Cloud 자격 증명과 OAuth 토큰은 암호화된 HttpOnly 세션으로 보호됩니다.</span>
                <div className="connection-actions">
                  <button className="dark-button" type="button" onClick={() => void disconnectYouTube()}>YouTube 연결 해제</button>
                  <button className="text-button" type="button" onClick={() => void forgetGoogleConfig()}>Google 설정 지우기</button>
                </div>
              </div>
            ) : youtubeStatus === "disconnected" ? (
              <div className="oauth-ready-panel">
                <span className="summary-kicker">STEP 4 · GOOGLE OAUTH</span>
                <strong>Google Cloud 설정이 저장되었습니다.</strong>
                <p>이제 Google 로그인·동의 화면에서 실제 YouTube 계정을 승인합니다. Cloud Client 설정과 계정 승인은 서로 다른 단계입니다.</p>
                <div className="oauth-separation" aria-label="Google 연결 단계">
                  <span className="done">1. Cloud Client 저장 ✓</span>
                  <span>2. Google OAuth 승인</span>
                  <span>3. YouTube 채널 연결</span>
                </div>
                <div className="connection-actions">
                  <a className="primary-button inline-primary" href="/api/youtube/oauth/start">Google로 YouTube 연결</a>
                  <button className="text-button" type="button" onClick={() => void forgetGoogleConfig()}>다른 Google 프로젝트 사용</button>
                </div>
              </div>
            ) : (
              <div className="setup-wizard" aria-label="Google Cloud 설정 4단계">
                <div className="wizard-progress" aria-label={`Google Cloud 설정 ${googleWizardStep}/4 단계`}>
                  {[1, 2, 3, 4].map((step) => (
                    <span key={step} className={`${googleWizardStep === step ? "active" : ""} ${googleWizardStep > step ? "complete" : ""}`}>{step}</span>
                  ))}
                </div>

                <section className={`wizard-step ${googleSetupChecks.projectApi ? "is-complete" : ""} ${googleWizardStep === 1 ? "is-active" : ""}`}>
                  <button className="wizard-step-trigger" type="button" onClick={() => setGoogleWizardStep(1)} aria-expanded={googleWizardStep === 1}>
                    <span className="wizard-step-number">1</span>
                    <span><strong>프로젝트 + YouTube API</strong><small>Google Cloud 프로젝트에서 YouTube Data API v3를 활성화합니다.</small></span>
                  </button>
                  {googleWizardStep === 1 && (
                    <div className="wizard-step-body">
                      <div className="console-example">
                        <div className="console-example-title"><span>Google Cloud Console</span><strong>찾아야 할 화면 예시</strong></div>
                        <div className="console-mini-screen"><div className="console-mini-bar">API Library</div><div className="console-mini-content"><span>YouTube Data API v3</span><b>Enable</b></div></div>
                        <small>API Library → YouTube Data API v3 → Enable</small>
                      </div>
                      <ul className="wizard-checklist">
                        <li>새 프로젝트를 만들거나 사용할 프로젝트를 선택합니다.</li>
                        <li>API Library에서 <strong>YouTube Data API v3</strong>를 찾아 활성화합니다.</li>
                      </ul>
                      <div className="wizard-link-row">
                        <a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer">프로젝트 만들기 ↗</a>
                        <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">YouTube Data API 열기 ↗</a>
                      </div>
                      <label className="wizard-confirm">
                        <input type="checkbox" checked={googleSetupChecks.projectApi} onChange={(event) => {
                          const checked = event.target.checked;
                          setGoogleSetupChecks((current) => checked
                            ? { ...current, projectApi: true }
                            : { projectApi: false, authPlatform: false, oauthClient: false });
                          setGoogleWizardStep(checked ? 2 : 1);
                        }} />
                        <span><strong>YouTube Data API v3를 활성화했습니다</strong><small>앱에서 이 작업을 자동 확인할 수 없어 직접 체크합니다.</small></span>
                      </label>
                    </div>
                  )}
                </section>

                <section className={`wizard-step ${googleSetupChecks.authPlatform ? "is-complete" : ""} ${googleWizardStep === 2 ? "is-active" : ""}`}>
                  <button className="wizard-step-trigger" type="button" disabled={!googleSetupChecks.projectApi} onClick={() => setGoogleWizardStep(2)} aria-expanded={googleWizardStep === 2}>
                    <span className="wizard-step-number">2</span>
                    <span><strong>Google Auth Platform</strong><small>Branding · Audience · Data Access를 설정합니다.</small></span>
                  </button>
                  {googleWizardStep === 2 && (
                    <div className="wizard-step-body">
                      <div className="console-example">
                        <div className="console-example-title"><span>Google Auth Platform</span><strong>찾아야 할 화면 예시</strong></div>
                        <div className="console-mini-screen auth-mini"><div className="console-mini-bar">Google Auth Platform</div><div className="console-mini-tabs"><span>Branding</span><span>Audience</span><span>Data Access</span></div></div>
                        <small>Get Started → Branding / Audience / Data Access</small>
                      </div>
                      <ul className="wizard-checklist">
                        <li>처음이면 <strong>Get Started</strong>로 앱 이름과 연락처를 등록합니다.</li>
                        <li><strong>Audience</strong>가 Testing이면 실제 연결할 Google 계정을 테스트 사용자로 추가해야 할 수 있습니다.</li>
                        <li><strong>Data Access</strong>에서 앱이 요청할 YouTube 권한을 확인합니다.</li>
                      </ul>
                      <div className="scope-box"><span>Subtitle Localizer 요청 scope</span><code>https://www.googleapis.com/auth/youtube.force-ssl</code></div>
                      <p className="wizard-warning">External + Testing 상태에서는 이 범위처럼 기본 프로필 이외의 OAuth 권한을 사용할 때 refresh token이 7일 후 만료될 수 있습니다. 개인 테스트는 다시 승인하면 되고, 장기 운영은 Google의 게시·검증 정책을 확인해야 합니다.</p>
                      <div className="wizard-link-row">
                        <a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noreferrer">Google Auth Platform 열기 ↗</a>
                      </div>
                      <label className="wizard-confirm">
                        <input type="checkbox" checked={googleSetupChecks.authPlatform} onChange={(event) => {
                          const checked = event.target.checked;
                          setGoogleSetupChecks((current) => checked
                            ? { ...current, authPlatform: true }
                            : { ...current, authPlatform: false, oauthClient: false });
                          setGoogleWizardStep(checked ? 3 : 2);
                        }} />
                        <span><strong>Auth Platform 설정을 확인했습니다</strong><small>Branding/Audience/Data Access를 확인한 뒤 진행합니다.</small></span>
                      </label>
                    </div>
                  )}
                </section>

                <section className={`wizard-step ${googleSetupChecks.oauthClient ? "is-complete" : ""} ${googleWizardStep === 3 ? "is-active" : ""}`}>
                  <button className="wizard-step-trigger" type="button" disabled={!googleSetupChecks.authPlatform} onClick={() => setGoogleWizardStep(3)} aria-expanded={googleWizardStep === 3}>
                    <span className="wizard-step-number">3</span>
                    <span><strong>OAuth Web Client 만들기</strong><small>Clients에서 Web application을 만들고 redirect URI를 등록합니다.</small></span>
                  </button>
                  {googleWizardStep === 3 && (
                    <div className="wizard-step-body">
                      <div className="console-example">
                        <div className="console-example-title"><span>Google Auth Platform → Clients</span><strong>찾아야 할 화면 예시</strong></div>
                        <div className="console-mini-screen"><div className="console-mini-bar">Create Client</div><div className="console-mini-form"><span>Application type</span><b>Web application</b><span>Authorized redirect URIs</span><b>https://…/callback</b></div></div>
                        <small>Clients → Create Client → Web application</small>
                      </div>
                      <ul className="wizard-checklist">
                        <li>Application type은 <strong>Web application</strong>을 선택합니다.</li>
                        <li>아래 주소를 <strong>Authorized redirect URIs</strong>에 그대로 추가합니다.</li>
                        <li>프로토콜·도메인·경로·마지막 슬래시까지 정확히 일치해야 합니다.</li>
                      </ul>
                      {youtubeRedirectUri ? (
                        <div className="redirect-box wizard-redirect"><span>Authorized redirect URI</span><code>{youtubeRedirectUri}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(youtubeRedirectUri)}>복사</button></div>
                      ) : <p className="wizard-inline-note">Redirect URI를 확인하고 있습니다.</p>}
                      <div className="wizard-link-row">
                        <a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noreferrer">OAuth Clients 열기 ↗</a>
                      </div>
                      <label className="wizard-confirm">
                        <input type="checkbox" checked={googleSetupChecks.oauthClient} onChange={(event) => {
                          const checked = event.target.checked;
                          setGoogleSetupChecks((current) => ({ ...current, oauthClient: checked }));
                          setGoogleWizardStep(checked ? 4 : 3);
                        }} />
                        <span><strong>Web application Client를 만들었습니다</strong><small>발급된 Client ID와 Client Secret을 다음 단계에서 입력합니다.</small></span>
                      </label>
                    </div>
                  )}
                </section>

                <section className={`wizard-step ${googleWizardStep === 4 ? "is-active" : ""}`}>
                  <button className="wizard-step-trigger" type="button" disabled={!googleSetupChecks.oauthClient} onClick={() => setGoogleWizardStep(4)} aria-expanded={googleWizardStep === 4}>
                    <span className="wizard-step-number">4</span>
                    <span><strong>Google Cloud 설정 저장</strong><small>Client ID/Secret을 저장한 뒤 별도로 Google OAuth 승인을 진행합니다.</small></span>
                  </button>
                  {googleWizardStep === 4 && googleSetupChecks.oauthClient && (
                    <div className="wizard-step-body google-config-form">
                      <div className="field-block compact">
                        <div className="field-row"><label htmlFor="google-client-id">Google OAuth Client ID</label><span>사용자 프로젝트</span></div>
                        <input id="google-client-id" className="text-input" value={googleClientId} onChange={(event) => setGoogleClientId(event.target.value)} autoComplete="off" spellCheck={false} placeholder="...apps.googleusercontent.com" />
                      </div>
                      <div className="field-block compact">
                        <div className="field-row"><label htmlFor="google-client-secret">Google OAuth Client Secret</label><span>브라우저 JS에 재노출 안 함</span></div>
                        <div className="secret-input-row">
                          <input id="google-client-secret" className="text-input" type={showGoogleSecret ? "text" : "password"} value={googleClientSecret} onChange={(event) => setGoogleClientSecret(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Google Client Secret" />
                          <button type="button" className="input-action" onClick={() => setShowGoogleSecret((value) => !value)}>{showGoogleSecret ? "숨기기" : "보기"}</button>
                        </div>
                      </div>
                      <label className="remember-row">
                        <input type="checkbox" checked={rememberGoogle} onChange={(event) => setRememberGoogle(event.target.checked)} />
                        <span><strong>이 브라우저에서 Google 연결 유지</strong><small>Client ID·Secret·토큰을 암호화된 HttpOnly 쿠키로 유지합니다. Google 프로젝트가 Testing이면 Google 정책에 따라 OAuth 갱신 토큰이 더 일찍 만료되어 재승인이 필요할 수 있습니다.</small></span>
                      </label>
                      <div className="cloud-vs-oauth-note"><strong>이 버튼은 Cloud 설정만 저장합니다.</strong><span>저장 후 별도의 `Google로 YouTube 연결` 버튼이 나타나며, 그때 Google 로그인·동의를 진행합니다.</span></div>
                      <button className="primary-button full-width" type="button" disabled={googleConfigSaving || !googleClientId.trim() || !googleClientSecret.trim()} onClick={() => void saveGoogleConfig()}>
                        {googleConfigSaving ? "설정 저장 중…" : "Google Cloud 설정 저장"}
                      </button>
                    </div>
                  )}
                </section>
              </div>
            )}
            {youtubeMessage && <p className="connection-message">{youtubeMessage}</p>}
          </article>
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
                {youtubeStatus === "server-unavailable" && <p className="source-empty">배포 서버에 세션 암호화용 APP_SESSION_SECRET 설정이 필요합니다.</p>}
                {youtubeStatus === "unconfigured" && <div className="source-empty"><strong>본인의 Google Cloud OAuth Client를 먼저 설정해 주세요.</strong><a className="primary-button source-connect" href="#api-connections">API 연결 설정</a></div>}
                {youtubeStatus === "disconnected" && (
                  <div className="source-empty"><strong>YouTube 채널을 먼저 연결해 주세요.</strong><a className="primary-button source-connect" href="/api/youtube/oauth/start">Google로 YouTube 연결</a></div>
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
                <div className="field-block compact cost-note-card">
                  <div className="field-row"><label>API 비용</label><span>사용자 부담</span></div>
                  <p>번역은 위에 입력한 사용자 OpenAI API Key로만 실행됩니다. 운영자 OpenAI 키는 사용하지 않습니다.</p>
                </div>
              </div>
            </details>

            <div className="action-bar">
              <div className="action-meta">
                <span>{selectedLanguages.length}개 언어</span>
                <span>예상 {expectedRequests.toLocaleString()} 요청</span>
                <span>실패 시 완료 청크부터 이어서 재시도</span>
                <span>{openAiConfigured ? "내 OpenAI 키 사용" : "OpenAI 키 연결 필요"}</span>
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

              {activeLanguage && activeStructure && (
                <div className={`quality-panel ${activeStructure.preserved ? "is-pass" : "is-fail"}`}>
                  <div className="quality-panel-head">
                    <div>
                      <span className={`structure-status ${activeStructure.preserved ? "ok" : "bad"}`}>{activeStructure.preserved ? "구조 검증 통과" : "구조 확인 필요"}</span>
                      <p>원본과 번역본의 cue ID와 시작·종료 타임코드를 직접 비교한 결과입니다.</p>
                    </div>
                    <button type="button" onClick={() => downloadSrt(activeLanguage.code)}>{activeLanguage.nativeLabel} SRT 다운로드</button>
                  </div>
                  <div className="structure-metrics" aria-label="자막 구조 검증 결과">
                    <span className={activeStructure.timingMatches === activeStructure.sourceCount ? "ok" : "bad"}><strong>타임코드</strong> {activeStructure.timingMatches}/{activeStructure.sourceCount} 일치</span>
                    <span className={activeStructure.cueIdMatches === activeStructure.sourceCount ? "ok" : "bad"}><strong>Cue ID</strong> {activeStructure.cueIdMatches}/{activeStructure.sourceCount} 일치</span>
                    <span className={activeStructure.missingCueIds.length === 0 ? "ok" : "bad"}><strong>누락</strong> {activeStructure.missingCueIds.length}</span>
                    <span className={activeStructure.unexpectedCueIds.length === 0 ? "ok" : "bad"}><strong>추가</strong> {activeStructure.unexpectedCueIds.length}</span>
                    <span><strong>읽기 길이 참고</strong> {activeWarnings}</span>
                  </div>
                  {!activeStructure.preserved && (
                    <p className="structure-detail">
                      {activeStructure.timingMismatchIds.length > 0 && `타임코드 불일치: ${activeStructure.timingMismatchIds.slice(0, 8).join(", ")}${activeStructure.timingMismatchIds.length > 8 ? "…" : ""} · `}
                      {activeStructure.missingCueIds.length > 0 && `누락 cue: ${activeStructure.missingCueIds.slice(0, 8).join(", ")}${activeStructure.missingCueIds.length > 8 ? "…" : ""} · `}
                      {activeStructure.unexpectedCueIds.length > 0 && `추가 cue: ${activeStructure.unexpectedCueIds.slice(0, 8).join(", ")}${activeStructure.unexpectedCueIds.length > 8 ? "…" : ""} · `}
                      {activeStructure.orderMismatchCount > 0 && `순서 불일치 ${activeStructure.orderMismatchCount}개`}
                    </p>
                  )}
                </div>
              )}

              <div className="comparison-table">
                <div className="comparison-head"><span>원문</span><span>{activeLanguage ? activeLanguage.nativeLabel : "원문"}</span></div>
                {comparisonRows.slice(0, 80).map(({ source, target }) => (
                  <div className="cue-row" key={`${activePreview}-${source.id}`}>
                    <div className="cue-cell">
                      <small>#{source.id}</small>
                      <span className="cue-time-range">{source.start} → {source.end}</span>
                      <p>{source.text}</p>
                    </div>
                    <div className={`cue-cell target ${target ? "" : "is-missing"}`}>
                      {target ? (
                        <>
                          <small>#{target.id}</small>
                          <span className="cue-time-range">{target.start} → {target.end}</span>
                          <p>{target.text}</p>
                        </>
                      ) : (
                        <>
                          <small>#{source.id}</small>
                          <span className="cue-time-range missing">번역 cue 없음</span>
                          <p className="cue-missing-copy">이 cue가 번역 결과에서 누락되었습니다.</p>
                        </>
                      )}
                    </div>
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
            {youtubeStatus === "server-unavailable" && (
              <div className="side-empty"><strong>배포 세션 암호화 설정 필요</strong><p>과금 자격 증명은 필요하지 않습니다. Vercel에 APP_SESSION_SECRET만 설정합니다.</p></div>
            )}
            {youtubeStatus === "unconfigured" && (
              <div className="side-empty"><strong>내 Google 프로젝트 연결</strong><p>YouTube quota가 본인 프로젝트에서 사용되도록 Client ID/Secret을 설정합니다.</p><a className="dark-button full" href="#api-connections">Google 설정하기</a></div>
            )}
            {youtubeStatus === "disconnected" && (
              <div className="side-empty"><strong>내 채널과 연결</strong><p>영상 목록을 불러오고 자막을 올릴 때만 YouTube 권한을 사용합니다.</p><a className="dark-button full" href="/api/youtube/oauth/start">Google로 YouTube 연결</a></div>
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

      <footer className="footer">Subtitle Localizer v1.5.0 · 사용자 API 비용 분리형 다국어 자막 작업 도구</footer>
    </main>
  );
}
