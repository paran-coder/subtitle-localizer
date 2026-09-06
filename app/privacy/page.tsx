import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 · Subtitle Localizer",
  description: "Subtitle Localizer의 개인정보 및 연결 자격증명 처리 방침"
};

export default function PrivacyPage() {
  return (
    <main className="legal-shell">
      <header className="legal-topbar">
        <a href="/" className="legal-brand"><span>S</span><strong>Subtitle Localizer</strong></a>
        <a href="/" className="legal-back">작업으로 돌아가기</a>
      </header>

      <article className="legal-document">
        <div className="legal-hero">
          <span>PRIVACY POLICY</span>
          <h1>개인정보처리방침</h1>
          <p>Subtitle Localizer가 자막 번역과 YouTube 연결을 제공하기 위해 어떤 정보를 처리하고 어떻게 보관하는지 설명합니다.</p>
          <small>시행일: 2026년 9월 6일</small>
        </div>

        <section>
          <h2>1. 서비스와 처리 원칙</h2>
          <p>Subtitle Localizer는 사용자가 자신의 OpenAI API Key와 자신의 Google Cloud OAuth Client를 연결해 SRT 자막을 번역하고 YouTube 자막을 가져오거나 업로드할 수 있게 하는 BYOK/BYOC 방식의 웹앱입니다.</p>
          <p>운영자 소유 OpenAI API Key, Google OAuth Client 또는 YouTube quota를 사용자 대신 사용하지 않습니다.</p>
        </section>

        <section>
          <h2>2. 처리하는 정보</h2>
          <ul>
            <li><strong>OpenAI 연결 정보:</strong> 사용자가 직접 입력한 OpenAI API Key와 기억하기 설정</li>
            <li><strong>Google Cloud 연결 정보:</strong> 사용자가 직접 입력한 OAuth Client ID, Client Secret과 기억하기 설정</li>
            <li><strong>YouTube 인증 정보:</strong> Google OAuth 과정에서 발급된 access token, refresh token, 만료 시각과 scope</li>
            <li><strong>YouTube 채널 정보:</strong> 연결한 채널 ID, 채널 이름, 썸네일, 연결 시각과 사용자가 선택한 현재 작업 채널</li>
            <li><strong>YouTube 작업 정보:</strong> 영상 목록, 자막 트랙 메타데이터, 자막 가져오기·업로드에 필요한 데이터</li>
            <li><strong>자막 내용:</strong> 사용자가 업로드하거나 YouTube에서 가져온 SRT의 자막 텍스트와 타임코드</li>
          </ul>
        </section>

        <section>
          <h2>3. 정보의 이용 목적</h2>
          <ul>
            <li>사용자가 선택한 언어로 자막을 번역하고 SRT 구조를 검증하기 위해 사용합니다.</li>
            <li>사용자가 승인한 YouTube 채널의 영상과 자막을 조회하고 번역된 자막을 업로드하기 위해 사용합니다.</li>
            <li>사용자가 선택한 연결 상태를 같은 브라우저에서 유지하기 위해 사용합니다.</li>
            <li>연결 오류와 요청 실패를 사용자에게 안내하기 위해 필요한 범위에서 처리합니다.</li>
          </ul>
        </section>

        <section>
          <h2>4. 외부 서비스로 전달되는 정보</h2>
          <p><strong>OpenAI:</strong> 번역을 실행할 때 필요한 자막 텍스트와 번역 설정이 사용자가 연결한 OpenAI API를 통해 처리됩니다. OpenAI API 비용은 사용자가 입력한 API Key의 계정에 귀속됩니다.</p>
          <p><strong>Google / YouTube:</strong> 로그인, 채널 확인, 영상·자막 조회, 자막 다운로드와 업로드에 필요한 정보가 Google OAuth 및 YouTube Data API를 통해 처리됩니다. YouTube API quota는 사용자가 설정한 Google Cloud 프로젝트에 귀속됩니다.</p>
          <p><strong>Vercel:</strong> 웹앱과 서버 기능을 제공하기 위한 호스팅 인프라로 사용됩니다.</p>
        </section>

        <section>
          <h2>5. 저장 방식과 보관</h2>
          <p>OpenAI API Key, Google OAuth Client Secret, YouTube access/refresh token과 같은 비밀정보는 서버에서 암호화한 뒤 HttpOnly cookie로 저장합니다. JavaScript에서 직접 읽을 수 있는 localStorage나 sessionStorage에는 비밀정보를 저장하지 않습니다.</p>
          <p>`이 브라우저에 기억하기`를 끄면 연결 정보는 세션 cookie로 동작하고, 켜면 제한된 기간 동안 유지되는 cookie로 저장됩니다. 사용자는 연결 관리 화면에서 저장된 OpenAI Key와 Google/YouTube 연결을 직접 삭제할 수 있습니다.</p>
          <p>사용자가 올린 SRT 파일 자체를 서비스의 영구 파일 저장소에 보관하도록 설계하지 않았습니다. 번역과 API 요청을 처리하는 동안 자막 내용이 브라우저, 서버 실행 메모리와 외부 API 요청을 거칠 수 있습니다.</p>
        </section>

        <section>
          <h2>6. 사용자가 할 수 있는 것</h2>
          <ul>
            <li>연결 관리에서 저장된 OpenAI API Key를 삭제할 수 있습니다.</li>
            <li>개별 YouTube 채널 연결만 해제할 수 있습니다.</li>
            <li>Google Cloud Client 설정과 그 설정에 연결된 모든 YouTube 채널을 함께 삭제할 수 있습니다.</li>
            <li>Google 계정에서 Subtitle Localizer의 OAuth 권한을 직접 철회할 수 있습니다.</li>
            <li>브라우저의 cookie를 삭제해 해당 브라우저에 저장된 연결 상태를 제거할 수 있습니다.</li>
          </ul>
        </section>

        <section>
          <h2>7. 보안</h2>
          <p>비밀정보는 서버 측 암호화와 HttpOnly cookie를 사용해 보호하며, 실제 자격증명을 Git 저장소에 포함하지 않습니다. OAuth 요청에는 state 검증을 적용하고 YouTube refresh token 갱신을 서버에서 처리합니다.</p>
        </section>

        <section>
          <h2>8. 방침 변경</h2>
          <p>서비스 기능이나 데이터 처리 방식이 바뀌면 이 페이지의 내용을 함께 갱신합니다. 중요한 변경은 최신 시행일과 함께 반영합니다.</p>
        </section>

        <section>
          <h2>9. 문의</h2>
          <p>서비스 동작이나 개인정보 처리에 관한 문의는 Subtitle Localizer 프로젝트의 공개 지원 채널을 이용할 수 있습니다.</p>
          <a className="legal-external-link" href="https://github.com/paran-coder/subtitle-localizer/issues" target="_blank" rel="noreferrer">GitHub Issues 열기 ↗</a>
        </section>
      </article>
    </main>
  );
}
