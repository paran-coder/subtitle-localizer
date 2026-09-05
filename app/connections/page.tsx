"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type YouTubeStatus = "checking" | "server-unavailable" | "unconfigured" | "disconnected" | "connected";

type SetupTarget = "openai" | "youtube" | null;

function WizardGuide({ click, see, done }: { click: string; see: string; done: string }) {
  return (
    <div className="wizard-guide-grid" aria-label="이 단계의 길찾기 가이드">
      <article><span>1</span><div><strong>어디를 클릭하세요</strong><p>{click}</p></div></article>
      <article><span>2</span><div><strong>무엇이 보여야 합니다</strong><p>{see}</p></div></article>
      <article><span>3</span><div><strong>완료 기준</strong><p>{done}</p></div></article>
    </div>
  );
}

function ReconstructedFrame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="reconstructed-frame">
      <figcaption>
        <span>{label}</span>
        <strong>안내용 재구성 화면</strong>
      </figcaption>
      {children}
      <p>실제 Google Cloud Console은 업데이트에 따라 메뉴 위치나 표현이 조금 다를 수 있습니다.</p>
    </figure>
  );
}

function Marker({ children }: { children: ReactNode }) {
  return <i className="mock-marker" aria-hidden="true">{children}</i>;
}

function ProjectApiVisual() {
  return (
    <ReconstructedFrame label="Google Cloud Console · API Library">
      <div className="reconstructed-console">
        <div className="mock-topbar"><strong>Google Cloud</strong><span className="mock-project"><Marker>1</Marker> My subtitle project <b>▾</b></span></div>
        <div className="mock-console-layout">
          <aside className="mock-sidebar">
            <span>Home</span>
            <strong><Marker>2</Marker> APIs &amp; Services</strong>
            <span className="mock-subactive">Library</span>
            <span>Enabled APIs &amp; services</span>
          </aside>
          <div className="mock-console-main">
            <span className="mock-breadcrumb">APIs &amp; Services / API Library</span>
            <div className="mock-searchbox">Search APIs &amp; Services</div>
            <div className="mock-api-card">
              <div><small>YouTube</small><strong><Marker>3</Marker> YouTube Data API v3</strong><p>Access YouTube videos, playlists, channels and captions.</p></div>
              <span className="mock-outline-action">Enable</span>
            </div>
          </div>
        </div>
      </div>
    </ReconstructedFrame>
  );
}

function AuthPlatformVisual() {
  return (
    <ReconstructedFrame label="Google Auth Platform · 앱 권한 설정">
      <div className="reconstructed-console">
        <div className="mock-topbar"><strong>Google Auth Platform</strong><span className="mock-project">My subtitle project</span></div>
        <div className="mock-console-layout auth-platform-layout">
          <aside className="mock-sidebar">
            <span>Overview</span>
            <strong><Marker>1</Marker> Branding</strong>
            <strong><Marker>2</Marker> Audience</strong>
            <span>Clients</span>
            <strong><Marker>3</Marker> Data Access</strong>
          </aside>
          <div className="mock-console-main mock-settings-stack">
            <div className="mock-setting-row"><span>Branding</span><div><strong>App name</strong><b>Subtitle Localizer</b></div></div>
            <div className="mock-setting-row"><span>Audience</span><div><strong>User type / Publishing status</strong><b>External · Testing</b><small>Test users: 내가 로그인할 Google 계정</small></div></div>
            <div className="mock-setting-row"><span>Data Access</span><div><strong>OAuth scope</strong><code>youtube.force-ssl</code><small>ADD OR REMOVE SCOPES</small></div></div>
          </div>
        </div>
      </div>
    </ReconstructedFrame>
  );
}

function OAuthClientVisual({ redirectUri }: { redirectUri: string }) {
  return (
    <ReconstructedFrame label="Google Auth Platform · Clients">
      <div className="reconstructed-console">
        <div className="mock-topbar"><strong>Google Auth Platform</strong><span className="mock-project">Clients</span></div>
        <div className="mock-client-panel">
          <div className="mock-client-heading"><div><Marker>1</Marker><span>Create OAuth client</span></div><small>Application type과 redirect URI를 설정합니다.</small></div>
          <label><span>Application type</span><b><Marker>2</Marker> Web application</b></label>
          <label><span>Name</span><b>Subtitle Localizer</b></label>
          <label className="mock-uri-field"><span>Authorized redirect URIs</span><b><Marker>3</Marker> {redirectUri || "https://subtitle-localizer.vercel.app/api/youtube/oauth/callback"}</b></label>
          <div className="mock-client-footer"><span>Cancel</span><strong>Create</strong></div>
        </div>
      </div>
    </ReconstructedFrame>
  );
}

function CloudToOAuthVisual() {
  return (
    <ReconstructedFrame label="Subtitle Localizer · 연결 흐름">
      <div className="connection-flow-visual">
        <div><span>1</span><strong>Client ID / Secret</strong><small>사용자 Google Cloud 프로젝트</small></div>
        <b aria-hidden="true">→</b>
        <div><span>2</span><strong>Cloud 설정 저장</strong><small>암호화된 HttpOnly cookie</small></div>
        <b aria-hidden="true">→</b>
        <div><span>3</span><strong>Google OAuth 승인</strong><small>Google로 YouTube 연결</small></div>
        <b aria-hidden="true">→</b>
        <div><span>4</span><strong>YouTube 연결 ✓</strong><small>영상·자막 접근 준비</small></div>
      </div>
    </ReconstructedFrame>
  );
}

export default function ConnectionsPage() {
  const [openAiKey, setOpenAiKey] = useState("");
  const [openAiConfigured, setOpenAiConfigured] = useState(false);
  const [openAiServerConfigured, setOpenAiServerConfigured] = useState(true);
  const [rememberOpenAi, setRememberOpenAi] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [openAiSaving, setOpenAiSaving] = useState(false);
  const [openAiMessage, setOpenAiMessage] = useState("");

  const [youtubeStatus, setYoutubeStatus] = useState<YouTubeStatus>("checking");
  const [youtubeRedirectUri, setYoutubeRedirectUri] = useState("");
  const [rememberGoogle, setRememberGoogle] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");
  const [showGoogleSecret, setShowGoogleSecret] = useState(false);
  const [googleSaving, setGoogleSaving] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState("");
  const [wizardStep, setWizardStep] = useState(1);
  const [confirmedSteps, setConfirmedSteps] = useState({ projectApi: false, authPlatform: false, oauthClient: false });
  const [target, setTarget] = useState<SetupTarget>(null);
  const [returnPath, setReturnPath] = useState("/");

  const youtubeConfigured = youtubeStatus === "connected" || youtubeStatus === "disconnected";
  const statusSummary = useMemo(() => ({
    openAi: openAiConfigured ? "연결됨" : "연결 필요",
    youtube: youtubeStatus === "connected" ? "연결됨" : youtubeConfigured ? "Cloud 설정됨" : "설정 필요"
  }), [openAiConfigured, youtubeConfigured, youtubeStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup");
    setTarget(setup === "openai" || setup === "youtube" ? setup : null);
    const nextReturn = params.get("return");
    if (nextReturn?.startsWith("/")) setReturnPath(nextReturn);

    const youtube = params.get("youtube");
    if (youtube === "connected") setYoutubeMessage("YouTube 계정 연결이 완료되었습니다.");
    if (youtube === "denied") setYoutubeMessage("Google OAuth 승인이 취소되었습니다.");
    if (youtube === "invalid-state") setYoutubeMessage("OAuth 상태를 확인하지 못했습니다. 다시 연결해 주세요.");
    if (youtube === "token-error") setYoutubeMessage("Google OAuth Client 설정 또는 승인 상태를 확인해 주세요.");
    if (youtube === "client-not-configured") setYoutubeMessage("Google Cloud Client 설정을 먼저 저장해 주세요.");
    if (youtube === "server-not-configured") setYoutubeMessage("배포 서버에 APP_SESSION_SECRET 설정이 필요합니다.");

    let cancelled = false;
    async function loadStatus() {
      const [openAiResult, youtubeResult] = await Promise.allSettled([
        fetch("/api/openai/credential", { cache: "no-store" }),
        fetch("/api/youtube/status", { cache: "no-store" })
      ]);
      if (cancelled) return;

      if (openAiResult.status === "fulfilled") {
        const payload = await openAiResult.value.json() as { serverConfigured?: boolean; configured?: boolean; remember?: boolean };
        setOpenAiServerConfigured(Boolean(payload.serverConfigured));
        setOpenAiConfigured(Boolean(payload.configured));
        setRememberOpenAi(Boolean(payload.remember));
      } else {
        setOpenAiServerConfigured(false);
      }

      if (youtubeResult.status === "fulfilled") {
        const payload = await youtubeResult.value.json() as { serverConfigured?: boolean; configured?: boolean; connected?: boolean; remember?: boolean; redirectUri?: string };
        setYoutubeRedirectUri(payload.redirectUri ?? "");
        setRememberGoogle(Boolean(payload.remember));
        setYoutubeStatus(!payload.serverConfigured
          ? "server-unavailable"
          : !payload.configured
            ? "unconfigured"
            : payload.connected ? "connected" : "disconnected");
        if (payload.configured) {
          setConfirmedSteps({ projectApi: true, authPlatform: true, oauthClient: true });
          setWizardStep(4);
        }
      } else {
        setYoutubeStatus("server-unavailable");
      }
    }
    void loadStatus();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(target === "openai" ? "openai-connection" : "youtube-connection")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }, [target]);

  async function saveOpenAi() {
    const apiKey = openAiKey.trim();
    if (!apiKey || openAiSaving) return;
    setOpenAiSaving(true);
    setOpenAiMessage("");
    try {
      const response = await fetch("/api/openai/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, remember: rememberOpenAi }),
        cache: "no-store"
      });
      const payload = await response.json() as { error?: string; remember?: boolean };
      if (!response.ok) throw new Error(payload.error || "OpenAI API Key를 저장하지 못했습니다.");
      setOpenAiConfigured(true);
      setRememberOpenAi(Boolean(payload.remember));
      setOpenAiKey("");
      setOpenAiMessage("OpenAI 키를 암호화된 HttpOnly 쿠키에 저장했습니다.");
    } catch (error) {
      setOpenAiMessage(error instanceof Error ? error.message : "OpenAI API Key를 저장하지 못했습니다.");
    } finally {
      setOpenAiSaving(false);
    }
  }

  async function updateOpenAiRemember(remember: boolean) {
    setRememberOpenAi(remember);
    if (!openAiConfigured) return;
    const response = await fetch("/api/openai/credential", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remember }),
      cache: "no-store"
    });
    if (!response.ok) setOpenAiMessage("기억 설정을 변경하지 못했습니다.");
  }

  async function forgetOpenAi() {
    await fetch("/api/openai/credential", { method: "DELETE" });
    setOpenAiConfigured(false);
    setRememberOpenAi(false);
    setOpenAiKey("");
    setOpenAiMessage("저장된 OpenAI 키를 지웠습니다.");
  }

  async function saveGoogleConfig() {
    const clientId = googleClientId.trim();
    const clientSecret = googleClientSecret.trim();
    if (!clientId || !clientSecret || googleSaving) return;
    setGoogleSaving(true);
    setYoutubeMessage("");
    try {
      const response = await fetch("/api/youtube/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret, remember: rememberGoogle }),
        cache: "no-store"
      });
      const payload = await response.json() as { error?: string; redirectUri?: string };
      if (!response.ok) throw new Error(payload.error || "Google Cloud 설정을 저장하지 못했습니다.");
      setYoutubeRedirectUri(payload.redirectUri ?? youtubeRedirectUri);
      setGoogleClientSecret("");
      setYoutubeStatus("disconnected");
      setYoutubeMessage("Google Cloud 설정을 저장했습니다. 이제 별도의 Google OAuth 승인을 진행하세요.");
    } catch (error) {
      setYoutubeMessage(error instanceof Error ? error.message : "Google Cloud 설정을 저장하지 못했습니다.");
    } finally {
      setGoogleSaving(false);
    }
  }

  async function forgetGoogle() {
    await fetch("/api/youtube/config", { method: "DELETE" });
    setYoutubeStatus("unconfigured");
    setRememberGoogle(false);
    setGoogleClientId("");
    setGoogleClientSecret("");
    setConfirmedSteps({ projectApi: false, authPlatform: false, oauthClient: false });
    setWizardStep(1);
    setYoutubeMessage("Google Cloud 설정과 YouTube 연결을 지웠습니다.");
  }

  async function disconnectYoutube() {
    await fetch("/api/youtube/oauth/logout", { method: "POST" });
    setYoutubeStatus("disconnected");
    setYoutubeMessage("YouTube 계정 연결을 해제했습니다. Cloud 설정은 유지됩니다.");
  }

  function nextStep() {
    if (wizardStep === 1 && !confirmedSteps.projectApi) return;
    if (wizardStep === 2 && !confirmedSteps.authPlatform) return;
    if (wizardStep === 3 && !confirmedSteps.oauthClient) return;
    setWizardStep((step) => Math.min(4, step + 1));
  }

  return (
    <main className="app-shell connections-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label="Subtitle Localizer 작업공간으로 이동">
            <span className="brand-symbol" aria-hidden="true">S</span>
            <span><strong>Subtitle Localizer</strong><small>v1.6.3</small></span>
          </a>
          <div className="topbar-actions connection-status-strip">
            <span className={`status-pill ${openAiConfigured ? "is-ready" : ""}`}>OpenAI {openAiConfigured ? "✓" : "○"}</span>
            <span className={`status-pill ${youtubeStatus === "connected" ? "is-ready" : ""}`}>YouTube {youtubeStatus === "connected" ? "✓" : "○"}</span>
            <a className="quiet-button" href={returnPath}>작업으로 돌아가기</a>
          </div>
        </div>
      </header>

      <section className="connections-hero">
        <span className="eyebrow">CONNECTIONS</span>
        <h1>API 연결은 여기서만 관리합니다.</h1>
        <p>작업공간은 자막에 집중하고, 비용이 발생하는 외부 API는 각 사용자의 계정과 프로젝트로 연결합니다.</p>
        <div className="connection-overview" aria-label="연결 상태 요약">
          <span><strong>OpenAI</strong>{statusSummary.openAi}</span>
          <span><strong>YouTube</strong>{statusSummary.youtube}</span>
          <span><strong>비용</strong>외부 API는 사용자 부담</span>
        </div>
      </section>

      <section className={`connection-page-card ${target === "openai" ? "is-target" : ""}`} id="openai-connection">
        <div className="connection-page-head">
          <div><span className="service-kicker">OPENAI · BYOK</span><h2>내 OpenAI API Key</h2><p>번역을 실행할 때만 필요합니다. 사용료는 입력한 OpenAI 계정에 직접 청구됩니다.</p></div>
          <span className={`connection-status ${openAiConfigured ? "is-ready" : ""}`}>{openAiConfigured ? "연결됨" : "연결 필요"}</span>
        </div>
        {!openAiServerConfigured && <div className="setup-notice"><strong>배포 설정 필요</strong><span>Vercel에 <code>APP_SESSION_SECRET</code>을 먼저 설정해야 합니다.</span></div>}
        <div className="connection-form-grid">
          <div className="secret-input-row">
            <input className="text-input" type={showOpenAi ? "text" : "password"} autoComplete="off" spellCheck={false} disabled={!openAiServerConfigured} value={openAiKey} onChange={(event) => setOpenAiKey(event.target.value)} placeholder={openAiConfigured ? "새 키로 교체하려면 입력" : "OpenAI API Key"} aria-label="OpenAI API Key" />
            <button className="input-action" type="button" onClick={() => setShowOpenAi((value) => !value)}>{showOpenAi ? "숨기기" : "보기"}</button>
          </div>
          <label className="remember-row">
            <input type="checkbox" disabled={!openAiServerConfigured} checked={rememberOpenAi} onChange={(event) => void updateOpenAiRemember(event.target.checked)} />
            <span><strong>이 브라우저에 기억하기</strong><small>켜면 암호화된 지속 HttpOnly 쿠키, 끄면 세션 쿠키로 보관합니다.</small></span>
          </label>
          <div className="connection-actions">
            <button className="primary-button" type="button" disabled={!openAiServerConfigured || !openAiKey.trim() || openAiSaving} onClick={() => void saveOpenAi()}>{openAiSaving ? "저장 중…" : openAiConfigured ? "키 교체" : "키 연결"}</button>
            {openAiConfigured && target === "openai" && <a className="quiet-button" href={returnPath}>작업으로 돌아가기</a>}
            {openAiConfigured && <button className="text-button" type="button" onClick={() => void forgetOpenAi()}>키 지우기</button>}
          </div>
          {openAiMessage && <p className="connection-message">{openAiMessage}</p>}
        </div>
      </section>

      <section className={`connection-page-card ${target === "youtube" ? "is-target" : ""}`} id="youtube-connection">
        <div className="connection-page-head">
          <div><span className="service-kicker">GOOGLE CLOUD · BYOC</span><h2>YouTube 연결</h2><p>Google Cloud 프로젝트 설정과 실제 Google OAuth 승인을 분리해서 진행합니다.</p></div>
          <span className={`connection-status ${youtubeStatus === "connected" ? "is-ready" : ""}`}>{youtubeStatus === "checking" ? "확인 중" : youtubeStatus === "connected" ? "YouTube 연결됨" : youtubeConfigured ? "Cloud 설정됨" : "설정 필요"}</span>
        </div>

        {youtubeStatus === "server-unavailable" && <div className="setup-notice"><strong>배포 설정 필요</strong><span>Vercel에 <code>APP_SESSION_SECRET</code>을 먼저 설정해야 합니다.</span></div>}

        {youtubeStatus === "connected" ? (
          <div className="oauth-ready-panel connection-complete-panel">
            <span className="summary-kicker">GOOGLE OAUTH · CONNECTED</span>
            <strong>YouTube 계정이 연결되어 있습니다.</strong>
            <p>Google Cloud 설정과 OAuth 토큰은 암호화된 HttpOnly 쿠키로 보호됩니다.</p>
            <div className="connection-actions">
              <a className="primary-button" href={returnPath}>작업으로 돌아가기</a>
              <button className="text-button" type="button" onClick={() => void disconnectYoutube()}>YouTube만 연결 해제</button>
              <button className="text-button" type="button" onClick={() => void forgetGoogle()}>Cloud 설정까지 지우기</button>
            </div>
          </div>
        ) : youtubeStatus === "disconnected" ? (
          <div className="oauth-ready-panel connection-complete-panel">
            <span className="summary-kicker">CLOUD CLIENT · READY</span>
            <strong>Google Cloud 설정이 준비되었습니다.</strong>
            <p>이제 Google 로그인·동의 화면에서 실제 YouTube 계정을 승인합니다.</p>
            <div className="oauth-separation"><span className="done">Cloud Client 저장 ✓</span><span>Google OAuth 승인</span><span>YouTube 채널 연결</span></div>
            <div className="connection-actions">
              <a className="primary-button" href="/api/youtube/oauth/start">Google로 YouTube 연결</a>
              <button className="text-button" type="button" onClick={() => void forgetGoogle()}>다른 Google 프로젝트 사용</button>
            </div>
          </div>
        ) : youtubeStatus === "checking" ? (
          <div className="setup-notice"><strong>연결 상태 확인 중</strong><span>저장된 Cloud 설정과 OAuth 상태를 확인하고 있습니다.</span></div>
        ) : (
          <div className="single-step-wizard" aria-label={`Google Cloud 설정 ${wizardStep}/4 단계`}>
            <div className="single-step-progress">
              <div><span>{wizardStep}/4</span><strong>{["Google Cloud 프로젝트 준비", "Google Auth Platform 설정", "OAuth Web Client 만들기", "Cloud 설정 저장 + OAuth 준비"][wizardStep - 1]}</strong></div>
              <div className="wizard-progress" aria-hidden="true">{[1,2,3,4].map((step) => <span key={step} className={`${wizardStep === step ? "active" : ""} ${wizardStep > step ? "complete" : ""}`}>{step}</span>)}</div>
            </div>

            {wizardStep === 1 && <div className="single-step-body">
              <p className="wizard-lead">먼저 이 도구가 사용할 <strong>내 Google Cloud 프로젝트</strong>를 정하고, 그 프로젝트에서 YouTube Data API v3를 켭니다.</p>
              <WizardGuide
                click="Google Cloud 상단 프로젝트 선택기 → APIs & Services → Library 순서로 이동합니다."
                see="API Library에서 YouTube Data API v3 상세 화면과 Enable 버튼이 보여야 합니다."
                done="선택한 프로젝트에서 YouTube Data API v3가 Enabled 상태가 되면 완료입니다."
              />
              <ProjectApiVisual />
              <div className="wizard-link-row"><a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer">프로젝트 만들기 ↗</a><a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">YouTube Data API 열기 ↗</a></div>
              <label className="wizard-confirm"><input type="checkbox" checked={confirmedSteps.projectApi} onChange={(event) => setConfirmedSteps((current) => ({ ...current, projectApi: event.target.checked }))} /><span><strong>YouTube Data API v3가 Enabled 상태입니다</strong><small>반드시 앞으로 사용할 OAuth Client와 같은 Google Cloud 프로젝트인지도 확인해 주세요.</small></span></label>
            </div>}

            {wizardStep === 2 && <div className="single-step-body">
              <p className="wizard-lead">이제 <strong>Google Auth Platform</strong>에서 OAuth 동의 화면에 표시될 앱 정보, 로그인 가능한 사용자, 요청할 YouTube 권한을 준비합니다.</p>
              <WizardGuide
                click="Google Auth Platform에서 Branding → Audience → Data Access를 차례로 확인합니다."
                see="Branding의 앱 정보, Audience의 External/Testing 및 Test users, Data Access의 OAuth scope 목록이 보여야 합니다."
                done="테스트 계정과 youtube.force-ssl scope가 준비되어 실제 OAuth 동의를 진행할 수 있으면 완료입니다."
              />
              <AuthPlatformVisual />
              <div className="scope-box"><span>Subtitle Localizer가 요청하는 YouTube scope</span><code>https://www.googleapis.com/auth/youtube.force-ssl</code></div>
              <div className="wizard-callout"><strong>개인 테스트라면</strong><p>Audience가 <b>External · Testing</b>인 경우, 실제로 YouTube에 로그인할 자신의 Google 계정을 <b>Test users</b>에 추가하세요.</p></div>
              <p className="wizard-warning">Testing 상태의 OAuth 앱은 Google 정책에 따라 refresh token이 일찍 만료될 수 있어 재승인이 필요할 수 있습니다. 공개 서비스로 운영하려면 별도의 OAuth 검증 요구사항이 생길 수 있습니다.</p>
              <div className="wizard-link-row"><a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noreferrer">Google Auth Platform 열기 ↗</a></div>
              <label className="wizard-confirm"><input type="checkbox" checked={confirmedSteps.authPlatform} onChange={(event) => setConfirmedSteps((current) => ({ ...current, authPlatform: event.target.checked }))} /><span><strong>Branding / Audience / Data Access 준비를 마쳤습니다</strong><small>External · Testing이면 로그인할 계정을 Test users에 넣었는지도 확인했습니다.</small></span></label>
            </div>}

            {wizardStep === 3 && <div className="single-step-body">
              <p className="wizard-lead">Google Auth Platform의 <strong>Clients</strong>에서 Web application OAuth Client를 만들고, Subtitle Localizer의 callback 주소를 Authorized redirect URI로 등록합니다.</p>
              <WizardGuide
                click="Google Auth Platform → Clients → Create Client를 누르고 Application type을 Web application으로 선택합니다."
                see="Name과 Authorized redirect URIs를 입력하는 Web application 설정 폼이 보여야 합니다."
                done="아래 Redirect URI가 정확히 등록되고 Client ID와 Client Secret이 발급되면 완료입니다."
              />
              <OAuthClientVisual redirectUri={youtubeRedirectUri} />
              {youtubeRedirectUri ? <div className="redirect-box wizard-redirect"><span>등록할 Authorized redirect URI</span><code>{youtubeRedirectUri}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(youtubeRedirectUri)}>복사</button></div> : <p className="wizard-inline-note">Redirect URI를 확인하고 있습니다.</p>}
              <div className="wizard-callout"><strong>문자 하나까지 같아야 합니다</strong><p>프로토콜, 도메인, 경로, 마지막 슬래시까지 OAuth 요청의 redirect URI와 Google Cloud에 등록한 값이 정확히 일치해야 합니다.</p></div>
              <div className="wizard-link-row"><a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noreferrer">OAuth Clients 열기 ↗</a></div>
              <label className="wizard-confirm"><input type="checkbox" checked={confirmedSteps.oauthClient} onChange={(event) => setConfirmedSteps((current) => ({ ...current, oauthClient: event.target.checked }))} /><span><strong>Web application Client를 만들었습니다</strong><small>Client ID와 Client Secret이 발급되었고 Redirect URI도 등록했습니다.</small></span></label>
            </div>}

            {wizardStep === 4 && <div className="single-step-body google-config-form">
              <p className="wizard-lead">마지막으로 발급받은 Client ID와 Client Secret을 Subtitle Localizer에 저장합니다. <strong>저장과 실제 Google 계정 OAuth 승인은 서로 다른 단계</strong>입니다.</p>
              <WizardGuide
                click="Google에서 발급받은 Client ID와 Client Secret을 아래 입력란에 넣고 Google Cloud 설정 저장을 누릅니다."
                see="저장 후 Cloud Client 준비 완료 상태와 Google로 YouTube 연결 버튼이 보여야 합니다."
                done="Google 로그인·동의까지 승인해 연결 페이지 상단이 YouTube ✓ 상태가 되면 전체 설정 완료입니다."
              />
              <CloudToOAuthVisual />
              <div className="field-block compact"><div className="field-row"><label htmlFor="google-client-id">Google OAuth Client ID</label><span>사용자 프로젝트</span></div><input id="google-client-id" className="text-input" value={googleClientId} onChange={(event) => setGoogleClientId(event.target.value)} autoComplete="off" spellCheck={false} placeholder="...apps.googleusercontent.com" /></div>
              <div className="field-block compact"><div className="field-row"><label htmlFor="google-client-secret">Google OAuth Client Secret</label><span>JS에 재노출 안 함</span></div><div className="secret-input-row"><input id="google-client-secret" className="text-input" type={showGoogleSecret ? "text" : "password"} value={googleClientSecret} onChange={(event) => setGoogleClientSecret(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Google Client Secret" /><button type="button" className="input-action" onClick={() => setShowGoogleSecret((value) => !value)}>{showGoogleSecret ? "숨기기" : "보기"}</button></div></div>
              <label className="remember-row"><input type="checkbox" checked={rememberGoogle} onChange={(event) => setRememberGoogle(event.target.checked)} /><span><strong>이 브라우저에서 Google 연결 유지</strong><small>Client 설정과 OAuth 토큰을 암호화된 HttpOnly 쿠키로 유지합니다.</small></span></label>
              <div className="cloud-vs-oauth-note"><strong>여기서는 Cloud Client 자격증명만 저장합니다.</strong><span>저장이 끝나면 별도 화면에서 `Google로 YouTube 연결`을 눌러 Google 로그인·동의를 승인합니다.</span></div>
              <button className="primary-button full-width" type="button" disabled={googleSaving || !googleClientId.trim() || !googleClientSecret.trim()} onClick={() => void saveGoogleConfig()}>{googleSaving ? "저장 중…" : "Google Cloud 설정 저장"}</button>
            </div>}

            <div className="wizard-nav">
              <button className="quiet-button" type="button" disabled={wizardStep === 1} onClick={() => setWizardStep((step) => Math.max(1, step - 1))}>이전</button>
              {wizardStep < 4 && <button className="primary-button" type="button" disabled={(wizardStep === 1 && !confirmedSteps.projectApi) || (wizardStep === 2 && !confirmedSteps.authPlatform) || (wizardStep === 3 && !confirmedSteps.oauthClient)} onClick={nextStep}>다음</button>}
            </div>
          </div>
        )}
        {youtubeMessage && <p className="connection-message">{youtubeMessage}</p>}
      </section>
    </main>
  );
}
