"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import { LANGUAGES, getLanguage } from "@/lib/languages";
import {
  analyzeCueQuality,
  chunkCues,
  durationMs,
  formatDuration,
  parseSrt,
  replaceCueTexts,
  serializeSrt
} from "@/lib/srt";
import type { LanguageProgress, SubtitleCue, TranslationItem, TranslationStyle } from "@/lib/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CHUNK_SIZE = 32;

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
  URL.revokeObjectURL(url);
}

function stripExtension(filename: string) {
  return filename.replace(/\.srt$/i, "") || "subtitles";
}

async function translateLanguage(
  languageCode: string,
  cues: SubtitleCue[],
  style: TranslationStyle,
  glossary: string,
  onProgress: (completed: number, total: number) => void
): Promise<SubtitleCue[]> {
  const chunks = chunkCues(cues, CHUNK_SIZE);
  const translated: TranslationItem[] = [];

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    const firstCueIndex = cues.findIndex((cue) => cue.id === chunk[0].id);
    const lastCueIndex = cues.findIndex((cue) => cue.id === chunk[chunk.length - 1].id);
    const contextBefore = cues.slice(Math.max(0, firstCueIndex - 2), firstCueIndex).map(({ id, text }) => ({ id, text }));
    const contextAfter = cues.slice(lastCueIndex + 1, lastCueIndex + 3).map(({ id, text }) => ({ id, text }));

    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languageCode,
        style,
        glossary,
        cues: chunk.map(({ id, text }) => ({ id, text })),
        contextBefore,
        contextAfter
      })
    });

    const payload = (await response.json()) as { items?: TranslationItem[]; error?: string };
    if (!response.ok || !payload.items) {
      throw new Error(payload.error || `번역 요청 실패 (${response.status})`);
    }
    translated.push(...payload.items);
    onProgress(index + 1, chunks.length);
  }

  return replaceCueTexts(cues, translated);
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sourceFileName, setSourceFileName] = useState("");
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["ko", "ja"]);
  const [style, setStyle] = useState<TranslationStyle>("natural");
  const [glossary, setGlossary] = useState("");
  const [progress, setProgress] = useState<Record<string, LanguageProgress>>({});
  const [results, setResults] = useState<Record<string, SubtitleCue[]>>({});
  const [activePreview, setActivePreview] = useState<string>("source");
  const [running, setRunning] = useState(false);

  const stats = useMemo(() => {
    if (!cues.length) return null;
    const quality = cues.map(analyzeCueQuality);
    return {
      count: cues.length,
      duration: formatDuration(durationMs(cues)),
      warnings: quality.reduce((sum, cue) => sum + cue.warnings.length, 0)
    };
  }, [cues]);

  const previewCues = activePreview === "source" ? cues : results[activePreview] ?? [];

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
      setCues(parsed);
      setSourceFileName(file.name);
      setResults({});
      setProgress({});
      setActivePreview("source");
    } catch (error) {
      setCues([]);
      setSourceFileName("");
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

  function toggleLanguage(code: string) {
    if (running) return;
    setSelectedLanguages((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  }

  async function runOneLanguage(code: string, totalChunks: number) {
    setProgress((current) => ({
      ...current,
      [code]: { languageCode: code, status: "translating", completedChunks: 0, totalChunks }
    }));
    try {
      const translatedCues = await translateLanguage(code, cues, style, glossary, (completed, total) => {
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
    const totalChunks = chunkCues(cues, CHUNK_SIZE).length;
    await runOneLanguage(code, totalChunks);
    setRunning(false);
  }

  async function startTranslation() {
    if (!cues.length || !selectedLanguages.length || running) return;
    setRunning(true);
    setResults({});
    setActivePreview("source");
    const totalChunks = chunkCues(cues, CHUNK_SIZE).length;
    const initial = Object.fromEntries(
      selectedLanguages.map((code) => [
        code,
        { languageCode: code, status: "queued", completedChunks: 0, totalChunks } satisfies LanguageProgress
      ])
    );
    setProgress(initial);

    // 언어를 2개씩 처리해 과도한 API 동시 호출을 피합니다.
    const queue = [...selectedLanguages];
    const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
      while (queue.length) {
        const code = queue.shift();
        if (!code) return;
        await runOneLanguage(code, totalChunks);
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
            <span>v1.0.0</span>
          </div>
        </div>
        <div className="header-note">YouTube-ready multilingual SRT</div>
      </header>

      <section className="hero">
        <p className="eyebrow">SRT LOCALIZATION WORKSPACE</p>
        <h1>타임스탬프는 그대로.<br />자막만 자연스럽게 다국어로.</h1>
        <p className="hero-copy">
          영어 SRT를 올리고 번역 언어를 선택하면, 자막 번호와 시간을 보존한 YouTube용 SRT를 생성합니다.
        </p>
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
              tabIndex={0}
              onKeyDown={(event) => { if (!running && (event.key === "Enter" || event.key === " ")) inputRef.current?.click(); }}
            >
              <input ref={inputRef} type="file" accept=".srt,application/x-subrip,text/plain" hidden disabled={running} onChange={handleFileChange} />
              <div className="drop-icon" aria-hidden="true">↑</div>
              {cues.length ? (
                <>
                  <strong>{sourceFileName}</strong>
                  <span>{stats?.count.toLocaleString()} cues · {stats?.duration}</span>
                  <small>다른 파일로 교체하려면 클릭하거나 드롭하세요.</small>
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
              <div className="inline-note">원본 자막에서 읽기 속도/줄 길이 관련 참고 항목 {stats.warnings}개를 감지했습니다. 타임코드는 자동 수정하지 않습니다.</div>
            )}
          </article>

          <article className={`panel ${!cues.length ? "is-disabled" : ""}`}>
            <div className="panel-heading">
              <div className="step-number">2</div>
              <div><h2>번역 설정</h2><p>언어와 자막 톤을 선택합니다.</p></div>
            </div>

            <div className="field-group">
              <div className="field-label-row">
                <label>번역 언어</label>
                <span>{selectedLanguages.length}개 선택</span>
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
                      onChange={() => setStyle(option.value)}
                    />
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="field-group">
              <div className="field-label-row"><label htmlFor="glossary">Glossary</label><span>선택 사항</span></div>
              <textarea
                id="glossary"
                rows={5}
                maxLength={8000}
                disabled={!cues.length || running}
                value={glossary}
                onChange={(event) => setGlossary(event.target.value)}
                placeholder={"OpenAI = OpenAI\nChatGPT = ChatGPT\nprompt = 프롬프트"}
              />
              <small className="field-help">브랜드명, 인명, 전문용어 등 번역 규칙을 한 줄씩 적어 주세요.</small>
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
              <div className="panel-heading">
                <div className="step-number">3</div>
                <div><h2>번역 진행</h2><p>언어별 진행 상태를 확인할 수 있습니다.</p></div>
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
                        <span className={`status status-${item.status}`}>
                          {item.status === "queued" && "대기"}
                          {item.status === "translating" && `${percent}%`}
                          {item.status === "done" && "완료"}
                          {item.status === "error" && "실패"}
                        </span>
                      </div>
                      <div className="progress-track"><span style={{ width: `${item.status === "done" ? 100 : percent}%` }} /></div>
                      {item.error && (
                        <div className="progress-error-row">
                          <small className="progress-error">{item.error}</small>
                          <button type="button" className="retry-button" disabled={running} onClick={() => void retryLanguage(code)}>재시도</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          )}
        </div>

        <aside className="preview-column">
          <div className="preview-panel">
            <div className="preview-header">
              <div><p className="eyebrow">PREVIEW</p><h2>자막 미리보기</h2></div>
              {Object.keys(results).length > 0 && (
                <button className="secondary-button" type="button" onClick={() => void downloadZip()}>ZIP 다운로드</button>
              )}
            </div>

            {cues.length ? (
              <>
                <div className="preview-tabs" role="tablist">
                  <button className={activePreview === "source" ? "active" : ""} onClick={() => setActivePreview("source")}>EN 원본</button>
                  {Object.keys(results).map((code) => (
                    <button key={code} className={activePreview === code ? "active" : ""} onClick={() => setActivePreview(code)}>
                      {code}
                    </button>
                  ))}
                </div>
                <div className="cue-list">
                  {previewCues.slice(0, 80).map((cue) => (
                    <div className="cue-row" key={cue.id}>
                      <div className="cue-index">{cue.id}</div>
                      <div className="cue-body">
                        <time>{cue.start} → {cue.end}</time>
                        <p>{cue.text}</p>
                      </div>
                    </div>
                  ))}
                  {previewCues.length > 80 && <div className="preview-limit">미리보기는 처음 80개 cue만 표시합니다.</div>}
                </div>
                {activePreview !== "source" && results[activePreview] && (
                  <button className="download-button" type="button" onClick={() => downloadSrt(activePreview)}>
                    {getLanguage(activePreview)?.nativeLabel} SRT 다운로드
                  </button>
                )}
              </>
            ) : (
              <div className="empty-preview"><span>01</span><p>SRT를 업로드하면<br />원본 자막이 여기에 표시됩니다.</p></div>
            )}
          </div>
        </aside>
      </section>

      <footer>
        <span>Subtitle Localizer v1.0.0</span>
        <span>파일은 브라우저에서 읽고, 번역할 텍스트만 서버 API로 전송합니다.</span>
      </footer>
    </main>
  );
}
