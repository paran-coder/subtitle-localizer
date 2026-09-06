import type { ReactNode } from "react";

export const metadata = {
  title: "초기 설정 · Subtitle Localizer",
  description: "OpenAI API Key와 YouTube 최초 연결을 처음부터 끝까지 안내합니다."
};

const APP_URL = "https://subtitle-localizer.vercel.app/";
const PRIVACY_URL = "https://subtitle-localizer.vercel.app/privacy";
const TERMS_URL = "https://subtitle-localizer.vercel.app/terms";
const REDIRECT_URI = "https://subtitle-localizer.vercel.app/api/youtube/oauth/callback";
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.force-ssl";

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return <article className="guide-step"><span className="guide-step-number">{number}</span><div><h3>{title}</h3>{children}</div></article>;
}

function ValueBox({ label, value }: { label: string; value: string }) {
  return <div className="guide-value"><span>{label}</span><code>{value}</code></div>;
}

export default function InitialSetupPage() {
  return <main className="guide-shell">
    <header className="guide-topbar">
      <a className="guide-brand" href="/"><span>S</span><strong>Subtitle Localizer <small>v1.7.0</small></strong></a>
      <div className="guide-top-actions"><a href="/connections">연결 관리</a><a href="/">작업으로 돌아가기</a></div>
    </header>

    <section className="guide-hero">
      <div className="guide-hero-copy">
        <span className="guide-eyebrow">FIRST-TIME SETUP · v1.7.0</span>
        <h1>처음 연결부터 실제 작업까지,<br />막히지 않게 순서대로 안내합니다.</h1>
        <p>Subtitle Localizer는 사용자의 OpenAI API Key와 Google Cloud OAuth Client를 대신 소유하지 않습니다. 처음 한 번만 정확히 연결하면 이후에는 자막 작업에 집중할 수 있습니다.</p>
        <div className="guide-hero-actions"><a className="guide-primary" href="#openai">OpenAI부터 시작</a><a className="guide-secondary" href="#youtube">YouTube 설정 보기</a></div>
      </div>
      <aside className="guide-ready-card" aria-label="시작 전 준비물">
        <span>시작 전 준비물</span>
        <strong>계정 2개면 충분합니다.</strong>
        <ul>
          <li>OpenAI Platform을 사용할 계정</li>
          <li>YouTube 채널을 관리하는 Google 계정</li>
          <li>약 10~15분의 최초 Google Cloud 설정 시간</li>
        </ul>
        <p>SRT 파일만 번역할 때는 OpenAI 연결만 먼저 완료해도 됩니다.</p>
      </aside>
    </section>

    <div className="guide-layout">
      <nav className="guide-toc" aria-label="초기 설정 목차">
        <span>이 페이지에서</span>
        <a href="#overview">전체 흐름</a>
        <a href="#openai">1. OpenAI API Key</a>
        <a href="#youtube">2. YouTube 연결</a>
        <a href="#after-connect">3. 연결 후 사용</a>
        <a href="#troubleshooting">4. 문제 해결</a>
        <a href="#security">5. 보안과 비용</a>
      </nav>

      <div className="guide-content">
        <section id="overview" className="guide-section">
          <div className="guide-section-head"><span>OVERVIEW</span><h2>먼저 구조만 이해하면 어렵지 않습니다.</h2><p>두 연결은 서로 독립적입니다. 번역에는 OpenAI, YouTube 자막 가져오기와 업로드에는 Google/YouTube 연결이 필요합니다.</p></div>
          <div className="guide-flow-grid">
            <div><b>01</b><strong>OpenAI API Key</strong><span>번역 요청과 API 사용료</span></div>
            <div><b>02</b><strong>Google Cloud</strong><span>내 OAuth Client와 YouTube quota</span></div>
            <div><b>03</b><strong>YouTube 채널</strong><span>영상·자막 가져오기와 업로드</span></div>
            <div><b>04</b><strong>Subtitle Localizer</strong><span>SRT 번역과 구조 검증</span></div>
          </div>
          <div className="guide-callout"><strong>기억할 핵심</strong><p>ChatGPT 구독과 OpenAI API 결제는 별도입니다. Subtitle Localizer의 번역은 OpenAI API를 사용하므로 API Platform 쪽 결제 설정이 필요할 수 있습니다.</p><a href="https://help.openai.com/en/articles/9039756" target="_blank" rel="noreferrer">OpenAI API 결제 안내 보기 ↗</a></div>
        </section>

        <section id="openai" className="guide-section">
          <div className="guide-section-head"><span>OPENAI · BYOK</span><h2>1. 내 OpenAI API Key 연결하기</h2><p>API Key는 번역할 때만 사용합니다. 앱 운영자의 공용 키가 아니라 사용자가 만든 키를 연결합니다.</p></div>
          <div className="guide-explainer-grid"><div><span>누가 소유하나요?</span><strong>사용자 본인</strong><p>키를 만들고 폐기하는 권한도 사용자에게 있습니다.</p></div><div><span>비용은 어디로 가나요?</span><strong>사용자 OpenAI API 계정</strong><p>ChatGPT 구독료와 API 사용료는 별도입니다.</p></div><div><span>앱은 어디에 저장하나요?</span><strong>암호화 + HttpOnly cookie</strong><p>localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.</p></div></div>

          <div className="guide-steps">
            <Step number={1} title="OpenAI Platform의 API Keys 페이지를 엽니다."><p>OpenAI 계정으로 로그인한 뒤 API Keys 화면으로 이동합니다.</p><a className="guide-action-link" href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">OpenAI API Keys 열기 ↗</a></Step>
            <Step number={2} title="새 Secret Key를 만듭니다."><p>`Create new secret key`를 선택하고, 알아보기 쉬운 이름을 지정합니다. 예: <code>Subtitle Localizer</code>.</p><div className="guide-note"><strong>중요</strong><span>생성 직후 표시되는 전체 secret key를 바로 복사하세요. 나중에 전체 값을 다시 볼 수 없다면 새 키를 만든 뒤 기존 키를 폐기하는 방식이 안전합니다.</span></div></Step>
            <Step number={3} title="Subtitle Localizer의 연결 관리에 붙여넣습니다."><p>`내 OpenAI API Key` 카드의 입력란에 복사한 키를 붙여넣습니다. 실제 키 값을 문서나 GitHub에 남기지 마세요.</p><a className="guide-action-link" href="/connections?setup=openai&return=/guide">OpenAI 연결 관리 열기 →</a></Step>
            <Step number={4} title="필요하면 이 브라우저에 기억하기를 선택합니다."><p>체크하면 암호화된 HttpOnly cookie로 유지합니다. 브라우저 JavaScript가 secret 값을 직접 읽는 저장소에는 보관하지 않습니다.</p></Step>
            <Step number={5} title="키 연결을 누르고 상태를 확인합니다."><p>카드 오른쪽 상태가 <strong>연결됨</strong>으로 바뀌면 완료입니다. 이후 SRT를 불러와 번역을 시작할 수 있습니다.</p></Step>
          </div>

          <div className="guide-do-dont"><div><span>DO</span><strong>새 키는 생성 직후 복사</strong><p>비밀관리 앱처럼 본인만 접근할 수 있는 곳에 보관하세요.</p></div><div><span>DON'T</span><strong>실제 키를 공유하거나 커밋</strong><p>스크린샷, GitHub, 공개 문서, 채팅에 전체 값을 남기지 마세요.</p></div></div>
        </section>

        <section id="youtube" className="guide-section">
          <div className="guide-section-head"><span>GOOGLE CLOUD · BYOC</span><h2>2. YouTube 연결하기</h2><p>Google Cloud는 사용자가 직접 소유합니다. 앱은 초보자가 판단할 일을 줄이고 꼭 필요한 클릭과 입력만 순서대로 안내합니다.</p></div>
          <div className="guide-callout is-orange"><strong>최초 1회 설정</strong><p>아래 8단계를 한 번 완료하면 정상적인 추가 Google 계정/YouTube 채널 연결 때문에 프로젝트·API·OAuth Client를 다시 만들 필요가 없습니다.</p></div>

          <div className="guide-steps">
            <Step number={1} title="전용 Google Cloud 프로젝트를 만듭니다."><p>Google Cloud Console에서 새 프로젝트를 만들고 이름은 <code>Subtitle Localizer</code>를 권장합니다. 만든 뒤 상단 프로젝트 선택기에서 그 프로젝트가 실제로 선택되어 있는지 다시 확인하세요.</p><a className="guide-action-link" href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noreferrer">새 프로젝트 화면 열기 ↗</a></Step>
            <Step number={2} title="YouTube Data API v3를 사용 설정합니다."><p>현재 프로젝트가 <strong>Subtitle Localizer</strong>인지 확인한 뒤 `YouTube Data API v3`의 <strong>사용 설정</strong>을 누릅니다.</p><a className="guide-action-link" href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer">YouTube Data API v3 열기 ↗</a><p className="guide-complete">완료 기준 · `사용 설정됨` 또는 `Enabled`가 보입니다.</p></Step>
            <Step number={3} title="Google Auth Platform의 앱 정보와 Branding을 채웁니다."><p>처음이면 `시작하기`를 누르고 앱 이름은 <code>Subtitle Localizer</code>, 사용자 유형은 <strong>External</strong>로 설정합니다. 지원 이메일과 개발자 연락처에는 본인이 사용하는 이메일을 지정합니다.</p><div className="guide-values"><ValueBox label="홈페이지" value={APP_URL} /><ValueBox label="개인정보처리방침" value={PRIVACY_URL} /><ValueBox label="서비스 약관" value={TERMS_URL} /></div><a className="guide-action-link" href="https://console.cloud.google.com/auth/overview" target="_blank" rel="noreferrer">Google Auth Platform 열기 ↗</a></Step>
            <Step number={4} title="Audience / 게시 상태를 확인합니다."><p>여러 계정을 연결할 계획이면 <strong>In Production</strong>을 권장합니다. Testing 상태에서는 Test users에 없는 Google 계정이 <code>403 access_denied</code>로 막힐 수 있습니다.</p><div className="guide-note"><strong>Testing을 유지한다면</strong><span>실제로 로그인할 Google 계정을 Test users에 추가해야 합니다. 계정이 늘 때마다 다시 관리해야 할 수 있습니다.</span></div><a className="guide-action-link" href="https://console.cloud.google.com/auth/audience" target="_blank" rel="noreferrer">Audience 열기 ↗</a></Step>
            <Step number={5} title="YouTube 권한 하나를 추가합니다."><p>Data Access에서 `범위 추가 또는 삭제`를 누르고 아래 scope를 선택한 뒤 `업데이트`와 `저장`까지 완료합니다.</p><ValueBox label="추가할 scope" value={YOUTUBE_SCOPE} /><a className="guide-action-link" href="https://console.cloud.google.com/auth/scopes" target="_blank" rel="noreferrer">Data Access 열기 ↗</a></Step>
            <Step number={6} title="OAuth Client를 Web application으로 만듭니다."><p>Clients에서 `+ 클라이언트 만들기`를 누르고 유형은 <strong>Web application</strong>, 이름은 <code>Subtitle Localizer Web</code>을 권장합니다.</p><div className="guide-do-dont"><div><span>비워두세요</span><strong>Authorized JavaScript origins</strong><p>여기에는 Subtitle Localizer 주소를 넣지 않습니다.</p></div><div><span>여기에 넣으세요</span><strong>Authorized redirect URIs</strong><ValueBox label="callback" value={REDIRECT_URI} /></div></div><div className="guide-note"><strong>redirect_uri_mismatch가 뜬다면</strong><span>scheme, 도메인, 경로, 마지막 슬래시까지 Google에 등록한 URI와 앱의 redirect URI가 정확히 일치해야 합니다.</span></div><a className="guide-action-link" href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noreferrer">Clients 열기 ↗</a></Step>
            <Step number={7} title="Client ID와 Client Secret을 앱에 저장합니다."><p>Google이 발급한 값을 `연결 관리`의 7단계 입력칸에 넣습니다. Client Secret 역시 실제 값을 문서·GitHub·스크린샷에 남기지 않습니다.</p><p className="guide-complete">완료 기준 · 앱이 `Cloud Client를 저장했습니다` 상태로 넘어갑니다.</p></Step>
            <Step number={8} title="Google로 첫 YouTube 채널을 연결합니다."><p>마지막 단계에서 Google 연결 버튼을 누르고 사용할 계정을 선택한 뒤 YouTube 권한을 승인합니다. 앱으로 돌아왔을 때 채널 이름과 `현재 작업 채널`이 보이면 완료입니다.</p><p className="guide-complete">완료 기준 · 연결 관리 채널과 작업공간 상단 채널이 같은 채널을 가리킵니다.</p></Step>
          </div>
        </section>

        <section id="after-connect" className="guide-section">
          <div className="guide-section-head"><span>AFTER SETUP</span><h2>3. 연결이 끝났다면 이렇게 사용합니다.</h2></div>
          <div className="guide-next-grid"><div><b>01</b><strong>SRT 파일 번역</strong><p>원본 자막 → SRT 파일 → 번역 언어 → 번역 시작</p></div><div><b>02</b><strong>YouTube 자막 가져오기</strong><p>원본 자막 → YouTube 자막 → 영상/트랙 선택 → SRT 가져오기</p></div><div><b>03</b><strong>YouTube에 올리기</strong><p>번역 완료 → 영상 선택 → 언어 선택 → 자막 YouTube에 올리기</p></div><div><b>04</b><strong>다른 채널 사용</strong><p>연결 관리에서 계정/채널 추가 후 상단 현재 작업 채널을 전환</p></div></div>
          <div className="guide-section-actions"><a className="guide-primary" href="/">작업 시작하기</a><a className="guide-secondary" href="/connections">연결 상태 확인</a></div>
        </section>

        <section id="troubleshooting" className="guide-section">
          <div className="guide-section-head"><span>TROUBLESHOOTING</span><h2>4. 자주 막히는 지점</h2></div>
          <div className="guide-faq">
            <details><summary>OpenAI 연결은 됐는데 번역 중 API Key 오류가 납니다.</summary><p>저장된 키가 폐기되었거나 사용할 수 없는 상태일 수 있습니다. OpenAI Platform에서 새 키를 만든 뒤 연결 관리에서 `키 교체`를 사용하세요.</p></details>
            <details><summary>Google 로그인에서 403 access_denied가 나옵니다.</summary><p>Google Auth Platform이 Testing 상태라면 현재 계정이 Test users에 있는지 확인하세요. 여러 계정을 계속 연결하려면 Branding을 완료한 뒤 In Production 상태를 사용하는 흐름을 권장합니다.</p></details>
            <details><summary>redirect_uri_mismatch가 나옵니다.</summary><p>OAuth Client의 Authorized redirect URIs에 <code>{REDIRECT_URI}</code>가 정확히 등록되어 있는지 확인하세요. JavaScript origins 칸에 넣으면 해결되지 않습니다.</p></details>
            <details><summary>`확인되지 않은 앱` 경고가 보입니다.</summary><p>사용자가 직접 만든 미검증 OAuth 앱에서는 Google의 경고가 나타날 수 있습니다. 이는 Client ID/Secret 오타나 Testing의 403 문제와는 구분해야 합니다.</p></details>
            <details><summary>Google 계정은 연결했는데 영상이 0개입니다.</summary><p>현재 작업 채널에 실제로 업로드된 영상이 있는지 확인하세요. 채널이 다르면 상단 현재 작업 채널을 전환한 뒤 다시 불러오세요.</p></details>
            <details><summary>Cloud 설정을 전부 다시 해야 하나요?</summary><p>일반적인 추가 계정/채널 연결 때문이라면 아닙니다. OAuth Client 삭제, Client Secret 교체, 프로젝트/API 삭제 같은 예외에서만 기존 Cloud Client를 지우고 재설정하는 편이 맞습니다.</p></details>
          </div>
        </section>

        <section id="security" className="guide-section">
          <div className="guide-section-head"><span>SECURITY & COST</span><h2>5. 누가 무엇을 소유하고 비용을 부담하나요?</h2></div>
          <div className="guide-table" role="table" aria-label="보안과 비용 요약">
            <div className="guide-table-row head" role="row"><span>항목</span><span>소유·비용</span><span>앱의 처리</span></div>
            <div className="guide-table-row" role="row"><strong>OpenAI API Key</strong><span>사용자 OpenAI 계정</span><span>서버 암호화 + HttpOnly cookie</span></div>
            <div className="guide-table-row" role="row"><strong>Google OAuth Client</strong><span>사용자 Google Cloud 프로젝트</span><span>Client 정보 암호화 저장</span></div>
            <div className="guide-table-row" role="row"><strong>YouTube quota</strong><span>사용자 Google Cloud 프로젝트</span><span>활성 채널 OAuth 세션으로 API 호출</span></div>
            <div className="guide-table-row" role="row"><strong>SRT 파일</strong><span>사용자 파일</span><span>서버 영구 파일 저장소에 보관하지 않음</span></div>
          </div>
          <div className="guide-final"><strong>설정이 끝났습니다.</strong><p>OpenAI와 YouTube 상태가 모두 연결됨이면 이제 실제 자막 작업만 진행하면 됩니다.</p><a className="guide-primary" href="/">Subtitle Localizer 시작하기</a></div>
        </section>
      </div>
    </div>
  </main>;
}
