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

## 2026-09-06 E2E UX 버그 보완
### 업로드 후 자막 목록 자동 갱신
- [x] 문제 재현: 같은 영상에 자막 업로드 후 `기존 자막 0개`가 그대로 남음
- [x] 우회 확인: 다른 영상 선택 후 돌아오면 새 트랙 노출
- [ ] 업로드 성공 시 같은 `sourceVideoId`의 자막 목록 자동 재조회 구현
- [ ] 자동 재조회 중 loading 상태 정상 표시
- [ ] 업로드 성공 후 새 트랙이 선택 가능한지 회귀 테스트

### YouTube 자막 가져오기 성공 상태
- [x] 기능 성공: 한국어 트랙 30 cue SRT 가져오기
- [x] UX 문제 확인: 성공 메시지가 원본 영역이 아니라 오른쪽 공용 메시지에 나타나 불명확
- [ ] 원본 자막 영역에 `가져오기 완료` 성공 패널 표시
- [ ] 성공 패널에 언어 / cue 수 / 영상 제목 또는 파일명 표시
- [ ] 가져온 원본 언어가 지원 대상 언어와 같으면 번역 대상에서 자동 해제
- [ ] 가져온 원본의 실제 파일명 표시를 명확화

## 회귀 검증
- [ ] 기존 SRT 파일 업로드 유지
- [ ] 번역 결과 구조 검증 유지
- [ ] SRT 개별 다운로드 / ZIP 유지
- [ ] YouTube 자막 업로드 유지
- [ ] YouTube 자막 가져오기 유지
- [ ] 다중 채널 전환 유지
- [ ] 빈 채널 UX 유지
- [ ] OpenAI BYOK 유지
- [ ] 비밀정보 HttpOnly 암호화 유지
- [ ] localStorage/sessionStorage 비밀정보 0건
- [ ] 자동 테스트 전체 통과
- [ ] TypeScript 통과
- [ ] Next.js production build 통과

## 배포 / 패키징
- [ ] 최종 변경 GitHub `main` 반영
- [ ] 최신 GitHub commit SHA 기록
- [ ] Vercel Production READY 확인
- [ ] Vercel Runtime Error 없음 확인
- [ ] 전체 프로젝트 ZIP 생성
- [ ] ZIP은 GitHub에 커밋하지 않음

## 단계별 자체 점검
### 문서 보완
- 상태: 완료
- 내용: 실제 E2E에서 확인된 자막 목록 갱신 누락과 가져오기 성공 상태 불명확 문제를 4개 문서에 반영
- 자체 점수: 10/10

### 구현
- 상태: 진행 예정
- 완료 기준: 업로드 직후 자동 자막 목록 갱신 + 명확한 가져오기 성공 패널 + 동일 언어 자동 해제

### 최종 E2E / 배포
- 상태: 구현 후 진행
- 완료 기준: 테스트/빌드/Production READY/Runtime Error/ZIP까지 확인
