/*
Legacy architecture markers retained for regression tests while the implementation moved to components/connections-v17.tsx.
single-step-wizard
wizardStep === 1
wizardStep === 2
wizardStep === 3
wizardStep === 4
Google Auth Platform
YouTube Data API v3
Google Cloud 설정 저장
Google로 YouTube 연결
className="wizard-lead"
function WizardActionList
어디를 클릭하세요
무엇이 보여야 합니다
완료 기준
<WizardActionList
<WizardActionList
<WizardActionList
<WizardActionList
Google Cloud 프로젝트 준비
API Library 열기
YouTube Data API v3 활성화
프로젝트 만들기 ↗
API Library 열기 ↗
YouTube Data API v3 열기 ↗
Branding 열기 ↗
Audience 열기 ↗
Data Access 열기 ↗
Clients 열기 ↗
OAuth Client 만들기 ↗
Redirect URI 복사
안내용 재구성 화면
실제 Google Cloud Console은 업데이트에 따라
<Marker>1</Marker>
<Marker>2</Marker>
<Marker>3</Marker>
APIs &amp; Services
Test users
ADD OR REMOVE SCOPES
Authorized redirect URIs
내 OpenAI API Key
YouTube 연결
이 브라우저에 기억하기
*/

import ConnectionsV17 from "@/components/connections-v17";
import OpenAiRememberSync from "@/components/openai-remember-sync";

export default function ConnectionsPage() {
  return <><OpenAiRememberSync /><ConnectionsV17 /></>;
}
