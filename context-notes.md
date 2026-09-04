# Context Notes — Subtitle Localizer v1.1.0

## 프로젝트 목표
영문 SRT 파일을 업로드하면 선택한 여러 언어로 자막 텍스트를 현지화하고, 원본 cue 번호와 타임스탬프를 보존한 언어별 SRT를 생성한다. 최종 프로젝트는 GitHub에 올려 Vercel에 배포할 수 있어야 한다.

## 사용자와 합의된 역할
- 제품/기술상 합리적으로 자동 결정 가능한 항목은 개발 과정에서 자동 결정한다.
- API 키, 결제, OAuth 권한 등 임의 결정이 부적절한 항목만 사용자 결정 대상으로 남긴다.
- GitHub 업로드 및 Vercel 실제 배포는 사용자가 직접 수행한다.
- 각 주요 단계마다 자체 점검, 보완, 10점 만점 자체 평가를 기록한다.
- semantic versioning을 사용한다.

## v1.1.0을 만든 이유
v1.0.0 기본 기능 이후 다음 3개 작업을 동시에 진행한다.
1. 전체 코드 리뷰 및 배포 오류 가능성 제거
2. UI/UX 개선
3. 번역 비용/청크/모델 구조 최적화

## v1.1.0 제품 결정
### 유지
- 로그인/DB 없음
- YouTube 직접 업로드 없음
- 원본 파일 영구 저장 없음

### 새로 추가
- 프로덕션 API 악용 방지용 `SUBTITLE_APP_ACCESS_KEY`
- 48 cue + 12,000자 동적 청크
- 실패 후 완료 청크 재사용
- 원문 ↔ 번역 비교 UI
- 추천 언어 preset
- API 요청 예상 횟수 표시
- 구조 보존 상태 표시
- 현재 보안 수정판 Next.js/React 사용

## 핵심 보안 결정
로그인 없는 Vercel 앱에서 서버 API가 공개되면 제3자가 `/api/translate`를 직접 호출해 운영자의 OpenAI API 비용을 소비할 수 있다. 따라서 프로덕션에서는 `SUBTITLE_APP_ACCESS_KEY`가 없으면 번역 API가 503을 반환하며, 설정된 경우 클라이언트 요청의 `x-subtitle-access-key`와 비교한다.

이 방식은 개인/내부 도구에 적합하다. 공개 SaaS 단계에서는 반드시 사용자 인증, rate limit, quota, 결제로 교체한다.

## 번역 엔진 원칙
1. AI가 start/end를 생성하거나 수정하지 않는다.
2. AI는 cue ID와 번역 텍스트만 반환한다.
3. Structured Outputs로 id/text 구조를 강제한다.
4. 응답 ID의 누락·중복·추가를 검증한다.
5. 검증된 텍스트만 원본 cue 구조에 다시 주입한다.
6. 문맥은 앞뒤 2 cue를 제공한다.
7. 스타일/Glossary 변경 시 기존 결과와 부분 캐시를 폐기해 서로 다른 설정의 결과가 섞이지 않게 한다.
8. 실패한 청크 이전의 성공 결과는 메모리에 유지해 재시도 비용을 줄인다.

## 비용 최적화 결정
- 기본 모델: `gpt-5.6-luna`
- reasoning effort: `none`
- request storage: false
- 고정 32 cue → 최대 48 cue + 12,000자 동적 청크
- 언어 최대 2개 병렬
- 언어 내부 청크 순차 처리
- 주변 문맥 2+2 cue
- 실패 시 성공 청크 재사용

### 채택하지 않은 아이디어
여러 대상 언어를 한 API 요청에 묶는 multi-language batch는 입력 토큰 반복을 줄일 수 있지만 다음 이유로 보류한다.
- 한 언어의 구조 실패가 전체 결과를 실패시킬 수 있음
- 언어 혼합 위험 증가
- 개별 재시도 난이도 증가
- 출력 토큰 비용 비중은 그대로 유지

## 입력 제한
- `.srt`만 허용
- 파일 5MB 이하
- 20,000 cue 이하
- cue 텍스트 2,000자 이하
- API chunk 48 cue 이하
- chunk source text 12,000자 이하
- glossary 8,000자 이하

## UI 원칙
- 흐름: Upload → Languages → Localize → Download
- 장식보다 작업 상태와 결과 검수 우선
- 번역 완료 후 원문/번역을 한 화면에서 비교
- 언어 선택은 빠른 preset과 개별 선택 모두 제공
- 모바일에서는 비교 UI를 세로 적층
- 키보드 focus와 reduced-motion 지원

## 의존성 결정 — 2026-09-05 기준
- Next.js 16.3.4
- React 19.2.8
- React DOM 19.2.8
- TypeScript 5.9 계열
- JSZip 3.10.1

Next.js 16.0.0은 2026년 보안 수정 이전 버전이라 16.3.4로 올렸다.

## 검증 결과
- SRT/translation 단위 테스트: 18/18 통과
- 5,000 cue 장문 테스트: 통과
- CSS 파싱: 오류 0
- TS/TSX syntax/transpile 검사: 10개 파일, 오류 0
- 하드코딩 OpenAI `sk-*` 키 검사: 없음
- 타임코드 보존 검증 테스트: 통과
- npm dependency install: 작업 환경 네트워크 시간 초과
- production build: dependency install 불가로 미실행
- 실제 OpenAI API 호출: 사용자 API 키 필요로 미실행

## 단계별 자체 평가
### 1. 코드 안정성 / 보안
- 평가: 9.6/10
- 보완: 실제 dependency 설치 후 typecheck/build 필요

### 2. UI/UX
- 평가: 9.5/10
- 보완: 실제 브라우저에서 최종 픽셀/스크롤 smoke test 권장

### 3. 비용/번역 구조
- 평가: 9.7/10
- 보완: 실제 영상 3~5개로 번역 품질/토큰 사용량을 기록한 뒤 chunk size A/B 테스트 가능

## 다음 버전 제안
`v1.2.0`에서 YouTube OAuth와 captions 업로드를 추가하기 전에 실제 사용 데이터로 다음을 검증한다.
- 평균 cue 수
- 평균 대상 언어 수
- 실패율
- 언어별 번역 품질
- 영상당 OpenAI 비용
- 자주 쓰는 glossary 패턴
