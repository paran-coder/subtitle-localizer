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

## 상세 초기 설정 `/guide`
### 문서
- [x] `context-notes.md` 범위/원칙/완료 결과 갱신
- [x] `checklist.md` 구현/검증 결과 갱신
- [x] `README.md` 사용자 설정 안내 설명
- [x] `User manual.md` OpenAI/YouTube 첫 연결 상세 절차 확장

### OpenAI 가이드
- [x] OpenAI API Key의 용도와 사용자 비용 부담 설명
- [x] API Key 생성 페이지로 이동하는 버튼
- [x] 새 secret key 생성/즉시 복사/안전 보관 설명
- [x] 앱 `연결 관리`의 입력·기억하기·저장 절차 설명
- [x] API Key 전체 값이 다시 표시되지 않는 경우의 복구 안내
- [x] ChatGPT 구독과 OpenAI API 결제 분리 안내
- [x] 실제 secret 예시를 문서/코드에 넣지 않음

### YouTube 가이드
- [x] 전체 구조 설명: Project → YouTube API → Auth Platform → Audience → Scope → OAuth Client → Channel
- [x] 앱의 실제 8단계 마법사와 동일한 순서 사용
- [x] 프로젝트명 `Subtitle Localizer` 권장
- [x] YouTube Data API v3 사용 설정
- [x] Branding 공개 URL 3개 제공
- [x] Audience `In Production` 권장과 Testing 차이 설명
- [x] `youtube.force-ssl` scope 제공
- [x] OAuth Client `Web application` / `Subtitle Localizer Web` 권장
- [x] Authorized JavaScript origins는 비워두기
- [x] Authorized redirect URI는 callback만 넣기
- [x] Client ID/Secret 저장 후 첫 채널 연결
- [x] 추가 계정/채널은 Cloud 설정 반복 없이 연결
- [x] `403 access_denied`, `redirect_uri_mismatch`, 확인되지 않은 앱, 영상 0개 등 복구 설명

### 기존 회귀 검증
- [x] `package.json` 1.7.0 유지
- [x] 실제 사용자 표시 버전 v1.7.0 유지 (`v17-version.css` 포함)
- [x] 기존 OpenAI 연결 API 동작 코드 변경 없음
- [x] 기존 Google Cloud 8단계 마법사 유지
- [x] 다중 YouTube 채널 추가/전환 핵심 로직 변경 없음
- [x] 기존 자막 번역/업로드/가져오기 핵심 로직 변경 없음
- [x] 자동 테스트 전체 통과
- [x] TypeScript 통과
- [x] Next.js Production build 통과

## 2026-09-06 상단 내비게이션 재정리
### 정보 구조
- [x] 명칭 확정: `초기 설정 / 연결 관리 / 작업하기`
- [x] 기본 페이지 확정: `/` = `작업하기`
- [x] `/guide` 역할 확정: `초기 설정`
- [x] `/connections` 역할 확정: `연결 관리`

### 구현
- [x] `/`와 `/connections`의 큰 안내 배너 제거
- [x] 주요 화면 공통 상단 탭 추가
- [x] `초기 설정` → `/guide`
- [x] `연결 관리` → `/connections`
- [x] `작업하기` → `/`
- [x] 현재 경로 탭 강조 및 `aria-current="page"` 적용
- [x] 사이트 푸터의 `처음 사용 가이드`를 `초기 설정`으로 변경
- [x] `/guide` 브라우저 제목과 목차 명칭도 `초기 설정`으로 통일
- [x] 모바일에서도 탭이 명확하게 유지되도록 반응형 처리
- [x] 기존 현재 YouTube 작업 채널 바 유지
- [x] 연결/번역/다중 채널 핵심 로직 변경 없음

## 2026-09-06 공통 상단 계층 정리
### 정보 구조
- [x] 공통 순서 확정: `타이틀바 → 탭 → 페이지별 내용`
- [x] 작업하기 순서 확정: `타이틀바 → 탭 → 현재 YouTube 작업 채널 → 작업 본문`
- [x] `/guide`, `/connections`에서도 공통 타이틀바를 맨 위에 유지
- [x] 타이틀바와 탭 사이에 시각적 여백 확보

### 구현
- [x] 공통 `Subtitle Localizer` 타이틀바 추가
- [x] Root Layout 순서를 `공통 타이틀바+탭 → 작업 채널 → 페이지`로 수정
- [x] 기존 페이지 내부 타이틀바 중복 표시 제거
- [x] 공통 타이틀바에서 OpenAI/YouTube 연결 상태 유지
- [x] `/`에서만 현재 YouTube 작업 채널 바 표시
- [x] 탭과 작업 채널 바 사이 간격 유지
- [x] 모바일에서 동일한 계층 유지
- [x] 연결/번역/다중 채널 핵심 로직 변경 없음

### 검증
- [x] 자동 테스트 전체 통과 (79/79)
- [x] TypeScript 통과
- [x] Next.js Production build 통과
- [x] `/` HTTP 200 및 공통 타이틀바 → `작업하기` 활성 탭 확인
- [x] `/guide` HTTP 200 및 공통 타이틀바 → `초기 설정` 활성 탭 확인
- [x] `/connections` HTTP 200 및 공통 타이틀바 → `연결 관리` 활성 탭 확인
- [x] Root Layout에서 `PrimarySectionNav`가 `WorkspaceChannelBar`보다 앞에 위치함을 회귀 테스트로 고정
- [x] 내부 레거시 `.topbar`, `.v17-topbar`, `.guide-topbar`는 CSS로 중복 표시 방지
- [x] 기존 `/connections` 제목/설명 명시적 `<br/>` 줄바꿈 유지
- [x] 기능 검증 GitHub SHA `18ca255b03e43dbe52f6b13ceefd4272385c8327`
- [x] 기능 검증 Production deployment `dpl_54v8cAhtfYpEZWPvPfFfSxxXuxtN` READY
- [x] 관련 Runtime `error`/`fatal` 없음
- [x] 버전 `v1.7.0` 유지

## 2026-09-06 초기 설정 가이드 CTA 단순화
### 구현
- [x] `최초 1회 설정`의 `앱의 8단계 마법사와 함께 진행 →` 링크 삭제
- [x] 7단계의 `연결 관리 7단계로 이동 →` 링크 삭제
- [x] 7단계 설명과 완료 기준 유지
- [x] Google Cloud Console 외부 작업 링크 유지
- [x] 기존 연결/번역/다중 채널 로직 변경 없음

### 검증
- [x] 자동 테스트 전체 통과 (79/79)
- [x] TypeScript 통과
- [x] Next.js Production build 통과
- [x] Production `/guide`에서 두 링크 미노출 확인
- [x] 기능 검증 GitHub SHA `6dfc6db3512ac27dd7f6ea0366aa6d17cb3a0b20`
- [x] 기능 검증 Production deployment `dpl_FaJCEUrAYuKPfiDa2QvLafhqqYzv` READY
- [x] Runtime `error`/`fatal` 없음
- [x] 버전 `v1.7.0` 유지

## 2026-09-06 상단 중복 정보 정리
### 구현
- [x] 현재 YouTube 작업 채널 바의 `v1.7.0` 삭제
- [x] 공통 타이틀바의 `v1.7.0` 유지
- [x] 공통 타이틀바 우측 `연결 관리` / `작업하기` CTA 삭제
- [x] 페이지 이동은 `초기 설정 / 연결 관리 / 작업하기` 탭만 담당
- [x] OpenAI/YouTube 상태와 파일 비저장 안내 유지
- [x] 초기 설정 준비물 카드의 SRT 보조문장 데스크톱 한 줄 처리
- [x] 모바일에서는 보조문장 자연 줄바꿈 허용
- [x] 기존 채널 전환/채널 추가/연결/번역 로직 변경 없음

### 검증
- [x] 자동 테스트 전체 통과 (79/79)
- [x] TypeScript 통과
- [x] Next.js Production build 통과
- [x] 배포 소스 및 회귀 테스트에서 작업 채널 바 버전 마크업 제거 확인
- [x] Production 주요 화면에서 공통 타이틀바 페이지 이동 CTA 미노출 확인
- [x] Production CSS에서 준비물 보조문장 데스크톱 `white-space: nowrap` / 모바일 `normal` 확인
- [x] 기능 검증 GitHub SHA `c4a8b07d9bcf26d64fcb82c3610eb78743bbc3ce`
- [x] 기능 검증 Production deployment `dpl_DEBbPvsrbjmDSzfKusHaZS84ZB9S` READY
- [x] Runtime `error`/`fatal` 없음
- [x] 버전 `v1.7.0` 유지

## 2026-09-06 초기 설정 값·결제 안내 보완
### 구현
- [ ] callback URI를 이동 링크가 아닌 복사용 설정값으로 명확히 표시
- [ ] `youtube.force-ssl` scope를 이동 링크가 아닌 복사용 설정값으로 명확히 표시
- [ ] URL/scope 값의 링크 밑줄·클릭 affordance 제거
- [ ] 작업하기 `자막 트랙 이름` 초기값 비우기
- [ ] 업로드 대상 영상 변경 시 `자막 트랙 이름` 다시 비우기
- [ ] 비어 있는 트랙 이름의 기본 처리 규칙을 사용자에게 숨기지 않기
- [ ] 초기 설정 hero의 `FIRST-TIME SETUP` 버전 중복 삭제
- [ ] 연결 관리 `CONNECTIONS` 라벨을 오렌지 계열로 변경
- [ ] OpenAI API Billing/결제 수단 등록 단계 추가
- [ ] ChatGPT 구독과 OpenAI API 결제가 별도임을 유지
- [ ] Google/YouTube 기본 quota 사용에 카드 등록을 필수 단계로 안내하지 않기
- [ ] Google/YouTube 추가 quota는 별도 확장/심사 절차임을 안내
- [ ] 기존 OAuth/채널/번역/자막 업로드 핵심 로직 변경 없음

### 검증
- [ ] 자동 테스트 전체 통과
- [ ] TypeScript 통과
- [ ] Next.js Production build 통과
- [ ] Production `/guide`에서 버전 중복 제거 확인
- [ ] Production `/guide`에서 callback/scope 비링크 스타일 확인
- [ ] Production `/guide`에서 OpenAI Billing 안내 확인
- [ ] Production `/connections`에서 `CONNECTIONS` 오렌지 라벨 확인
- [ ] 작업 화면에서 트랙 이름 초기화 동작 확인
- [ ] Runtime `error`/`fatal` 없음
- [ ] 버전 `v1.7.0` 유지

## 단계별 자체 점검
### 기존 v1.7.0 기능/E2E
- 상태: 완료
- 자체 점수: 10/10

### 기존 UI 3건
- 상태: 코드 및 Production 반영 완료
- 자체 점수: 10/10

### 상세 초기 설정 페이지
- 상태: 완료
- 자체 점수: 9.5/10

### 상단 내비게이션 재정리
- 상태: 완료
- 결과: 대형 안내 배너 제거, `초기 설정 / 연결 관리 / 작업하기` 공통 탭, 기본 `/` 작업하기, 현재 탭 강조, 명칭 통일, Production 검증 완료
- 자체 점수: 10/10

### 공통 상단 계층 정리
- 상태: 완료
- 결과: 모든 주요 화면 공통 타이틀바를 맨 위에 두고 탭을 그 아래로 통일. 작업하기에서만 탭 아래 현재 작업 채널 표시. 타이틀바/탭 간 여백과 모바일 계층 유지.
- 자체 점수: 10/10

### 초기 설정 가이드 CTA 단순화
- 상태: 완료
- 결과: 요청된 두 내부 이동 링크 삭제, 설명/완료 기준 및 외부 작업 링크 유지, Production 검증 완료
- 자체 점수: 10/10

### 상단 중복 정보 정리
- 상태: 완료
- 결과: 작업 채널 버전 중복 제거, 공통 타이틀바 이동 CTA 제거, 준비물 보조문장 데스크톱 한 줄 처리 및 모바일 줄바꿈 유지, Production 검증 완료
- 자체 점수: 10/10

### 초기 설정 값·결제 안내 보완
- 상태: 진행 중
- 자체 점수: 검증 후 기록