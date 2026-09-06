# checklist.md — Subtitle Localizer v1.7.0

## 제품 범위
- [x] 버전 `v1.7.0` 유지
- [x] GitHub `paran-coder/subtitle-localizer` `main`만 사용
- [x] Vercel `subtitle-localizer` Production 사용
- [x] 기본 페이지 `/` = `작업하기`
- [x] `/guide` = `초기 설정`
- [x] `/connections` = `연결 관리`

## OpenAI / 보안
- [x] 사용자 BYOK 원칙
- [x] ChatGPT 구독과 OpenAI API Billing 분리 안내
- [x] API Billing 결제 수단/크레딧 안내
- [x] OpenAI API Key 서버 암호화 + HttpOnly cookie
- [x] localStorage/sessionStorage에 비밀정보 미저장
- [x] 실제 API Key를 코드/문서/로그에 미포함

## Google / YouTube
- [x] 사용자 BYOC 원칙
- [x] Google Cloud 최초 1회 설정 8단계 안내
- [x] YouTube Data API v3 사용 설정 안내
- [x] Branding 공개 URL 3개 안내
- [x] Audience Testing / In Production 설명
- [x] `youtube.force-ssl` scope를 복사용 설정값으로 표시
- [x] Authorized JavaScript origins 비움 안내
- [x] OAuth callback을 복사용 설정값으로 표시
- [x] 다중 Google 계정 / YouTube 채널 연결
- [x] 채널별 OAuth 세션 독립 저장
- [x] 활성 채널 전환 및 작업공간 동기화
- [x] 영상 0개 채널 빈 상태
- [x] 한 채널 해제 시 다른 연결 유지

## 번역 / 자막 E2E
- [x] SRT 업로드
- [x] YouTube 기존 자막 가져오기
- [x] 다국어 번역
- [x] cue ID / 타임코드 구조 검증
- [x] SRT 개별 다운로드
- [x] 완료 언어 ZIP 다운로드
- [x] YouTube 자막 업로드
- [x] 업로드 직후 자막 목록 갱신
- [x] 업로드한 트랙 재가져오기
- [x] SRT 파일명 기반 자막 트랙 이름 기본값

## UI / 정보 구조
- [x] 공통 순서 `타이틀바 → 초기 설정/연결 관리/작업하기 탭 → 내용`
- [x] 작업하기만 탭 아래 현재 YouTube 작업 채널 표시
- [x] 현재 탭 강조 및 `aria-current="page"`
- [x] 연결 관리 제목 JSX 명시 줄바꿈
- [x] 연결 관리 설명 JSX 명시 줄바꿈
- [x] 현재 작업 채널 상·하 여백
- [x] 데스크톱 오른쪽 카드 겹침 방지
- [x] 오른쪽 열 내부 세로 스크롤 제거
- [x] 브라우저 페이지 세로 스크롤 하나 사용
- [x] 중복 대형 가이드 배너 제거
- [x] 중복 상단 페이지 이동 CTA 제거

## YouTube quota 안내
- [x] 자막 API 기본 `10,000 units/일` 안내
- [x] `captions.list` 50 units 안내
- [x] `captions.download` 200 units 안내
- [x] `captions.insert` 400 units 안내
- [x] PT 자정 일일 초기화 안내
- [x] 소진 시 카드 즉시 구매가 아닌 초기화 대기 / quota 확장·심사 안내
- [x] 실제 프로젝트 Quotas 화면이 최종 기준임을 문서화

## OG / 소셜 공유
- [x] 사용자 확정 이미지를 1200×630으로 변환
- [x] `/og/subtitle-localizer` 이미지 엔드포인트 추가
- [x] `Content-Type: image/jpeg`
- [x] 장기 캐시 헤더 설정
- [x] `metadataBase` Production URL 설정
- [x] Open Graph title / description / site name / locale / image 설정
- [x] OG image width 1200 / height 630 / alt 설정
- [x] Twitter `summary_large_image` 설정
- [x] OG JPEG 자체 크기를 회귀 테스트로 1200×630 검증
- [x] Production HTML에서 실제 OG/Twitter 태그 확인
- [x] Production OG URL HTTP 200 확인

## 저장소 정리
- [x] 구버전 중복 `User%20manual.md` 삭제
- [x] 최종 `User manual.md` 유지
- [x] OG 실험용 `compact-*` 파일 삭제
- [x] OG 실험용 `final-*` 파일 삭제
- [x] 최종 OG route backing `part-00.ts` ~ `part-05.ts`만 유지
- [x] ZIP은 GitHub에 커밋하지 않음

## 자동 검증
- [x] 자동 테스트 **83/83** 통과
- [x] TypeScript 통과
- [x] Next.js Production build 통과
- [x] `/` HTTP 200
- [x] `/guide` HTTP 200
- [x] `/connections` HTTP 200
- [x] `/og/subtitle-localizer` HTTP 200
- [x] Production OG 응답 `image/jpeg`
- [x] Production Runtime `error` / `fatal` 0건

## 최종 배포 마감
- [ ] 이 체크리스트를 포함한 최종 GitHub `main` SHA 확인
- [ ] 해당 최종 SHA의 Vercel Production `READY` 확인
- [ ] 최종 Production에서 OG/Twitter 태그 재확인
- [ ] 최종 Production Runtime `error` / `fatal` 재확인
- [ ] 비밀정보 / `.git` 제외 최종 `subtitle-localizer-v1.7.0.zip` 생성
- [ ] 최종 ZIP 사용자에게만 전달
