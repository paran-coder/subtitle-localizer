"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Connection = {
  connectionId: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  connectedAt: number;
};

type Video = { id: string; title: string };

export default function WorkspaceChannelBar() {
  const pathname = usePathname();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState("");
  const [connected, setConnected] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [emptyVideos, setEmptyVideos] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState("");
  const [activeConnectionError, setActiveConnectionError] = useState("");

  const active = useMemo(() => connections.find((item) => item.connectionId === activeConnectionId) ?? connections[0] ?? null, [connections, activeConnectionId]);

  const loadStatus = useCallback(async () => {
    if (pathname !== "/") return;
    try {
      const response = await fetch("/api/youtube/status", { cache: "no-store" });
      const data = await response.json() as { connected?: boolean; activeConnectionId?: string; connections?: Connection[]; activeConnectionError?: string };
      setConnected(Boolean(data.connected));
      setConnections(data.connections ?? []);
      setActiveConnectionId(data.activeConnectionId ?? "");
      const statusError = data.activeConnectionError ?? "";
      setActiveConnectionError(statusError);
      if (statusError) setMessage(statusError);
    } catch {
      setConnected(false);
      setActiveConnectionError("");
    }
  }, [pathname]);

  useEffect(() => { void loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (pathname !== "/" || !connected || !activeConnectionId) { setEmptyVideos(false); return; }
    if (activeConnectionError) {
      setEmptyVideos(false);
      setMessage(activeConnectionError);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingVideos(true); setMessage("");
      try {
        const response = await fetch("/api/youtube/videos", { cache: "no-store" });
        const data = await response.json() as { videos?: Video[]; error?: string };
        if (!response.ok) throw new Error(data.error || "영상 목록을 확인하지 못했습니다.");
        if (!cancelled) setEmptyVideos((data.videos ?? []).length === 0);
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "영상 목록을 확인하지 못했습니다.");
      } finally {
        if (!cancelled) setLoadingVideos(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, connected, activeConnectionId, activeConnectionError, refreshKey]);

  async function switchChannel(connectionId: string) {
    if (!connectionId || connectionId === activeConnectionId || switching) return;
    setSwitching(true); setMessage("");
    try {
      const response = await fetch("/api/youtube/channels", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId }), cache: "no-store" });
      const data = await response.json() as { error?: string; activeConnectionId?: string; connections?: Connection[] };
      if (!response.ok) throw new Error(data.error || "채널을 전환하지 못했습니다.");

      const verifyResponse = await fetch("/api/youtube/channels", { cache: "no-store" });
      const verified = await verifyResponse.json() as { error?: string; activeConnectionId?: string; connections?: Connection[] };
      if (!verifyResponse.ok) throw new Error(verified.error || "채널 전환 저장 상태를 확인하지 못했습니다.");
      if (verified.activeConnectionId !== connectionId) throw new Error("채널 전환이 브라우저에 저장되지 않았습니다. 다시 시도해 주세요.");

      setConnections(verified.connections ?? data.connections ?? connections);
      setActiveConnectionId(verified.activeConnectionId);
      setActiveConnectionError("");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "채널을 전환하지 못했습니다.");
      setSwitching(false);
    }
  }

  if (pathname !== "/" || !connected || !active) return null;

  return <aside className="v17-workspace-channel-bar" aria-label="현재 YouTube 작업 채널">
    <div className="v17-workspace-channel-main">
      {active.channelThumbnail ? <img src={active.channelThumbnail} alt="" /> : <span className="v17-channel-avatar placeholder" aria-hidden="true">Y</span>}
      <div className="v17-workspace-channel-copy"><span>현재 YouTube 작업 채널</span><strong>{active.channelTitle}</strong><small>영상 가져오기와 자막 업로드가 이 채널을 사용합니다.</small></div>
      {connections.length > 1 && <label className="v17-channel-select"><span className="sr-only">작업 채널 선택</span><select value={activeConnectionId} disabled={switching} onChange={(event) => void switchChannel(event.target.value)}>{connections.map((connection) => <option value={connection.connectionId} key={connection.connectionId}>{connection.channelTitle}</option>)}</select></label>}
      <a className="v17-secondary" href="/connections?setup=youtube&return=/">+ 계정 또는 채널 추가</a>
      <span className="v17-workspace-version">v1.7.0</span>
    </div>
    {emptyVideos && !loadingVideos && <div className="v17-empty-video"><div><strong>이 채널에는 업로드된 영상이 없습니다.</strong><span>자막 가져오기나 업로드를 하려면 YouTube에 영상을 하나 올린 뒤 다시 불러오세요.</span></div><div><a href="https://studio.youtube.com" target="_blank" rel="noreferrer">YouTube Studio 열기 ↗</a><button type="button" onClick={() => setRefreshKey((value) => value + 1)}>다시 불러오기</button></div></div>}
    {message && <p className="v17-channel-bar-message">{message}</p>}
  </aside>;
}
