"use client";

import { useEffect, useMemo, useState } from "react";

type YouTubeStatus = "checking" | "server-unavailable" | "unconfigured" | "disconnected" | "connected";

type SetupTarget = "openai" | "youtube" | null;

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
            <span><strong>Subtitle Localizer</strong><small>v1.6.1</small></span>
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
              <div><span>{wizardStep}/4</span><strong>{["프로젝트 + YouTube API", "Google Auth Platform", "OAuth Web Client", "Cloud 설정 저장"][wizardStep - 1]}</strong></div>
              <div className="wizard-progress" aria-hidden="true">{[1,2,3,4].map((step) => <span key={step} className={`${wizardStep === step ? "active" : ""} ${wizardStep > step ? "complete" : ""}`}>{step}</span>)}</div>
            </div>

            {wizardStep === 1 && <div className="single-step-body">
              <div className="console-example"><div className="console-example-title"><span>Google Cloud Console</span><strong>화면 예시</strong></div><div className="console-mini-screen"><div className="console-mini-bar">API Library</div><div className="console-mini-content"><span>YouTube Data API v3</span><b>Enable</b></div></div><small>API Library → YouTube Data API v3 → Enable</small></div>
              <ul className="wizard-checklist"><li>새 프로젝트를 만들거나 사용할 프로젝트를 선택합니다.</li><li>API Library에서 <strong>YouTube Data API v3</strong>를 활성화합니다.</li></ul>
              <div className="wizard-link-row"><a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer">프로젝트 만들기 ↗</a><a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">YouTube Data API 열기 ↗</a></div>
              <label className="wizard-confirm"><input type="checkbox" checked={confirmedSteps.projectApi} onChange={(event) => setConfirmedSteps((current) => ({ ...current, projectApi: event.target.checked }))} /><span><strong>YouTube Data API v3를 활성화했습니다</strong><small>완료하면 다음 단계로 이동할 수 있습니다.</small></span></label>
            </div>}

            {wizardStep === 2 && <div className="single-step-body">
              <div className="console-example"><div className="console-example-title"><span>Google Auth Platform</span><strong>화면 예시</strong></div><div className="console-mini-screen auth-mini"><div className="console-mini-bar">Google Auth Platform</div><div className="console-mini-tabs"><span>Branding</span><span>Audience</span><span>Data Access</span></div></div></div>
              <ul className="wizard-checklist"><li><strong>Branding</strong>에서 앱 이름과 기본 정보를 설정합니다.</li><li><strong>Audience</strong>에서 테스트/게시 상태를 확인합니다.</li><li><strong>Data Access</strong>에서 OAuth 범위를 확인합니다.</li></ul>
              <div className="scope-box"><span>Subtitle Localizer 요청 scope</span><code>https://www.googleapis.com/auth/youtube.force-ssl</code></div>
              <p className="wizard-warning">External + Testing 상태에서는 Google 정책에 따라 refresh token이 더 일찍 만료되어 재승인이 필요할 수 있습니다.</p>
              <div className="wizard-link-row"><a href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noreferrer">Google Auth Platform 열기 ↗</a></div>
              <label className="wizard-confirm"><input type="checkbox" checked={confirmedSteps.authPlatform} onChange={(event) => setConfirmedSteps((current) => ({ ...current, authPlatform: event.target.checked }))} /><span><strong>Branding / Audience / Data Access를 확인했습니다</strong><small>완료하면 다음 단계로 이동할 수 있습니다.</small></span></label>
            </div>}

            {wizardStep === 3 && <div className="single-step-body">
              <div className="console-example"><div className="console-example-title"><span>Google Auth Platform → Clients</span><strong>화면 예시</strong></div><div className="console-mini-screen"><div className="console-mini-bar">Create Client</div><div className="console-mini-form"><span>Application type</span><b>Web application</b><span>Authorized redirect URIs</span><b>https://…/callback</b></div></div></div>
              <ul className="wizard-checklist"><li>Application type은 <strong>Web application</strong>을 선택합니다.</li><li>아래 Redirect URI를 Authorized redirect URIs에 정확히 등록합니다.</li></ul>
              {youtubeRedirectUri ? <div className="redirect-box wizard-redirect"><span>Authorized redirect URI</span><code>{youtubeRedirectUri}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(youtubeRedirectUri)}>복사</button></div> : <p className="wizard-inline-note">Redirect URI를 확인하고 있습니다.</p>}
              <div className="wizard-link-row"><a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noreferrer">OAuth Clients 열기 ↗</a></div>
              <label className="wizard-confirm"><input type="checkbox" checked={confirmedSteps.oauthClient} onChange={(event) => setConfirmedSteps((current) => ({ ...current, oauthClient: event.target.checked }))} /><span><strong>Web application Client를 만들었습니다</strong><small>Client ID와 Client Secret을 다음 단계에서 입력합니다.</small></span></label>
            </div>}

            {wizardStep === 4 && <div className="single-step-body google-config-form">
              <div className="field-block compact"><div className="field-row"><label htmlFor="google-client-id">Google OAuth Client ID</label><span>사용자 프로젝트</span></div><input id="google-client-id" className="text-input" value={googleClientId} onChange={(event) => setGoogleClientId(event.target.value)} autoComplete="off" spellCheck={false} placeholder="...apps.googleusercontent.com" /></div>
              <div className="field-block compact"><div className="field-row"><label htmlFor="google-client-secret">Google OAuth Client Secret</label><span>JS에 재노출 안 함</span></div><div className="secret-input-row"><input id="google-client-secret" className="text-input" type={showGoogleSecret ? "text" : "password"} value={googleClientSecret} onChange={(event) => setGoogleClientSecret(event.target.value)} autoComplete="off" spellCheck={false} placeholder="Google Client Secret" /><button type="button" className="input-action" onClick={() => setShowGoogleSecret((value) => !value)}>{showGoogleSecret ? "숨기기" : "보기"}</button></div></div>
              <label className="remember-row"><input type="checkbox" checked={rememberGoogle} onChange={(event) => setRememberGoogle(event.target.checked)} /><span><strong>이 브라우저에서 Google 연결 유지</strong><small>Client 설정과 OAuth 토큰을 암호화된 HttpOnly 쿠키로 유지합니다.</small></span></label>
              <div className="cloud-vs-oauth-note"><strong>이 단계는 Cloud Client 저장만 합니다.</strong><span>저장 후 별도로 Google OAuth 로그인·동의를 진행합니다.</span></div>
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
