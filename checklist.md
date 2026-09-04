# Checklist — Subtitle Localizer v1.1.0

## 0. 작업 시작 문서
- [x] `context-notes.md`
- [x] `checklist.md`
- [x] `README.md`
- [x] `User manual.md`
- [x] `subtitle-localizer-v1.1.0` 버전 디렉터리

## 1. 코드 리뷰 / 보안
- [x] SRT parser 검토
- [x] serializer 검토
- [x] 번역 ID 검증 검토
- [x] API 입력 최대치 검증
- [x] 공개 API 비용 악용 위험 확인
- [x] `SUBTITLE_APP_ACCESS_KEY` 보호 추가
- [x] 프로덕션 access key 미설정 시 fail-closed 처리
- [x] OpenAI API key 클라이언트 비노출 확인
- [x] Responses API 저장 비활성화
- [x] transient 오류만 재시도하도록 개선
- [x] Next.js 보안 수정판 16.3.4 반영
- [x] React / React DOM 19.2.8 반영

### 1단계 자체 평가
- 점수: **9.6/10**
- 남은 항목: dependency 설치 후 production typecheck/build

## 2. 번역 비용 / 처리 구조
- [x] 고정 32 cue 청크 제거
- [x] 최대 48 cue 동적 청크
- [x] 최대 12,000자 text budget
- [x] 한 cue 최대 2,000자
- [x] 문맥 앞뒤 2 cue 제한
- [x] 언어 2개 병렬 제한
- [x] 언어 내부 청크 순차 처리
- [x] 실패 후 성공 청크 메모리 캐시
- [x] 이어서 재시도
- [x] 스타일/Glossary 변경 시 cache 무효화
- [x] `gpt-5.6-luna` 기본 유지
- [x] reasoning effort none
- [x] multi-language 단일 요청은 신뢰성 때문에 보류

### 2단계 자체 평가
- 점수: **9.7/10**
- 남은 항목: 실제 API usage 데이터를 이용한 비용 A/B 테스트

## 3. UI / UX
- [x] 작업 순서 표시
- [x] 파일 메타정보 표시
- [x] 추천 8개 언어 선택
- [x] 전체 선택 / 해제
- [x] 번역 스타일
- [x] Glossary
- [x] 배포 보호 키 입력
- [x] 예상 API 요청 수 표시
- [x] 언어별 진행률
- [x] 언어별 이어서 재시도
- [x] 완료 SRT 즉시 다운로드
- [x] ZIP 다운로드
- [x] 원문 ↔ 번역 나란히 비교
- [x] 타임코드 구조 검증 상태 표시
- [x] 모바일 적층 UI
- [x] 키보드 focus
- [x] `prefers-reduced-motion`
- [x] CSS parser 오류 0
- [x] TypeScript/TSX syntax-transpile 검사 오류 0

### 3단계 자체 평가
- 점수: **9.5/10**
- 남은 항목: 실제 브라우저 시각 smoke test

## 4. 테스트
- [x] BOM
- [x] CRLF / LF
- [x] multiline cue
- [x] serialize → parse round-trip
- [x] invalid time range
- [x] duplicate cue ID
- [x] missing translation ID
- [x] duplicate translation ID
- [x] empty translation
- [x] translation output reorder normalization
- [x] chunk cue limit
- [x] chunk char budget
- [x] start/end/id preservation
- [x] 5,000 cue long SRT
- [x] 전체 단위 테스트 18/18 통과
- [x] 코드 내 실제 `sk-*` API 키 하드코딩 없음
- [ ] 실제 OpenAI API smoke test
- [ ] 실제 브라우저 UI smoke test
- [ ] `npm run typecheck` (dependency install 후)
- [ ] `npm run build` (dependency install 후)

## 5. 배포 전 사용자 작업
- [ ] 프로젝트를 GitHub에 push
- [ ] 가능하면 `npm install` 실행 후 `package-lock.json` 커밋
- [ ] Vercel Import
- [ ] `OPENAI_API_KEY` 설정
- [ ] `OPENAI_TRANSLATION_MODEL=gpt-5.6-luna` 설정
- [ ] `SUBTITLE_APP_ACCESS_KEY` 긴 랜덤 문자열 설정
- [ ] production deploy
- [ ] 샘플 SRT → 한국어 1개 smoke test
- [ ] SRT 다운로드 후 YouTube Studio 업로드 확인

## 6. 다음 버전
- [ ] v1.2.0 YouTube OAuth
- [ ] v1.2.0 영상 목록 조회
- [ ] v1.2.0 captions 자동 업로드
- [ ] v1.3.0 사용자 계정
- [ ] v1.3.0 프로젝트 저장
- [ ] v1.3.0 Translation Memory
- [ ] v1.4.0 결제 / quota / 팀 glossary
