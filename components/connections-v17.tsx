"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type YouTubeStatus = "checking" | "server-unavailable" | "unconfigured" | "disconnected" | "connected";
type YouTubeConnection = {
  connectionId: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail?: string;
  connectedAt: number;
};

type StaticStep = {
  title: string;
  eyebrow: string;
  summary: string;
  href: string;
  cta: string;
  instructions: ReactNode;
};

const PROJECT_NAME = "Subtitle Localizer";
const CLIENT_NAME = "Subtitle Localizer Web";
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";
const APP_URL = "https://subtitle-localizer.vercel.app/";
const PRIVACY_URL = "https://subtitle-localizer.vercel.app/privacy";
const TERMS_URL = "https://subtitle-localizer.vercel.app/terms";
const FALLBACK_REDIRECT = "https://subtitle-localizer.vercel.app/api/youtube/oauth/callback";

const STEP_TITLES = [
  "전용 프로젝트 만들기",
  "YouTube API 켜기",
  "앱 기본 정보와 공개 링크",
  "추가 계정을 위한 상태 설정",
  "YouTube 권한 추가",
  "OAuth Client 만들기",
  "Client 정보 저장",
  "첫 YouTube 채널 연결"
];

const STATIC_STEPS: Record<number, StaticStep> = {
  1: {
    title: STEP_TITLES[0], eyebrow: "PROJECT", summary: "기존 프로젝트를 건드리지 않고 전용 프로젝트 하나를 만듭니다.",
    href: "https://console.cloud.google.com/projectcreate", cta: "새 프로젝트 화면 열기 ↗",
    instructions: <><p><b>프로젝트 이름</b>에 <code>{PROJECT_NAME}</code>를 입력하고 <b>만들기</b>를 누르세요.</p><p>생성이 끝난 뒤 화면 위 프로젝트 선택기에서 방금 만든 <b>{PROJECT_NAME}</b>를 다시 선택하세요. 기존 프로젝트가 선택된 채로 다음 단계로 넘어가지 마세요.</p></>
  },
  2: {
    title: STEP_TITLES[1], eyebrow: "YOUTUBE API", summary: "YouTube Data API v3 하나만 켭니다.",
    href: "https://console.cloud.google.com/apis/library/youtube.googleapis.com", cta: "YouTube Data API v3 열기 ↗",
    instructions: <><p>오른쪽 위 프로젝트가 <b>{PROJECT_NAME}</b>인지 먼저 확인하세요.</p><p><b>사용 설정</b>을 누른 뒤 화면에 <b>사용 설정됨</b> 또는 <b>Enabled</b>가 보이면 끝입니다.</p></>
  },
  3: {
    title: STEP_TITLES[2], eyebrow: "APP INFO · BRANDING", summary: "기본 정보와 공개 링크를 한 번에 채워 앱 게시 준비를 끝냅니다.",
    href: "https://console.cloud.google.com/auth/overview", cta: "Google Auth Platform 열기 ↗",
    instructions: <><p>처음이면 <b>시작하기</b>를 누르세요. 앱 이름은 <code>{PROJECT_NAME}</code>, 사용자 유형은 <b>외부 · External</b>로 선택합니다. 지원 이메일과 개발자 연락처에는 본인이 사용하는 이메일을 선택·입력합니다.</p><p>생성 후 왼쪽 <b>브랜딩</b>에서 앱 도메인에 아래 세 주소를 그대로 넣고 저장하세요. 이미 앱 이름·이메일·승인된 도메인을 설정했다면 다시 입력할 필요가 없습니다.</p><CopyRow label="애플리케이션 홈페이지" value={APP_URL} /><CopyRow label="개인정보처리방침" value={PRIVACY_URL} /><CopyRow label="서비스 약관" value={TERMS_URL} /></>
  },
  4: {
    title: STEP_TITLES[3], eyebrow: "PUBLISHING", summary: "새 Google 계정이 차단되지 않도록 게시 상태를 정리합니다.",
    href: "https://console.cloud.google.com/auth/audience", cta: "Audience 열기 ↗",
    instructions: <><p>상단이 <b>테스트 중</b>이면 기존 Test user가 아닌 Google 계정은 <code>403 access_denied</code>로 차단될 수 있습니다.</p><p><b>추천: In Production</b>으로 전환하세요. <b>앱 게시</b>가 비활성화되어 있다면 3단계의 Branding 정보와 공개 URL 저장을 먼저 완료하세요.</p><details className="v17-inline-details"><summary>Testing으로 계속 사용하려면</summary><p>실제로 로그인할 Google 계정을 Test users에 추가해야 합니다. 추가 계정이 생기면 이 화면에 다시 와야 할 수 있습니다. 검증 신청 자체는 이번 설정의 필수 조건으로 두지 않습니다.</p></details></>
  },
  5: {
    title: STEP_TITLES[4], eyebrow: "DATA ACCESS", summary: "Subtitle Localizer가 쓰는 YouTube 권한 하나만 추가합니다.",
    href: "https://console.cloud.google.com/auth/scopes", cta: "Data Access 열기 ↗",
    instructions: <><p><b>범위 추가 또는 삭제</b>를 누른 뒤 아래 scope를 직접 입력하세요.</p><CopyRow label="추가할 권한" value={YOUTUBE_SCOPE} /><p>체크한 뒤 <b>업데이트</b>하고, 본 화면으로 돌아와 <b>저장</b>까지 누르세요. 저장 후 변경사항이 없음 상태면 완료입니다.</p></>
  },
  6: {
    title: STEP_TITLES[5], eyebrow: "OAUTH CLIENT", summary: "Web application Client를 만들고 callback 주소를 정확한 칸에 넣습니다.",
    href: "https://console.cloud.google.com/auth/clients", cta: "Clients 열기 ↗",
    instructions: <><p><b>+ 클라이언트 만들기</b> → <b>웹 애플리케이션</b>을 선택하고 이름은 <code>{CLIENT_NAME}</code>로 입력하세요.</p><div className="v17-do-dont"><div className="dont"><span>비워두세요</span><strong>승인된 JavaScript 원본</strong><p>여기에는 아무 주소도 넣지 않습니다.</p></div><div className="do"><span>여기에 붙여넣기</span><strong>승인된 리디렉션 URI</strong><p>아래 callback 주소만 추가합니다.</p></div></div></>
  }
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return <div className="v17-copy-row"><div><span>{label}</span><code>{value}</code></div><button type="button" onClick={() => { void navigator.clipboard?.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>{copied ? "복사됨 ✓" : "복사"}</button></div>;
}

function Progress({ step }: { step: number }) {
  return <div className="v17-progress" aria-label={`Google 설정 ${step}/8 단계`}>{STEP_TITLES.map((title, index) => { const number = index + 1; return <div key={title} className={number === step ? "active" : number < step ? "complete" : ""}><span>{number < step ? "✓" : number}</span><small>{title}</small></div>; })}</div>;
}

function ChannelAvatar({ connection }: { connection: YouTubeConnection }) {
  return connection.channelThumbnail ? <img className="v17-channel-avatar" src={connection.channelThumbnail} alt="" /> : <span className="v17-channel-avatar placeholder" aria-hidden="true">Y</span>;
}

function PublishingGuide() {
  return <div className="v17-publishing-guide">
    <div className="v17-important"><strong>추가 Google 계정 연결 전 Publishing 상태를 한 번 확인하세요.</strong><span>앱은 OAuth Client 저장 여부는 확인할 수 있지만 Google Console의 실제 게시 상태까지 자동 판별하지는 못합니다. Testing이면 새 계정이 403 access_denied로 차단될 수 있습니다.</span></div>
    <div className="v17-publishing-links"><CopyRow label="홈페이지" value={APP_URL} /><CopyRow label="개인정보처리방침" value={PRIVACY_URL} /><CopyRow label="서비스 약관" value={TERMS_URL} /></div>
    <div className="v17-actions"><a className="v17-secondary" target="_blank" rel="noreferrer" href="https://console.cloud.google.com/auth/branding">Branding 확인 ↗</a><a className="v17-secondary" target="_blank" rel="noreferrer" href="https://console.cloud.google.com/auth/audience">Audience / 게시 상태 확인 ↗</a></div>
  </div>;
}

export default function ConnectionsV17() {
  const [openAiKey, setOpenAiKey] = useState("");
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [openAiServerConfigured, setOpenAiServerConfigured] = useState(true);
  const [rememberOpenAi, setRememberOpenAi] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [openAiSaving, setOpenAiSaving] = useState(false);
  const [openAiMessage, setOpenAiMessage] = useState("");

  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>("checking");
  const [redirectUri, setRedirectUri] = useState(FALLBACK_REDIRECT);
  const [rememberGoogle, setRememberGoogle] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [googleSaving, setGoogleSaving] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState("");
  const [connections, setConnections] = useState<YouTubeConnection[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState("");
  const [channelBusy, setChannelBusy] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [confirmed, setConfirmed] = useState<Record<number, boolean>>({});
  const [showFinalWizardStep, setShowFinalWizardStep] = useState(false);
  const [returnPath, setReturnPath] = useState("/");

  const activeConnection = useMemo(() => connections.find((item) => item.connectionId === activeConnectionId) ?? connections[0] ?? null, [connections, activeConnectionId]);

  const loadYouTube = useCallback(async () => {
    try {
      const response = await fetch("/api/youtube/status", { cache: "no-store" });
      const data = await response.json() as { serverConfigured?: boolean; configured?: boolean; connected?: boolean; remember?: boolean; redirectUri?: string; activeConnectionId?: string; connections?: YouTubeConnection[]; migrated?: boolean; migrationFailed?: boolean };
      setRedirectUri(data.redirectUri || FALLBACK_REDIRECT);
      setRememberGoogle(Boolean(data.remember));
      setConnections(data.connections ?? []);
      setActiveConnectionId(data.activeConnectionId ?? "");
      const next: YouTubeStatus = !data.serverConfigured ? "server-unavailable" : !data.configured ? "unconfigured" : data.connected ? "connected" : "disconnected";
      setYoutubeStatus(next);
      if (data.migrated) setYoutubeMessage("기존 YouTube 연결을 다중 채널 구조로 자동 전환했습니다.");
      if (data.migrationFailed) setYoutubeMessage("기존 Cloud 설정은 그대로 유지했습니다. YouTube 채널만 한 번 다시 연결해 주세요.");
    } catch {
      setYoutubeStatus("server-unavailable");
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedReturn = params.get("return");
    if (requestedReturn?.startsWith("/")) setReturnPath(requestedReturn);
    const result = params.get("youtube");
    const messages: Record<string, string> = {
      connected: "YouTube 채널을 연결했습니다. 같은 Cloud Client로 다른 채널도 계속 추가할 수 있습니다.",
      denied: "Google 권한 승인이 취소되었습니다. 준비가 되면 다시 연결해 주세요.",
      "invalid-state": "연결 요청이 만료되었습니다. 계정 또는 채널 추가를 다시 눌러 주세요.",
      "token-error": "Client 정보 또는 Google 승인 상태를 확인해 주세요.",
      "client-not-configured": "먼저 Google Cloud Client 설정을 완료해 주세요.",
      "server-not-configured": "배포 서버에 APP_SESSION_SECRET 설정이 필요합니다.",
      "no-channel": "선택한 Google 계정에 YouTube 채널이 없습니다. YouTube에서 채널을 만든 뒤 다시 연결해 주세요.",
      "channel-error": "Google 승인은 완료됐지만 YouTube 채널을 확인하지 못했습니다. 다시 연결해 주세요."
    };
    if (result && messages[result]) setYoutubeMessage(messages[result]);

    void (async () => {
      try {
        const response = await fetch("/api/openai/credential", { cache: "no-store" });
        const data = await response.json() as { serverConfigured?: boolean; configured?: boolean; remember?: boolean };
        setOpenAiServerConfigured(Boolean(data.serverConfigured));
        setOpenAiConfigured(Boolean(data.configured));
        setRememberOpenAi(Boolean(data.remember));
      } catch { setOpenAiServerConfigured(false); }
    })();
    void loadYouTube();
  }, [loadYouTube]);

  async function saveOpenAi() {
    const apiKey = openAiKey.trim();
    if (!apiKey || openAiSaving) return;
    setOpenAiSaving(true); setOpenAiMessage("");
    try {
      const response = await fetch("/api/openai/credential", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, remember: rememberOpenAi }), cache: "no-store" });
      const data = await response.json() as { error?: string; remember?: boolean };
      if (!response.ok) throw new Error(data.error || "OpenAI API Key를 저장하지 못했습니다.");
      setOpenAiConfigured(true); setRememberOpenAi(Boolean(data.remember)); setOpenAiKey(""); setOpenAiMessage("OpenAI 키를 암호화된 HttpOnly 쿠키에 저장했습니다.");
    } catch (error) { setOpenAiMessage(error instanceof Error ? error.message : "OpenAI API Key를 저장하지 못했습니다."); }
    finally { setOpenAiSaving(false); }
  }

  async function forgetOpenAi() {
    await fetch("/api/openai/credential", { method: "DELETE" });
    setOpenAiConfigured(false); setRememberOpenAi(false); setOpenAiKey(""); setOpenAiMessage("저장된 OpenAI 키를 지웠습니다.");
  }

  async function saveGoogleConfig() {
    const clientId = googleClientId.trim(); const clientSecret = googleClientSecret.trim();
    if (!clientId || !clientSecret || googleSaving) return;
    setGoogleSaving(true); setYoutubeMessage("");
    try {
      const response = await fetch("/api/youtube/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId, clientSecret, remember: rememberGoogle }), cache: "no-store" });
      const data = await response.json() as { error?: string; redirectUri?: string };
      if (!response.ok) throw new Error(data.error || "Google Cloud 설정을 저장하지 못했습니다.");
      setRedirectUri(data.redirectUri || redirectUri); setGoogleClientSecret(""); setConnections([]); setActiveConnectionId(""); setYoutubeStatus("disconnected"); setWizardStep(8); setShowFinalWizardStep(true); setYoutubeMessage("Cloud Client를 저장했습니다. 마지막으로 첫 YouTube 채널을 연결하세요.");
    } catch (error) { setYoutubeMessage(error instanceof Error ? error.message : "Google Cloud 설정을 저장하지 못했습니다."); }
    finally { setGoogleSaving(false); }
  }

  async function forgetGoogle() {
    await fetch("/api/youtube/config", { method: "DELETE" });
    setYoutubeStatus("unconfigured"); setConnections([]); setActiveConnectionId(""); setGoogleClientId(""); setGoogleClientSecret(""); setRememberGoogle(false); setWizardStep(1); setConfirmed({}); setShowFinalWizardStep(false); setYoutubeMessage("Google Cloud Client 설정과 모든 YouTube 채널 연결을 지웠습니다.");
  }

  async function selectChannel(connectionId: string) {
    if (channelBusy || connectionId === activeConnectionId) return;
    setChannelBusy(connectionId);
    try {
      const response = await fetch("/api/youtube/channels", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connectionId }), cache: "no-store" });
      const data = await response.json() as { error?: string; activeConnectionId?: string; connections?: YouTubeConnection[] };
      if (!response.ok) throw new Error(data.error || "채널을 전환하지 못했습니다.");
      setActiveConnectionId(data.activeConnectionId || connectionId); setConnections(data.connections ?? connections); setYoutubeMessage("현재 작업 채널을 변경했습니다.");
    } catch (error) { setYoutubeMessage(error instanceof Error ? error.message : "채널을 전환하지 못했습니다."); }
    finally { setChannelBusy(""); }
  }

  async function disconnectChannel(connectionId: string) {
    if (channelBusy) return;
    setChannelBusy(connectionId);
    try {
      const response = await fetch(`/api/youtube/channels?connectionId=${encodeURIComponent(connectionId)}`, { method: "DELETE", cache: "no-store" });
      const data = await response.json() as { error?: string; activeConnectionId?: string; connections?: YouTubeConnection[] };
      if (!response.ok) throw new Error(data.error || "채널 연결을 해제하지 못했습니다.");
      const next = data.connections ?? []; setConnections(next); setActiveConnectionId(data.activeConnectionId ?? ""); setYoutubeStatus(next.length ? "connected" : "disconnected"); setYoutubeMessage(next.length ? "선택한 채널 연결만 해제했습니다." : "YouTube 채널 연결을 모두 해제했습니다. Cloud Client 설정은 유지됩니다.");
    } catch (error) { setYoutubeMessage(error instanceof Error ? error.message : "채널 연결을 해제하지 못했습니다."); }
    finally { setChannelBusy(""); }
  }

  const wizardVisible = youtubeStatus === "unconfigured" || (youtubeStatus === "disconnected" && showFinalWizardStep);
  const currentStatic = STATIC_STEPS[wizardStep];

  return <main className="v17-connections-shell">
    <header className="v17-topbar"><a href="/" className="v17-brand"><span>S</span><strong>Subtitle Localizer <small>v1.7.0</small></strong></a><a className="v17-quiet-link" href={returnPath}>작업으로 돌아가기</a></header>

    <section className="v17-connections-hero"><span>CONNECTIONS</span><h1>처음 한 번만 설정하고,<br />이후에는 채널만 추가하세요.</h1><p>Google Cloud는 사용자가 직접 소유합니다.<br />앱은 초보자가 판단할 일을 줄이고 꼭 필요한 클릭과 입력만 순서대로 안내합니다.</p></section>

    <section className="v17-card" id="openai-connection">
      <div className="v17-card-head"><div><span>OPENAI · BYOK</span><h2>내 OpenAI API Key</h2><p>번역할 때만 사용합니다. 사용료는 입력한 OpenAI 계정에 직접 청구됩니다.</p></div><b className={openAiConfigured ? "ready" : ""}>{openAiConfigured ? "연결됨" : "연결 필요"}</b></div>
      {!openAiServerConfigured && <p className="v17-message">배포 서버에 APP_SESSION_SECRET 설정이 필요합니다.</p>}
      <div className="v17-secret-row"><input aria-label="OpenAI API Key" type={showOpenAi ? "text" : "password"} value={openAiKey} onChange={(event) => setOpenAiKey(event.target.value)} autoComplete="off" spellCheck={false} placeholder={openAiConfigured ? "새 키로 바꾸려면 입력" : "OpenAI API Key"} disabled={!openAiServerConfigured} /><button type="button" onClick={() => setShowOpenAi((value) => !value)}>{showOpenAi ? "숨기기" : "보기"}</button></div>
      <label className="v17-remember"><input type="checkbox" checked={rememberOpenAi} onChange={(event) => setRememberOpenAi(event.target.checked)} /><span><strong>이 브라우저에 기억하기</strong><small>암호화된 HttpOnly 쿠키로 저장합니다.</small></span></label>
      <div className="v17-actions"><button className="v17-primary" type="button" onClick={() => void saveOpenAi()} disabled={!openAiServerConfigured || !openAiKey.trim() || openAiSaving}>{openAiSaving ? "저장 중…" : openAiConfigured ? "키 교체" : "키 연결"}</button>{openAiConfigured && <button className="v17-text-danger" type="button" onClick={() => void forgetOpenAi()}>저장된 키 지우기</button>}</div>
      {openAiMessage && <p className="v17-message">{openAiMessage}</p>}
    </section>

    <section className="v17-card" id="youtube-connection">
      <div className="v17-card-head"><div><span>GOOGLE CLOUD · USER BYOC</span><h2>YouTube 연결</h2><p>Cloud Client는 최초 1회만 저장합니다. 이후에는 이 화면에서 여러 계정·채널을 추가하고 전환합니다.</p></div><b className={youtubeStatus === "connected" ? "ready" : ""}>{youtubeStatus === "checking" ? "확인 중" : youtubeStatus === "connected" ? `${connections.length}개 채널` : youtubeStatus === "disconnected" ? "Client 저장됨" : "설정 필요"}</b></div>
      {youtubeMessage && <p className="v17-message">{youtubeMessage}</p>}
      {youtubeStatus === "server-unavailable" && <p className="v17-message">배포 서버에 APP_SESSION_SECRET 설정이 필요합니다.</p>}
      {youtubeStatus === "checking" && <div className="v17-loading">저장된 연결 상태를 확인하고 있습니다.</div>}

      {youtubeStatus === "connected" && <div className="v17-channel-manager">
        <div className="v17-channel-manager-hero"><div><span>YOUTUBE CHANNELS · CONNECTED</span><strong>Cloud Client와 YouTube 채널이 연결되어 있습니다.</strong><p>Branding과 In Production까지 완료했다면 이후 정상적인 계정·채널 추가 때 Cloud Console을 다시 설정할 필요가 없습니다.</p></div><a className="v17-primary" href="/api/youtube/oauth/start">+ 계정 또는 채널 추가</a></div>
        <PublishingGuide />
        <div className="v17-channel-list">{connections.map((connection) => { const active = connection.connectionId === activeConnectionId; return <article className={active ? "active" : ""} key={connection.connectionId}><ChannelAvatar connection={connection} /><div><small>{active ? "현재 작업 채널" : "연결된 채널"}</small><strong>{connection.channelTitle}</strong><span>{active ? "영상 가져오기와 자막 업로드가 이 채널을 사용합니다." : "필요할 때 작업 채널로 전환하세요."}</span></div><div className="v17-channel-actions">{active ? <b>선택됨 ✓</b> : <button type="button" disabled={Boolean(channelBusy)} onClick={() => void selectChannel(connection.connectionId)}>{channelBusy === connection.connectionId ? "전환 중…" : "이 채널 사용"}</button>}<button type="button" className="v17-text-danger" disabled={Boolean(channelBusy)} onClick={() => void disconnectChannel(connection.connectionId)}>연결 해제</button></div></article>; })}</div>
        <div className="v17-active-summary"><span>현재 작업 채널</span><strong>{activeConnection?.channelTitle || "선택된 채널 없음"}</strong></div>
        <details className="v17-cloud-details"><summary>Google Cloud Client · 저장됨</summary><p>OAuth Client 자체를 삭제하거나 Client Secret을 교체한 경우처럼 저장한 Client가 더 이상 유효하지 않을 때만 다시 설정하세요. Publishing 상태는 위 안내에서 별도로 확인할 수 있습니다.</p><div className="v17-actions"><a className="v17-secondary" target="_blank" rel="noreferrer" href="https://console.cloud.google.com/auth/clients">Clients 열기 ↗</a><button className="v17-text-danger" type="button" onClick={() => void forgetGoogle()}>Cloud Client와 모든 채널 지우기</button></div></details>
      </div>}

      {youtubeStatus === "disconnected" && !showFinalWizardStep && <div className="v17-cloud-ready"><span>CLOUD CLIENT · SAVED</span><strong>Cloud Client는 저장되어 있습니다.</strong><p>Client ID/Secret을 다시 만들 필요는 없습니다. 첫 채널 또는 추가 계정을 연결하기 전에 Branding과 Publishing 상태만 확인하세요.</p><PublishingGuide /><a className="v17-primary" href="/api/youtube/oauth/start">+ 계정 또는 채널 연결</a><details className="v17-cloud-details"><summary>Cloud Client를 바꿔야 하는 경우</summary><p>OAuth Client를 삭제했거나 Client Secret을 바꾼 경우에만 기존 설정을 지우고 다시 진행합니다.</p><button className="v17-text-danger" type="button" onClick={() => void forgetGoogle()}>기존 Cloud Client 지우기</button></details></div>}

      {wizardVisible && <div className="v17-wizard">
        <Progress step={wizardStep} />
        <section className="v17-current-step">
          <div className="v17-current-head"><div><span>{wizardStep}/8 · {currentStatic?.eyebrow || (wizardStep === 7 ? "CREDENTIALS" : "FIRST CHANNEL")}</span><h3>{currentStatic?.title || STEP_TITLES[wizardStep - 1]}</h3><p>{currentStatic?.summary || (wizardStep === 7 ? "발급받은 두 값만 저장합니다." : "Google 계정을 승인해 실제 YouTube 채널 연결을 확인합니다.")}</p></div><b>{wizardStep}</b></div>

          {wizardStep <= 6 && currentStatic && <div className="v17-step-body"><a className="v17-primary" target="_blank" rel="noreferrer" href={currentStatic.href}>{currentStatic.cta}</a><div className="v17-instructions">{currentStatic.instructions}</div>{wizardStep === 1 && <CopyRow label="프로젝트 이름" value={PROJECT_NAME} />}{wizardStep === 6 && <><CopyRow label="Client 이름" value={CLIENT_NAME} /><CopyRow label="Authorized redirect URI" value={redirectUri} /></>}<label className="v17-confirm"><input type="checkbox" checked={Boolean(confirmed[wizardStep])} onChange={(event) => setConfirmed((current) => ({ ...current, [wizardStep]: event.target.checked }))} /><span><strong>이 단계의 작업을 완료했습니다</strong><small>확인한 뒤 다음 단계로 이동하세요.</small></span></label></div>}

          {wizardStep === 7 && <div className="v17-step-body"><div className="v17-important"><strong>이 단계에서만 직접 값을 입력합니다.</strong><span>Client Secret은 다른 곳에 보내지 말고 아래 입력란에만 넣으세요.</span></div><label className="v17-field"><span>Google OAuth Client ID · 필수</span><input value={googleClientId} onChange={(event) => setGoogleClientId(event.target.value)} autoComplete="off" spellCheck={false} placeholder="...apps.googleusercontent.com" /></label><label className="v17-field"><span>Google OAuth Client Secret · 필수</span><div className="v17-secret-row"><input type={showGoogleSecret ? "text" : "password"} value={googleClientSecret} onChange={(event) => setGoogleClientSecret(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Google Client Secret" /><button type="button" onClick={() => setShowGoogleSecret((value) => !value)}>{showGoogleSecret ? "숨기기" : "보기"}</button></div></label><label className="v17-remember"><input type="checkbox" checked={rememberGoogle} onChange={(event) => setRememberGoogle(event.target.checked)} /><span><strong>이 브라우저에서 Google 연결 유지</strong><small>Client 설정과 OAuth 토큰을 암호화된 HttpOnly 쿠키로 유지합니다.</small></span></label><button className="v17-primary wide" type="button" disabled={googleSaving || !googleClientId.trim() || !googleClientSecret.trim()} onClick={() => void saveGoogleConfig()}>{googleSaving ? "저장 중…" : "Client 정보 저장하고 마지막 단계로"}</button></div>}

          {wizardStep === 8 && <div className="v17-step-body v17-final-step"><div className="v17-final-checks"><span>프로젝트 ✓</span><span>YouTube API ✓</span><span>Branding 직접 확인 ✓</span><span>Publishing 직접 확인 ✓</span><span>OAuth Client ✓</span><span>Client 저장 ✓</span></div><strong>이제 실제 YouTube 채널 연결을 확인하세요.</strong><p>Branding과 Publishing까지 완료했다면 앞으로 정상적인 계정이나 채널 추가 때문에 1~7단계를 다시 할 필요가 없습니다.</p><a className="v17-primary wide" href="/api/youtube/oauth/start">Google로 첫 YouTube 채널 연결</a><small>새 계정이 403 access_denied로 차단되면 3단계 Branding과 4단계 Audience 상태부터 확인하세요.</small></div>}

          <div className="v17-wizard-nav">{wizardStep > 1 && wizardStep < 8 && <button type="button" className="v17-secondary" onClick={() => setWizardStep((current) => Math.max(1, current - 1))}>이전</button>}{wizardStep <= 6 && <button type="button" className="v17-primary" disabled={!confirmed[wizardStep]} onClick={() => setWizardStep((current) => Math.min(8, current + 1))}>완료했어요 → 다음</button>}{wizardStep === 8 && <button type="button" className="v17-secondary" onClick={() => setShowFinalWizardStep(false)}>나중에 연결하기</button>}</div>
        </section>
      </div>}
    </section>
  </main>;
}