# Context Notes — Subtitle Localizer v1.0.0

## 프로젝트 목표
영문 SRT 파일을 업로드하면 사용자가 선택한 여러 언어로 자막 텍스트를 번역하고, 원본 인덱스와 타임스탬프를 보존한 언어별 SRT 파일을 생성하는 웹앱을 만든다.

## 사용자 의도
- 최종 산출물은 GitHub에 올릴 수 있는 프로젝트 파일이어야 한다.
- Vercel에 배포 가능한 구조여야 한다.
- 개발 과정의 합리적인 기술/제품 결정은 자동으로 진행한다.
- 임의 결정이 위험한 항목(실제 API 키, 결제, OAuth 권한 등)만 사용자에게 질문한다.
- 각 주요 단계마다 자체 점검, 수정/보완, 10점 만점 자체 평가를 수행한다.
- 버전은 semantic versioning을 사용한다. 현재 버전: `subtitle-localizer-v1.0.0`.

## v1.0.0 범위
### 포함
1. `.srt` 파일 드래그앤드롭/선택 업로드
2. SRT 파싱 및 유효성 검사
3. 원본 자막 미리보기
4. 다국어 선택
5. OpenAI API 기반 번역
6. 타임스탬프/인덱스 완전 보존
7. 문맥 단위 번역 및 구조화된 응답 검증
8. 번역 결과 미리보기
9. 언어별 `.srt` 다운로드
10. 전체 결과 ZIP 다운로드
11. 기본 번역 스타일 선택
12. 고유명사/용어집(glossary) 입력
13. 클라이언트/서버 오류 처리

### 제외 — v1.1.0 이후
- Google/YouTube OAuth
- YouTube 영상 목록 조회
- YouTube caption 자동 업로드
- 사용자 계정/프로젝트 저장
- 결제/구독
- 팀 협업
- 번역 히스토리 클라우드 저장

## 제품 원칙
1. 타임스탬프는 번역 모델이 수정하지 못하게 한다.
2. 자막 번호도 모델이 수정하지 못하게 한다.
3. 번역 결과는 자막 id 기반으로 원본 구조에 다시 주입한다.
4. 모델 출력 실패 시 원본 구조를 손상시키지 않는다.
5. 긴 영상은 청크 단위로 처리하되 주변 문맥을 함께 제공한다.
6. 자막용 번역은 직역보다 읽기 속도와 자연스러움을 우선할 수 있다.
7. API 키는 서버 환경변수에만 저장하고 브라우저에 노출하지 않는다.

## 기술 선택
- Framework: Next.js App Router + TypeScript
- Styling: Custom CSS (CSS variables + responsive layout)
- Runtime: Node.js / Vercel Functions
- Translation provider: OpenAI Responses API
- Default model: `gpt-5.6-luna` (고용량 다국어 번역 비용 효율 우선)
- SRT parser/generator: 프로젝트 내부 TypeScript 구현
- ZIP: `jszip`
- Validation: `zod`
- Icons: `lucide-react`
- v1 데이터베이스: 없음
- v1 인증: 없음

## 번역 처리 전략
- 입력 SRT → parser → `{id,start,end,text}` 배열
- 30~60개 cue 단위 청크
- 모델에는 id/text와 앞뒤 문맥을 제공
- 응답은 `{items:[{id,text}]}` 구조로 제한
- id 누락/중복/추가 검증
- 원본 cue의 start/end는 서버 코드에서만 재결합
- 언어별 결과를 SRT로 직렬화

## 초기 지원 언어
한국어, 일본어, 스페인어, 프랑스어, 독일어, 포르투갈어(브라질), 중국어(간체), 중국어(번체), 태국어, 베트남어, 인도네시아어, 아랍어, 힌디어, 이탈리아어, 네덜란드어, 터키어, 폴란드어.

## UI 방향
- 한 화면 중심의 작업 흐름
- Step 1 파일 업로드 → Step 2 언어/스타일 → Step 3 번역 → Step 4 결과
- 전문 도구 느낌, 과도한 장식 금지
- 데스크톱 우선이지만 모바일 대응
- 진행률, 실패 언어 재시도, 개별/전체 다운로드 제공
- 접근성: 키보드 조작, 명확한 focus state, reduced-motion 존중

## 배포 계획
- GitHub에 그대로 push 가능한 구조 제공
- `.env.example` 제공
- Vercel 환경변수 `OPENAI_API_KEY` 설정
- Vercel 프로젝트 연결 후 배포
