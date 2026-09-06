import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 약관 · Subtitle Localizer",
  description: "Subtitle Localizer 서비스 이용 조건"
};

export default function TermsPage() {
  return (
    <main className="legal-shell">
      <header className="legal-topbar">
        <a href="/" className="legal-brand"><span>S</span><strong>Subtitle Localizer</strong></a>
        <a href="/" className="legal-back">작업으로 돌아가기</a>
      </header>

      <article className="legal-document">
        <div className="legal-hero">
          <span>TERMS OF SERVICE</span>
          <h1>서비스 약관</h1>
          <p>Subtitle Localizer를 사용할 때 적용되는 기본 이용 조건과 BYOK/BYOC 비용 구조를 설명합니다.</p>
          <small>시행일: 2026년 9월 6일</small>
        </div>

        <section>
          <h2>1. 서비스 내용</h2>
          <p>Subtitle Localizer는 SRT 자막을 여러 언어로 현지화하고, 사용자가 승인한 YouTube 채널에서 자막을 가져오거나 번역된 자막을 업로드할 수 있게 하는 도구입니다.</p>
          <p>서비스는 자막의 cue ID와 타임코드 보존을 우선하며 번역 결과 검토와 SRT/ZIP 다운로드 기능을 제공합니다.</p>
        </section>

        <section>
          <h2>2. 사용자 소유 API 연결</h2>
          <p>서비스는 BYOK/BYOC 구조를 사용합니다. 사용자는 자신의 OpenAI API Key와 자신의 Google Cloud OAuth Client를 연결합니다.</p>
          <ul>
            <li>OpenAI API 사용료는 사용자가 입력한 OpenAI API Key의 계정에 귀속됩니다.</li>
            <li>YouTube Data API quota는 사용자가 설정한 Google Cloud 프로젝트에 귀속됩니다.</li>
            <li>운영자 소유 OpenAI API Key, Google OAuth Client 또는 YouTube quota를 사용자 대신 제공하지 않습니다.</li>
          </ul>
        </section>

        <section>
          <h2>3. Google / YouTube 연결</h2>
          <p>사용자는 자신의 Google Cloud 프로젝트에서 YouTube Data API와 OAuth Client를 설정하고 필요한 YouTube 권한을 직접 승인합니다.</p>
          <p>여러 Google 계정을 Test user 재등록 없이 추가하려면 Google Auth Platform의 Branding과 Publishing 설정을 완료해야 할 수 있습니다. Google의 정책, 화면 구성 또는 승인 절차가 변경되면 연결 흐름도 영향을 받을 수 있습니다.</p>
        </section>

        <section>
          <h2>4. 콘텐츠와 권한</h2>
          <p>사용자는 업로드, 번역, 다운로드 또는 YouTube에 게시하는 자막과 영상에 대해 필요한 권한을 보유해야 합니다. 제3자의 저작권, 상표권, 개인정보 또는 기타 권리를 침해하는 콘텐츠를 처리하거나 게시해서는 안 됩니다.</p>
          <p>번역 결과는 자동 생성 결과이므로 게시 전에 문맥, 고유명사, 전문용어, 숫자와 민감한 표현을 사용자가 직접 확인하는 것을 권장합니다.</p>
        </section>

        <section>
          <h2>5. 금지되는 사용</h2>
          <ul>
            <li>서비스 또는 외부 API를 고의로 방해하거나 비정상적인 부하를 발생시키는 행위</li>
            <li>타인의 API Key, OAuth Client, YouTube 계정 또는 채널을 허가 없이 사용하는 행위</li>
            <li>법령이나 제3자 서비스의 이용 조건을 위반하는 방식으로 서비스를 사용하는 행위</li>
            <li>서비스의 보안 기능을 우회하거나 비밀정보를 탈취하려는 행위</li>
          </ul>
        </section>

        <section>
          <h2>6. 외부 서비스와 가용성</h2>
          <p>번역은 OpenAI API에, YouTube 기능은 Google OAuth와 YouTube Data API에 의존합니다. 외부 서비스의 장애, 정책 변경, quota 제한, 계정 상태 또는 권한 설정에 따라 일부 기능이 지연되거나 사용할 수 없을 수 있습니다.</p>
          <p>서비스 기능은 품질과 보안을 개선하기 위해 변경될 수 있으며, 중요한 구조 변경은 버전과 문서에 반영합니다.</p>
        </section>

        <section>
          <h2>7. 데이터와 보안</h2>
          <p>비밀정보 처리와 자막 데이터의 저장 방식은 공개된 개인정보처리방침을 따릅니다.</p>
          <a className="legal-external-link" href="/privacy">개인정보처리방침 보기 →</a>
        </section>

        <section>
          <h2>8. 연결 해제와 사용 중단</h2>
          <p>사용자는 언제든 연결 관리에서 OpenAI Key, 개별 YouTube 채널 또는 Google Cloud Client 설정을 삭제할 수 있습니다. Google 계정에서도 Subtitle Localizer에 부여한 OAuth 권한을 직접 철회할 수 있습니다.</p>
        </section>

        <section>
          <h2>9. 약관 변경</h2>
          <p>서비스 기능이나 운영 구조가 달라지면 이 약관을 갱신할 수 있습니다. 변경된 내용은 이 페이지의 최신 시행일과 함께 공개합니다.</p>
        </section>

        <section>
          <h2>10. 문의</h2>
          <p>서비스 이용에 관한 문의와 오류 제보는 Subtitle Localizer 프로젝트의 공개 지원 채널을 이용할 수 있습니다.</p>
          <a className="legal-external-link" href="https://github.com/paran-coder/subtitle-localizer/issues" target="_blank" rel="noreferrer">GitHub Issues 열기 ↗</a>
        </section>
      </article>
    </main>
  );
}
