# Checklist — Subtitle Localizer v1.0.0

## 0. 문서 및 프로젝트 준비
- [x] `context-notes.md` 생성
- [x] `checklist.md` 생성
- [x] `README.md` 생성
- [x] `User manual.md` 생성
- [x] semantic version 프로젝트 디렉터리 생성

## 1. 프로젝트 스캐폴딩
- [x] Next.js + TypeScript 구성
- [x] 반응형 Custom CSS 구성
- [x] 기본 폴더 구조 정리
- [ ] ESLint 구성 (v1.0.1 후보 — 현재는 typecheck/test 중심)
- [x] `.gitignore`, `.env.example` 생성
- [x] 패키지 스크립트 구성 및 테스트 스크립트 검증

## 2. 핵심 도메인 로직
- [x] SRT parser 구현
- [x] SRT serializer 구현
- [x] SRT validation 구현
- [x] 청크 분할 로직 구현
- [x] 번역 결과 id 검증
- [x] 읽기 길이 관련 QA 구현
- [x] 단위 테스트 작성 (9개 통과)

## 3. 번역 API
- [x] OpenAI Responses API 서버 호출 구현
- [x] 번역 prompt 설계
- [x] structured output 파싱/검증
- [x] 언어 2개 동시 + 언어 내 청크 순차 처리
- [x] API 오류 및 1회 자동 재시도 + 언어별 수동 재시도
- [x] API 키 미설정 오류 처리

## 4. UI
- [x] 업로드 영역
- [x] SRT 메타정보/미리보기
- [x] 언어 다중 선택
- [x] 번역 스타일 선택
- [x] glossary 입력
- [x] 번역 진행 상태
- [x] 결과 미리보기
- [x] 개별 SRT 다운로드
- [x] ZIP 다운로드
- [x] 반응형 UI
- [x] 기본 접근성 점검 (키보드/focus/aria-live/reduced-motion)

## 5. 품질 점검
- [ ] `npm run lint`
- [x] `npm run test` (동등 명령으로 9/9 통과)
- [ ] `npm run build`
- [x] 정상 SRT 테스트
- [x] CRLF/LF 테스트
- [x] multiline cue 테스트
- [x] BOM 테스트
- [x] 잘못된 SRT 테스트
- [ ] 장문 자막 테스트
- [x] API 실패 UI/재시도 경로 구현 (실제 외부 API 호출은 키 필요)
- [x] API key 클라이언트 노출 여부 정적 점검

## 6. 배포 준비
- [x] README 설치/배포 설명 검증
- [x] 환경변수 문서화
- [x] Git 저장소 초기화
- [x] GitHub push 가능한 프로젝트 구조/로컬 커밋 준비
- [ ] Vercel 배포
- [ ] 배포 로그 검증
- [ ] 실제 페이지 smoke test

## 이후 버전 후보
- [ ] v1.1.0 YouTube OAuth + captions 업로드
- [ ] v1.2.0 사용자 프로젝트 저장
- [ ] v1.3.0 영상/오디오에서 원본 자막 생성
- [ ] v1.4.0 팀 glossary / 브랜드 사전
