# checklist.md — Subtitle Localizer v1.7.0

## v1.7.0 핵심 범위
- [x] 운영자 비관여 BYOC 원칙 유지
- [x] Google Cloud 최초 1회 설정 원칙
- [x] 초보자용 Google 연결 마법사
- [x] 다중 Google 계정 / YouTube 채널 연결
- [x] 채널별 OAuth 세션 독립 저장
- [x] 활성 채널 선택 및 작업공간 동기화
- [x] 빈 채널 UX
- [x] 공개 `/privacy` / `/terms`
- [x] Branding / In Production 안내
- [x] 실제 자막 업로드/재가져오기 E2E

## 실제 OAuth / 다중 채널 E2E
- [x] Testing 상태 새 계정 `403 access_denied` 재현
- [x] Branding 공개 URL 저장
- [x] Audience `In Production` 전환
- [x] 미검증 앱 경고 통과 후 새 Google 계정 연결
- [x] 기존 채널 유지 상태에서 두 번째 채널 추가
- [x] 두 채널 사이 활성 채널 전환
- [x] 상단 작업 채널과 업로드 패널 채널 일치
- [x] 채널별 영상 목록 분리 확인
- [x] 영상 0개 빈 상태 확인

## 실제 자막 파이프라인 E2E
- [x] 테스트 영상 `subtitle-localizer-e2e-test.mp4` YouTube 업로드
- [x] 원본 `localization-challenge-en.srt` 30 cue 로드
- [x] 한국어 번역 완료
- [x] 타임코드 30/30 일치
- [x] Cue ID 30/30 일치
- [x] 누락 0 / 추가 0
- [x] Subtitle Localizer에서 한국어 자막 YouTube 업로드 성공
- [x] YouTube에서 `ko · Subtitle Localizer` 트랙 조회 성공
- [x] YouTube 자막 SRT 다운로드 및 30 cue 가져오기 성공
- [x] 업로드 직후 동일 영상 자막 목록 자동 갱신
- [x] YouTube 자막 가져오기 완료 패널
- [x] 가져온 원본 언어와 동일한 번역 대상 자동 해제

## UI 레이아웃 보완
- [x] 연결 관리 제목을 JSX 명시적 줄바꿈으로 고정
- [x] 연결 관리 설명 두 문장을 JSX 명시적 줄바꿈으로 고정
- [x] 현재 작업 채널 바 상·하 간격 보완
- [x] 데스크톱 우측 카드 스크롤 겹침 방지
- [x] 실제 Production `/connections`에서 `<br/>` 반영 확인
- [x] 버전 `v1.7.0` 유지

## 첫 사용자 가이드 `/guide`
### 문서 선행
- [x] `context-notes.md`에 범위/원칙/진입점 정의
- [x] `checklist.md`에 구현/검증 항목 정의
- [ ] `README.md`에 사용자 가이드와 진입점 설명
- [ ] `User manual.md`를 OpenAI/YouTube 첫 연결 상세 절차로 확장

### OpenAI 가이드
- [ ] OpenAI API Key의 용도와 사용자 비용 부담 설명
- [ ] API Key 생성 페이지로 이동하는 명확한 버튼
- [ ] 새 secret key 생성/즉시 복사/안전 보관 설명
- [ ] 앱 `연결 관리`의 입력·기억하기·저장 절차 설명
- [ ] API Key 전체 값이 다시 표시되지 않는 경우의 복구 안내
- [ ] 실제 secret 예시를 문서/코드에 넣지 않음

### YouTube 가이드
- [ ] 전체 구조를 먼저 설명: Project → YouTube API → Auth Platform → Scope → OAuth Client → Channel
- [ ] 앱의 실제 8단계 마법사와 동일한 순서 사용
- [ ] 프로젝트명 `Subtitle Localizer` 권장
- [ ] YouTube Data API v3 사용 설정
- [ ] Branding 공개 URL 3개 제공
- [ ] Audience `In Production` 권장과 Testing 차이 설명
- [ ] `youtube.force-ssl` scope 제공
- [ ] OAuth Client `Web application` / `Subtitle Localizer Web` 권장
- [ ] Authorized JavaScript origins는 비워두기
- [ ] Authorized redirect URI는 callback만 넣기
- [ ] Client ID/Secret 저장 후 첫 채널 연결
- [ ] 추가 계정/채널은 Cloud 설정 반복 없이 연결
- [ ] `403 access_denied`, 확인되지 않은 앱, 채널 없음 등 복구 설명

### 페이지 UX
- [ ] `/guide` 라우트 생성
- [ ] 데스크톱 목차 + 본문, 모바일 단일 열
- [ ] 각 섹션에서 `연결 관리`의 정확한 위치로 이동하는 CTA
- [ ] 작업공간 상단 `처음 사용 가이드` 진입점
- [ ] 연결 관리 상단 `설정 가이드` 진입점
- [ ] 푸터 `처음 사용 가이드` 진입점
- [ ] focus-visible / reduced-motion 유지
- [ ] 기존 `v1.7.0` 시각 언어와 일관성 유지

### 회귀 검증
- [ ] `package.json` 1.7.0 유지
- [ ] 홈페이지 표시 버전도 v1.7.0으로 통일
- [ ] 기존 OpenAI 연결 API 동작 유지
- [ ] 기존 Google Cloud 8단계 마법사 유지
- [ ] 다중 YouTube 채널 추가/전환 코드 변경 없음 또는 회귀 없음
- [ ] 기존 자막 번역/업로드/가져오기 코드 회귀 없음
- [ ] 자동 테스트 전체 통과
- [ ] TypeScript 통과
- [ ] Next.js Production build 통과

### 배포 검증
- [ ] GitHub `main` 최종 반영
- [ ] Vercel `subtitle-localizer` Production 자동 배포
- [ ] Production `READY`
- [ ] `/guide` HTTP 200
- [ ] `/guide` 핵심 문구/링크 Production 반영
- [ ] 기존 `/connections` 줄바꿈 유지 확인
- [ ] 관련 Runtime Error 없음
- [ ] 최종 GitHub commit SHA 기록
- [ ] ZIP은 사용자에게만 제공하고 GitHub에는 넣지 않음

## 단계별 자체 점검
### 기존 v1.7.0 기능/E2E
- 상태: 완료
- 자체 점수: 10/10

### 기존 UI 3건
- 상태: 코드 및 Production 반영 완료
- 자체 점수: 10/10

### 첫 사용자 가이드
- 상태: 문서 선행 진행 중
- 다음 단계: README/User manual 정리 후 `/guide` 구현
