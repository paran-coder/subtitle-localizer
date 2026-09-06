"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/guide", label: "초기 설정" },
  { href: "/connections", label: "연결 관리" },
  { href: "/", label: "작업하기" }
] as const;

export default function PrimarySectionNav() {
  const pathname = usePathname();
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);
  const isPrimaryPage = pathname === "/" || pathname === "/guide" || pathname === "/connections";

  useEffect(() => {
    if (!isPrimaryPage) return;
    let cancelled = false;

    void (async () => {
      const [openAiResult, youtubeResult] = await Promise.allSettled([
        fetch("/api/openai/credential", { cache: "no-store" }),
        fetch("/api/youtube/status", { cache: "no-store" })
      ]);

      if (cancelled) return;

      if (openAiResult.status === "fulfilled") {
        const data = await openAiResult.value.json() as { configured?: boolean };
        if (!cancelled) setOpenAiConfigured(Boolean(data.configured));
      }

      if (youtubeResult.status === "fulfilled") {
        const data = await youtubeResult.value.json() as { connected?: boolean };
        if (!cancelled) setYoutubeConnected(Boolean(data.connected));
      }
    })();

    return () => { cancelled = true; };
  }, [isPrimaryPage, pathname]);

  if (!isPrimaryPage) return null;

  return (
    <>
      <header className="primary-titlebar">
        <div className="primary-titlebar-inner">
          <a className="primary-titlebar-brand" href="/" aria-label="Subtitle Localizer 작업하기">
            <span className="primary-titlebar-symbol" aria-hidden="true">S</span>
            <span><strong>Subtitle Localizer</strong><small>v1.7.0</small></span>
          </a>
          <div className="primary-titlebar-actions">
            <span className="primary-titlebar-privacy">파일을 서버에 저장하지 않습니다</span>
            <span className={`primary-status-pill ${openAiConfigured ? "is-ready" : ""}`}>OpenAI {openAiConfigured ? "✓" : "○"}</span>
            <span className={`primary-status-pill ${youtubeConnected ? "is-ready" : ""}`}>YouTube {youtubeConnected ? "✓" : "○"}</span>
          </div>
        </div>
      </header>
      <nav className="primary-section-nav" aria-label="주요 화면">
        {SECTIONS.map((section) => {
          const active = pathname === section.href;
          return (
            <a
              key={section.href}
              href={section.href}
              className={active ? "is-active" : ""}
              aria-current={active ? "page" : undefined}
            >
              {section.label}
            </a>
          );
        })}
      </nav>
    </>
  );
}
