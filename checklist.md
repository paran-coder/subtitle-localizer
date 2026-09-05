# checklist.md — Subtitle Localizer v1.6.4

## 작업 전
- [x] context-notes.md 갱신
- [x] checklist.md 갱신
- [x] README.md 갱신
- [x] User manual.md 갱신
- [x] ui-polish 원칙 재확인
- [x] Karrot/SEED 디자인 토큰 재확인

## Wizard 정보구조
- [x] 단계 내부 번호 체계 1개로 통일
- [x] 행동 번호 ↔ 시각화 번호 1:1 대응
- [x] 각 행동에 `어디를 클릭 / 무엇이 보여야 함 / 완료 기준` 포함
- [x] 분리된 하단 CTA 모음 제거
- [x] 행동당 주 CTA 1개
- [x] 보조 이동은 텍스트 링크로 낮춤
- [x] 1/4~4/4 동일 패턴 적용
- [x] `안내용 재구성 화면` 라벨 유지

## UI / 접근성
- [x] 본문 15~16px 이상 유지
- [x] 현재 단계/활성 CTA에만 Primary 오렌지 사용
- [x] 4px spacing rhythm
- [x] 320px 가로 overflow 없음
- [x] prefers-reduced-motion 유지
- [x] focus-visible 유지

## 회귀 검증
- [x] 기존 단위/architecture 테스트 전체 통과
- [x] 새 번호/CTA 매핑 architecture 테스트
- [x] TS/TSX ES2017 구문 검사
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

## 최종 검증 결과
- 자동 테스트: **53/53 통과**
- TS/TSX: **28개 파일 ES2017 구문 진단 0**
- CSS delimiter 검사: **통과**
- `app/api` / `lib`: v1.6.3 대비 변경 없음
- 하드코딩 `sk-*`: **0**
- localStorage/sessionStorage 비밀 저장: **0**
- 자체평가: **9.9/10**
