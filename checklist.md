# checklist.md — Subtitle Localizer v1.7.0

## 작업 전
- [x] v1.7.0 범위 승인
- [x] 운영자 비관여 원칙 확정
- [x] 사용자 BYOC 유지
- [x] 초기 Google Cloud 설정 1회 원칙 확정
- [x] 다중 Google 계정 / YouTube 채널 지원 원칙 확정
- [x] `In Production` 전환을 권장 경로로 채택
- [x] context-notes.md 갱신
- [x] checklist.md 갱신
- [x] README.md 갱신
- [x] User manual.md 갱신
- [x] v1.6 기존 Cloud config 보존 + YouTube 세션 자동 마이그레이션 규칙 승인
- [x] 마이그레이션 실패 시 Cloud config는 보존하고 YouTube 재로그인만 요구하도록 승인
- [x] 실제 추가 Google 계정 E2E에서 Testing 상태의 `403 access_denied` 확인
- [x] Google Branding의 앱 도메인 공개 URL 보강 필요 확인

## 초보자용 Google 연결 마법사
- [x] 기존 4단계를 8단계 완결형 마법사로 재구성
- [x] 한 화면에서 한 행동만 주 CTA로 제공
- [x] 프로젝트 이름 기본값 `Subtitle Localizer` 제공
- [x] YouTube Data API v3 정확한 이동 링크 제공
- [x] Google Auth Platform 초기 설정을 실제 버튼 순서대로 안내
- [x] `In Production` 전환을 권장 단계로 안내
- [x] Testing 유지 시 제약을 짧게 표시
- [x] `youtube.force-ssl` scope 복사 기능
- [x] OAuth Client 유형/이름 고정값 제공
- [x] `Authorized JavaScript origins`는 비워두도록 강하게 안내
- [x] `Authorized redirect URIs` 위치를 명확히 구분
- [x] Client ID / Secret만 필수 입력
- [x] 첫 OAuth 성공 후 실제 YouTube channel ID/title 확인
- [x] 실제 OAuth callback에서 승인된 YouTube channel ID/title 식별 API 구현
- [ ] Branding 단계에서 홈페이지 / 개인정보처리방침 / 서비스 약관 URL을 정확히 안내
- [ ] Client 저장만으로 Publishing 완료를 단정하지 않도록 완료 문구 수정

## 공개 OAuth 정책 페이지
- [ ] `/privacy` 공개 페이지 추가
- [ ] `/terms` 공개 페이지 추가
- [ ] 메인 화면에서 개인정보처리방침 / 서비스 약관 링크 제공
- [ ] 연결 관리 화면에서도 정책 페이지 링크 제공
- [ ] 홈페이지 URL `https://subtitle-localizer.vercel.app/` 안내
- [ ] 개인정보처리방침 URL `https://subtitle-localizer.vercel.app/privacy` 안내
- [ ] 서비스 약관 URL `https://subtitle-localizer.vercel.app/terms` 안내
- [ ] 정책 페이지에 BYOK/BYOC, HttpOnly 암호화, OpenAI/Google API 처리, SRT 비영구 저장 원칙 반영
- [ ] 정책 페이지 모바일/focus-visible 확인

## Google Cloud 재설정 없는 추가 연결
- [x] 첫 설정 후 `+ 계정 또는 채널 추가` UI에서 Google Cloud 재설정 요구 없음
- [x] Cloud config와 YouTube channel connection을 데이터 구조상 분리
- [x] Cloud config 하나를 여러 채널 연결이 재사용
- [x] 추가 OAuth에서 기존 Cloud config를 그대로 재사용하는 API 구조 구현
- [x] 정상적인 계정/채널 추가와 복구 상황을 UI에서 구분
- [x] v1.6 Cloud config를 그대로 보존하는 자동 마이그레이션 구현
- [x] 자동 마이그레이션 실패 시 기존 Cloud config 보존 + legacy YouTube 세션만 정리
- [ ] Branding 완료 + `In Production` 전환 후 새 Google 계정 연결 E2E 재검증

## 다중 YouTube 연결
- [x] 채널별 connectionId 저장
- [x] 채널별 channelId/title/thumbnail 저장
- [x] 채널별 access/refresh token 독립 저장
- [x] 같은 channelId 재연결 시 중복 대신 갱신
- [x] 기존 채널 A를 유지한 채 B/C 계속 추가하는 registry 구조
- [x] 특정 채널 연결 해제 시 다른 채널 유지
- [x] Google Cloud 설정 전체 삭제 시 모든 YouTube 연결 제거
- [x] 활성 채널 선택 API
- [x] 작업공간 채널 선택기
- [x] 활성 채널 변경 시 영상/자막 선택 상태 초기화
- [x] 영상 조회/자막 다운로드/자막 업로드 API가 같은 활성 채널 세션 사용

## 빈 채널 UX
- [x] OAuth callback에서 YouTube 채널 없음 상태를 별도 오류로 구분
- [x] YouTube 채널 없음과 업로드 영상 0개를 UI에서 구분
- [x] 영상 0개일 때 원인 설명
- [x] `YouTube Studio 열기` CTA
- [x] `다시 불러오기` CTA

## 보안
- [x] 운영자 Google OAuth 자격증명 추가 없음
- [x] Google Client Secret 서버 암호화 유지
- [x] YouTube access/refresh token 서버 암호화 유지
- [x] HttpOnly cookie 유지
- [x] localStorage/sessionStorage 비밀정보 저장 0건
- [x] OAuth state 검증 유지
- [x] refresh token 갱신 로직 유지
- [x] OAuth Client 자체 변경/삭제 시 이전 Client에 종속된 채널 토큰 정리

## 회귀 검증
- [x] OpenAI BYOK 동작 유지
- [x] 기존 SRT 업로드/샘플 동작 유지
- [x] 번역/검증/다운로드 동작 유지
- [x] 다중 registry 암호화/선택/삭제 단위 테스트
- [x] 동일 채널 재연결 중복 방지 단위 테스트
- [x] 활성 채널 세션 선택 단위 테스트
- [x] v1.6 legacy 세션 fallback 단위 테스트
- [x] 다중 채널 API 구조 architecture 테스트
- [ ] 공개 정책 페이지/링크 테스트 추가
- [ ] Publishing 안내 회귀 테스트 추가
- [ ] 실제 채널 A 추가 후 B 추가 시 A 유지 E2E
- [ ] 동일 채널 재연결 E2E
- [ ] 활성 채널 전환 E2E
- [ ] 채널별 영상 목록 분리 E2E
- [ ] 채널별 자막 다운로드 E2E
- [ ] 채널별 자막 업로드 E2E
- [x] OAuth 오류 `403 access_denied` 원인 확인 E2E
- [x] 영상 없음 UI E2E
- [ ] 모바일 가로 overflow 없음
- [ ] focus-visible 유지
- [ ] prefers-reduced-motion 유지
- [x] Production에서 자동 테스트 **67/67 통과** 이력
- [x] Vercel `next build` TypeScript 검사 통과 이력
- [x] Vercel Production build 통과 이력

## 패키징 / 배포
- [ ] 전체 프로젝트 ZIP 생성
- [ ] ZIP은 GitHub에 커밋하지 않음
- [ ] 최종 v1.7.0 변경 전체를 GitHub main에 반영
- [x] 2단계 API 변경 GitHub main 반영
- [x] 3단계 UI 변경 GitHub main 반영
- [x] 최신 기존 커밋 `386b5fc4f1c06c30e38cbd401bdc40a64f7dbe0f` Production READY 확인
- [x] 해당 상태에서 Runtime Errors 없음 확인
- [ ] 공개 정책 페이지 변경 후 최종 Vercel Production READY 확인
- [ ] 공개 정책 페이지 변경 후 최종 Runtime Errors 확인
- [x] 기존 Google 연결 E2E
- [x] 첫 채널 연결 유지 E2E
- [ ] 추가 계정/채널 연결 E2E — Testing 상태 때문에 현재 차단
- [ ] 채널 전환 E2E
- [ ] 영상 가져오기 → 번역 → YouTube 자막 업로드 E2E

## 단계별 자체 점검 기록
### 1단계 — 문서 / 아키텍처
- 상태: **완료**
- 확인: 초보자 우선, 운영자 비관여, BYOC 유지, Cloud 설정 1회, `In Production` 권장, 다중 채널 누적 연결, 활성 채널 일관성, 빈 채널 UX, 보안/비용 원칙을 4개 문서에 일치시킴
- 개선: `Testing`을 강제 제거하지 않고 `In Production`을 권장 경로로 정리해 실제 사용자 선택권을 유지함
- 자체 점수: **9.8/10**

### 2단계 — 연결 데이터 모델 / OAuth API
- 상태: **완료**
- 완료: Cloud config와 채널 세션 분리, encrypted registry, 채널별 세션 cookie, 활성 채널 API, 추가/선택/개별 해제, 동일 채널 dedupe, OAuth callback 채널 식별, v1.6 자동 마이그레이션, 실패 시 Cloud config 보존, 영상·자막 API 활성 세션 공통 사용
- 자체 리뷰 수정: invalid session 정리 cookie가 실제 응답에 반영되도록 status 정리 로직 수정, registry type 안정화, cookie prefix 상수화, 테스트 import 정리
- 검증: 자동 테스트/TypeScript/build/Production READY/Runtime Error 확인 완료
- 남은 확인: 동일 Google 계정의 여러 Brand Account 채널 선택 실제 E2E, 매우 많은 채널 연결 시 cookie 규모 최적화 여부
- 자체 점수: **9.6/10**

### 3단계 — Google 설정 마법사 / 작업공간 UI
- 상태: **구현 완료, E2E 보완 중**
- 완료: 8단계 마법사, 다중 채널 관리, 작업공간 채널 바, 썸네일, 빈 영상 UX
- E2E 발견: Client 저장 여부만 보고 `Google Cloud 설정은 끝났습니다`라고 표시했지만 실제 Google OAuth 앱은 Testing 상태였고 새 계정은 `403 access_denied`로 차단됨
- 보완 방향: 공개 정책 페이지를 제공하고 Branding URL 등록 → Audience `In Production` 흐름을 마법사와 연결 관리 화면에 반영
- 현재 자체 점수: **9.2/10**

### 4단계 — 공개 정책 / Publishing 보완
- 상태: **진행 중**

### 5단계 — 최종 테스트 / 패키징 / 배포
- 상태: 대기
