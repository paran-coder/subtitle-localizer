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

## 초보자용 Google 연결 마법사
- [ ] 기존 4단계를 8단계 완결형 마법사로 재구성
- [ ] 한 화면에서 한 행동만 주 CTA로 제공
- [ ] 프로젝트 이름 기본값 `Subtitle Localizer` 제공
- [ ] YouTube Data API v3 정확한 이동 링크 제공
- [ ] Google Auth Platform 초기 설정을 실제 버튼 순서대로 안내
- [ ] `In Production` 전환을 권장 단계로 안내
- [ ] Testing 유지 시 제약을 짧게 표시
- [ ] `youtube.force-ssl` scope 복사 기능
- [ ] OAuth Client 유형/이름 고정값 제공
- [ ] `Authorized JavaScript origins`는 비워두도록 강하게 안내
- [ ] `Authorized redirect URIs` 위치를 명확히 구분
- [ ] Client ID / Secret만 필수 입력
- [ ] 첫 OAuth 성공 후 실제 YouTube channel ID/title 확인
- [ ] 실제 채널 API 호출 성공까지 설정 완료 조건으로 사용

## Google Cloud 재설정 없는 추가 연결
- [ ] 첫 설정 후 `+ 계정 또는 채널 추가`에서 Google Cloud 재설정 요구 없음
- [ ] Cloud config와 YouTube channel connection을 데이터 구조상 분리
- [ ] Cloud config 하나를 여러 채널 연결이 재사용
- [ ] 정상적인 계정/채널 추가에서는 프로젝트/API/scope/redirect URI 설정 재요구 없음
- [ ] 복구 상황과 정상 추가 연결을 UI에서 구분

## 다중 YouTube 연결
- [ ] 채널별 connectionId 저장
- [ ] 채널별 channelId/title/thumbnail 저장
- [ ] 채널별 access/refresh token 독립 저장
- [ ] 같은 channelId 재연결 시 중복 대신 갱신
- [ ] 기존 채널 A를 유지한 채 B/C 계속 추가
- [ ] 특정 채널 연결 해제 시 다른 채널 유지
- [ ] Google Cloud 설정 전체 삭제 시 모든 YouTube 연결 제거
- [ ] 활성 채널 선택 API
- [ ] 작업공간 채널 선택기
- [ ] 활성 채널 변경 시 영상/자막 선택 상태 초기화
- [ ] 영상 조회/자막 다운로드/자막 업로드가 같은 활성 채널 사용

## 빈 채널 UX
- [ ] YouTube 채널 없음과 업로드 영상 0개를 구분
- [ ] 영상 0개일 때 원인 설명
- [ ] `YouTube Studio 열기` CTA
- [ ] `다시 불러오기` CTA

## 보안
- [ ] 운영자 Google OAuth 자격증명 추가 없음
- [ ] Google Client Secret 서버 암호화 유지
- [ ] YouTube access/refresh token 서버 암호화 유지
- [ ] HttpOnly cookie 유지
- [ ] localStorage/sessionStorage 비밀정보 저장 0건
- [ ] OAuth state 검증 유지
- [ ] refresh token 갱신 회귀 없음

## 회귀 검증
- [ ] OpenAI BYOK 동작 유지
- [ ] 기존 SRT 업로드/샘플 동작 유지
- [ ] 번역/검증/다운로드 동작 유지
- [ ] 채널 A 추가 후 B 추가 시 A 유지 테스트
- [ ] 동일 채널 재연결 중복 방지 테스트
- [ ] 활성 채널 전환 테스트
- [ ] 채널별 영상 목록 분리 테스트
- [ ] 채널별 자막 다운로드 테스트
- [ ] 채널별 자막 업로드 테스트
- [ ] OAuth 오류 복구 테스트
- [ ] 채널 없음/영상 없음 상태 테스트
- [ ] 모바일 가로 overflow 없음
- [ ] focus-visible 유지
- [ ] prefers-reduced-motion 유지
- [ ] npm test 통과
- [ ] npm run typecheck 통과
- [ ] npm run build 통과

## 패키징 / 배포
- [ ] 전체 프로젝트 ZIP 생성
- [ ] ZIP은 GitHub에 커밋하지 않음
- [ ] 실제 변경 파일만 GitHub main 반영
- [ ] Vercel Production READY 확인
- [ ] Vercel Runtime Errors 확인
- [ ] 실제 Google 연결 E2E
- [ ] 첫 채널 연결 E2E
- [ ] 추가 계정/채널 연결 E2E
- [ ] 채널 전환 E2E
- [ ] 영상 가져오기 → 번역 → YouTube 자막 업로드 E2E

## 단계별 자체 점검 기록
### 1단계 — 문서 / 아키텍처
- 상태: **완료**
- 확인: 초보자 우선, 운영자 비관여, BYOC 유지, Cloud 설정 1회, `In Production` 권장, 다중 채널 누적 연결, 활성 채널 일관성, 빈 채널 UX, 보안/비용 원칙을 4개 문서에 일치시킴
- 개선: `Testing`을 강제 제거하지 않고 `In Production`을 권장 경로로 정리해 실제 사용자 선택권을 유지함
- 자체 점수: **9.8/10**

### 2단계 — 연결 데이터 모델 / OAuth API
- 상태: 대기

### 3단계 — Google 설정 마법사 / 작업공간 UI
- 상태: 대기

### 4단계 — 테스트 / 패키징 / 배포
- 상태: 대기
