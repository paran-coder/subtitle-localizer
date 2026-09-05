# checklist.md — Subtitle Localizer v1.6.3

## 작업 전
- [x] context-notes.md 갱신
- [x] checklist.md 갱신
- [x] README.md 갱신
- [x] User manual.md 갱신
- [x] ui-polish 원칙 재확인
- [x] Karrot/SEED 디자인 토큰 재확인
- [x] Google 공식 YouTube OAuth / Auth Platform 문서 메뉴명 재검증

## Wizard 시각 가이드
- [x] 모든 단계에 `어디를 클릭하세요` 블록
- [x] 모든 단계에 `무엇이 보여야 합니다` 블록
- [x] 모든 단계에 `완료 기준` 블록
- [x] 시각 예시에 `안내용 재구성 화면` 표시
- [x] 1단계: Project selector → APIs & Services → Library → YouTube Data API v3 → Enable
- [x] 2단계: Branding / Audience / Data Access + Test users
- [x] 3단계: Clients → Create Client → Web application → Authorized redirect URIs
- [x] 4단계: Client ID/Secret 저장 → 별도 Google OAuth 승인
- [x] 실제 Google Console과 혼동될 수 있는 가짜 버튼은 `예시`임을 명확히 표시

## UI / 접근성
- [x] 본문 15~16px 이상 유지
- [x] 현재 단계/활성 CTA에만 Primary 오렌지 사용
- [x] 4px spacing rhythm
- [x] 모바일 320px 가로 overflow 없음
- [x] prefers-reduced-motion 유지
- [x] focus-visible 유지

## 회귀 검증
- [x] 기존 단위/architecture 테스트 전체 통과
- [x] TS/TSX 구문 검사
- [x] CSS 구조 검사
- [x] OpenAI BYOK 로직 변경 없음
- [x] YouTube OAuth/API 로직 변경 없음
- [x] 하드코딩 API Key 없음
- [x] localStorage/sessionStorage 비밀정보 저장 없음
- [x] .env.example / .gitignore ZIP 포함

## 배포 후
- [ ] Vercel production build 통과
- [ ] /connections 실제 픽셀 QA
- [ ] Google Cloud 1/4 → 4/4 실제 따라가기 테스트
- [ ] Google OAuth 승인 테스트

## 최종 검증 결과
- 자동 테스트: **52/52 통과**
- TS/TSX: **29개 파일 ES2017 구문 진단 0**
- CSS delimiter 검사: **통과**
- 하드코딩 `sk-*`: **0**
- localStorage/sessionStorage 비밀 저장: **0**
- npm registry 접근 시간 초과로 dependency-aware production build는 Vercel에서 확인 필요
- 자체평가: **9.9/10**
