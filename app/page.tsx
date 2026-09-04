"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import {
  analyzeCueQuality,
  chunkSubtitleCues,
  durationMs,
  formatDuration,
  hasPreservedTiming,
  MAX_TRANSLATABLE_CUE_CHARS,
  parseSrt,
  replaceCueTexts,
  serializeSrt
} from "@/lib/srt";
import type { LanguageProgress, SubtitleCue, TranslationItem, TranslationStyle } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_CUE_COUNT = 20_000;
const POPULAR_LANGUAGE_CODES = ["ko", "ja", "es", "fr", "de", "pt-BR", "zh-CN", "id"];

const STYLE_OPTIONS: Array<{ value: TranslationStyle; title: string; description: string }> = [
  { value: "natural", title: "자연스러운 YouTube", description: "현지 시청자가 자연스럽게 읽는 표현" },
  { value: "faithful", title: "원문 충실", description: "원문의 의미와 톤을 최대한 보존" },
  { value: "concise", title: "짧고 읽기 쉽게", description: "빠른 영상과 짧은 노출 시간에 적합" },
  { value: "education", title: "교육 / 강의", description: "용어 정확성과 설명 일관성을 우선" },
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
    const isCached = chunk.every((cue) => cache.has(cue.id));
    if (isCached) {
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
        cues: chunk.map(({ id, text }) => ({ id, text })),
        contextBefore,
        contextAfter
      }),
      signal: AbortSignal.timeout(65_000)
    });

    const payload = (await response.json()) as { items?: TranslationItem[]; error?: string };
    if (!response.ok || !payload.items) {
      throw new Error(payload.error || `번역 요청 실패 (${response.status})`);
    }

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
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["ko", "ja"]);
  const [style, setStyle] = useState<TranslationStyle>("natural");
  const [glossary, setGlossary] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [progress, setProgress] = useState<Record<string, LanguageProgress>>({});
  const [results, setResults] = useState<Record<string, SubtitleCue[]>>({});
  const [activePreview, setActivePreview] = useState<string>("source");
  const [running, setRunning] = useState(false);

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

  const progressSummary = useMemo(() => {
    const items = Object.values(progress);
    return {
      done: items.filter((item) => item.status === "done").length,
      error: items.filter((item) => item.status === "error").length,
      total: items.length
    };
  }, [progress]);

  const previewCues = activePreview === "source" ? cues : results[activePreview] ?? [];
  const activeLanguage = activePreview === "source" ? null : getLanguage(activePreview);
  const activeTimingPreserved = activeLanguage && results[activePreview]
    ? hasPreservedTiming(cues, results[activePreview])
    : false;
  const expectedRequests = (stats?.chunks ?? 0) * selectedLanguages.length;

  function clearOutputs() {
    setResults({});
    setProgress({});
    setActivePreview("source");
    partialTranslationsRef.current = {};
  }

  async function loadFile(file?: File) {
    if (running) return;
    setFileError("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".srt")) {
      setFileError(".srt 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseSrt(text);
      if (parsed.length > MAX_CUE_COUNT) {
        throw new Error(`자막은 최대 ${MAX_CUE_COUNT.toLocaleString()}개 cue까지 처리할 수 있습니다.`);
      }
      const oversizedCue = parsed.find((cue) => cue.text.length > MAX_TRANSLATABLE_CUE_CHARS);
      if (oversizedCue) {
        throw new Error(`${oversizedCue.id}번 자막이 ${MAX_TRANSLATABLE_CUE_CHARS.toLocaleString()}자를 초과합니다. 원본 cue를 더 짧게 나눠 주세요.`);
      }
      setCues(parsed);
      setSourceFileName(file.name);
      clearOutputs();
    } catch (error) {
      setCues([]);
      setSourceFileName("");
      clearOutputs();
      setFileError(error instanceof Error ? error.message : "SRT 파일을 읽지 못했습니다.");
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
    const next = selectedLanguages.includes(code)
      ? selectedLanguages.filter((item) => item !== code)
      : [...selectedLanguages, code];
    applyLanguageSelection(next);
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
      const translatedCues = await translateLanguage(
        code,
        cues,
        style,
        glossary,
        accessKey,
        cache,
        (completed, total) => {
          setProgress((current) => ({
            ...current,
            [code]: { ...current[code], completedChunks: completed, totalChunks: total }
          }));
        }
      );
      setResults((current) => ({ ...current, [code]: translatedCues }));
      setProgress((current) => ({
        ...current,
        [code]: { ...current[code], status: "done", completedChunks: totalChunks }
      }));
      setActivePreview((current) => (current === "source" ? code : current));
      return true;
    } catch (error) {
      setProgress((current) => ({
        ...current,
        [code]: {
          ...current[code],
          status: "error",
          error: error instanceof Error ? error.message : "번역 실패"
        }
      }));
      return false;
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
    setActivePreview("source");
    partialTranslationsRef.current = {};

    const initial = Object.fromEntries(
      selectedLanguages.map((code) => [
        code,
        { languageCode: code, status: "queued", completedChunks: 0, totalChunks: chunks.length } satisfies LanguageProgress
      ])
    );
    setProgress(initial);

    // 언어는 2개씩 병렬 처리하고 각 언어 내부의 청크는 순차 처리합니다.
    // 실패 후 재시도 시 성공한 청크를 메모리에 보존해 같은 API 비용을 다시 쓰지 않습니다.
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
    const base = stripExtension(sourceFileName);
    downloadBlob(`\uFEFF${serializeSrt(translatedCues)}`, `${base}.${language.fileSuffix}.srt`);
  }

  async function downloadZip() {
    const completed = Object.entries(results);
    if (!completed.length) return;
    const zip = new JSZip();
    const base = stripExtension(sourceFileName);
    for (const [code, translatedCues] of completed) {
      const language = getLanguage(code);
      if (!language) continue;
      zip.file(`${base}.${language.fileSuffix}.srt`, `\uFEFF${serializeSrt(translatedCues)}`);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${base}-subtitles.zip`, "application/zip");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">SL</span>
          <div>
            <strong>Subtitle Localizer</strong>
            <span>v1.1.0 · YouTube-ready SRT</span>
          </div>
        </div>
        <div className="privacy-badge"><span aria-hidden="true">●</span> 원본 파일 저장 안 함</div>
      </header>

      <section className="hero">
        <p className="eyebrow">MULTILINGUAL SUBTITLE WORKSPACE</p>
        <h1>타임코드는 고정하고,<br />자막만 자연스럽게 현지화합니다.</h1>
        <p className="hero-copy">
          영어 SRT 하나로 여러 언어 자막을 만들고, 구조 검증이 끝난 파일을 YouTube에 바로 업로드할 수 있습니다.
        </p>
        <div className="workflow-strip" aria-label="작업 순서">
          <span><b>01</b> SRT 업로드</span><i>→</i>
          <span><b>02</b> 언어 선택</span><i>→</i>
          <span><b>03</b> AI 현지화</span><i>→</i>
          <span><b>04</b> SRT 다운로드</span>
        </div>
      </section>

      <section className="workspace">
        <div className="main-column">
          <article className="panel">
            <div className="panel-heading">
              <div className="step-number">1</div>
              <div><h2>원본 자막</h2><p>영문 SRT 파일을 불러옵니다.</p></div>
            </div>

            <div
              className={`dropzone ${dragging ? "is-dragging" : ""} ${cues.length ? "has-file" : ""} ${running ? "is-locked" : ""}`}
              onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => { if (!running) inputRef.current?.click(); }}
              role="button"
              aria-disabled={running}
              tabIndex={running ? -1 : 0}
              onKeyDown={(event) => {
                if (!running && (event.key === "Enter" || event.key === " ")) inputRef.current?.click();
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".srt,application/x-subrip,text/plain"
                hidden
                disabled={running}
                onChange={handleFileChange}
              />
              <div className="drop-icon" aria-hidden="true">↑</div>
              {cues.length ? (
                <>
                  <strong>{sourceFileName}</strong>
                  <span>{stats?.count.toLocaleString()} cues · {stats?.duration} · {stats?.chunks} chunks</span>
                  <small>클릭하거나 새 파일을 드롭하면 교체됩니다.</small>
                </>
              ) : (
                <>
                  <strong>SRT 파일을 여기에 드롭하세요</strong>
                  <span>또는 클릭해서 파일 선택</span>
                  <small>최대 5MB · UTF-8 권장</small>
                </>
              )}
            </div>
            {fileError && <div className="inline-error" role="alert">{fileError}</div>}
            {stats && stats.warnings > 0 && (
              <div className="inline-note">
                원본에서 읽기 속도/줄 길이 참고 항목 {stats.warnings}개를 감지했습니다. 원본 타임코드는 자동 수정하지 않습니다.
              </div>
            )}
          </article>

          <article className={`panel ${!cues.length ? "is-disabled" : ""}`}>
            <div className="panel-heading">
              <div className="step-number">2</div>
              <div><h2>현지화 설정</h2><p>대상 언어와 번역 톤을 정합니다.</p></div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label>번역 언어</label>
                <span>{selectedLanguages.length}개 선택</span>
              </div>
              <div className="quick-actions" aria-label="언어 빠른 선택">
                <button type="button" disabled={!cues.length || running} onClick={() => applyLanguageSelection(POPULAR_LANGUAGE_CODES)}>추천 8개</button>
                <button type="button" disabled={!cues.length || running} onClick={() => applyLanguageSelection(LANGUAGES.map((language) => language.code))}>전체 선택</button>
                <button type="button" disabled={!cues.length || running} onClick={() => applyLanguageSelection([])}>선택 해제</button>
              </div>
              <div className="language-grid">
                {LANGUAGES.map((language) => {
                  const checked = selectedLanguages.includes(language.code);
                  return (
                    <button
                      key={language.code}
                      type="button"
                      className={`language-chip ${checked ? "selected" : ""}`}
                      aria-pressed={checked}
                      disabled={!cues.length || running}
                      onClick={() => toggleLanguage(language.code)}
                    >
                      <span className="checkmark">{checked ? "✓" : ""}</span>
                      <span><strong>{language.nativeLabel}</strong><small>{language.label}</small></span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field-group">
              <label>번역 스타일</label>
              <div className="style-grid">
                {STYLE_OPTIONS.map((option) => (
                  <label key={option.value} className={`style-card ${style === option.value ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="style"
                      value={option.value}
                      checked={style === option.value}
                      disabled={!cues.length || running}
                      onChange={() => changeStyle(option.value)}
                    />
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-grid">
              <div className="field-group">
                <div className="field-label-row"><label htmlFor="glossary">Glossary</label><span>선택</span></div>
                <textarea
                  id="glossary"
                  rows={5}
                  maxLength={8000}
                  disabled={!cues.length || running}
                  value={glossary}
                  onChange={(event) => changeGlossary(event.target.value)}
                  placeholder={"OpenAI = OpenAI\nChatGPT = ChatGPT\nprompt = 프롬프트"}
                />
                <small className="field-help">브랜드명, 인명, 전문용어 규칙을 한 줄씩 입력합니다.</small>
              </div>

              <div className="field-group">
                <div className="field-label-row"><label htmlFor="access-key">배포 보호 키</label><span>Vercel 운영 시 필요</span></div>
                <input
                  id="access-key"
                  className="text-input"
                  type="password"
                  autoComplete="off"
                  maxLength={200}
                  disabled={!cues.length || running}
                  value={accessKey}
                  onChange={(event) => setAccessKey(event.target.value)}
                  placeholder="SUBTITLE_APP_ACCESS_KEY"
                />
                <small className="field-help">브라우저 메모리에만 유지하며 저장하지 않습니다. 로컬 개발에서는 서버 설정에 따라 생략할 수 있습니다.</small>
              </div>
            </div>

            <div className="run-summary">
              <div><span>대상 언어</span><strong>{selectedLanguages.length}개</strong></div>
              <div><span>예상 API 요청</span><strong>{expectedRequests.toLocaleString()}회</strong></div>
              <div><span>재시도 비용 절감</span><strong>완료 청크 유지</strong></div>
            </div>

            <button
              className="primary-button"
              type="button"
              disabled={!cues.length || !selectedLanguages.length || running}
              onClick={() => void startTranslation()}
            >
              {running ? "번역 진행 중…" : `${selectedLanguages.length || 0}개 언어 번역 시작`}
            </button>
          </article>

          {(running || Object.keys(progress).length > 0) && (
            <article className="panel">
              <div className="panel-heading split-heading">
                <div className="heading-group">
                  <div className="step-number">3</div>
                  <div><h2>번역 진행</h2><p>실패한 언어는 완료된 청크 다음부터 이어서 재시도합니다.</p></div>
                </div>
                <div className="progress-summary">완료 {progressSummary.done}/{progressSummary.total}{progressSummary.error ? ` · 실패 ${progressSummary.error}` : ""}</div>
              </div>
              <div className="progress-list" aria-live="polite">
                {selectedLanguages.map((code) => {
                  const language = getLanguage(code);
                  const item = progress[code];
                  if (!language || !item) return null;
                  const percent = item.totalChunks ? Math.round((item.completedChunks / item.totalChunks) * 100) : 0;
                  return (
                    <div className="progress-item" key={code}>
                      <div className="progress-meta">
                        <div><strong>{language.nativeLabel}</strong><span>{language.label}</span></div>
                        <div className="status-actions">
                          {item.status === "done" && <button type="button" className="mini-download" onClick={() => downloadSrt(code)}>SRT</button>}
                          <span className={`status status-${item.status}`}>
                            {item.status === "queued" && "대기"}
                            {item.status === "translating" && `${percent}%`}
                            {item.status === "done" && "완료"}
                            {item.status === "error" && "실패"}
                          </span>
                        </div>
                      </div>
                      <div className="progress-track"><span style={{ width: `${item.status === "done" ? 100 : percent}%` }} /></div>
                      {item.error && (
                        <div className="progress-error-row">
                          <small className="progress-error">{item.error}</small>
                          <button type="button" className="retry-button" disabled={running} onClick={() => void retryLanguage(code)}>이어 재시도</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {Object.keys(results).length > 1 && (
                <button className="secondary-full-button" type="button" disabled={running} onClick={() => void downloadZip()}>
                  완료된 {Object.keys(results).length}개 언어 ZIP 다운로드
                </button>
              )}
            </article>
          )}
        </div>

        <aside className="preview-column">
          <div className="preview-panel">
            <div className="preview-header">
              <div><p className="eyebrow">QUALITY PREVIEW</p><h2>원문 ↔ 번역 비교</h2></div>
              {Object.keys(results).length > 0 && (
                <button className="secondary-button" type="button" onClick={() => void downloadZip()}>ZIP</button>
              )}
            </div>

            {cues.length ? (
              <>
                <div className="preview-tabs" role="tablist" aria-label="자막 미리보기 언어">
                  <button role="tab" aria-selected={activePreview === "source"} className={activePreview === "source" ? "active" : ""} onClick={() => setActivePreview("source")}>EN 원본</button>
                  {Object.keys(results).map((code) => (
                    <button role="tab" aria-selected={activePreview === code} key={code} className={activePreview === code ? "active" : ""} onClick={() => setActivePreview(code)}>
                      {code}
                    </button>
                  ))}
                </div>

                <div className="preview-status">
                  {activeLanguage ? (
                    <>
                      <span className={activeTimingPreserved ? "ok-dot" : "error-dot"} aria-hidden="true" />
                      <strong>{activeTimingPreserved ? "구조 검증 통과" : "구조 확인 필요"}</strong>
                      <span>· {activeLanguage.nativeLabel}</span>
                    </>
                  ) : (
                    <><span className="neutral-dot" aria-hidden="true" /><strong>원본 SRT</strong><span>· {cues.length.toLocaleString()} cues</span></>
                  )}
                </div>

                <div className="cue-list">
                  {previewCues.slice(0, 80).map((cue, index) => {
                    const sourceCue = cues[index];
                    return (
                      <div className={`cue-row ${activeLanguage ? "is-comparison" : ""}`} key={cue.id}>
                        <div className="cue-index">{cue.id}</div>
                        <div className="cue-body">
                          <time>{cue.start} → {cue.end}</time>
                          {activeLanguage ? (
                            <div className="comparison-copy">
                              <div><small>EN</small><p>{sourceCue?.text}</p></div>
                              <div><small>{activeLanguage.code.toUpperCase()}</small><p>{cue.text}</p></div>
                            </div>
                          ) : (
                            <p>{cue.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {previewCues.length > 80 && <div className="preview-limit">성능을 위해 처음 80개 cue만 미리보기로 표시합니다.</div>}
                </div>

                {activePreview !== "source" && results[activePreview] && (
                  <button className="download-button" type="button" onClick={() => downloadSrt(activePreview)}>
                    {getLanguage(activePreview)?.nativeLabel} SRT 다운로드
                  </button>
                )}
              </>
            ) : (
              <div className="empty-preview">
                <span>01</span>
                <p>SRT를 업로드하면<br />원문과 번역을 나란히 검수할 수 있습니다.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      <footer>
        <span>Subtitle Localizer v1.1.0</span>
        <span>원본 파일은 브라우저에서 읽고, 번역에 필요한 텍스트만 서버 API로 전송합니다.</span>
      </footer>
    </main>
  );
}
