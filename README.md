# Subtitle Localizer v1.1.0

영문 `.srt` 파일을 여러 언어로 현지화하면서 **원본 cue 번호와 타임코드를 그대로 보존**하는 YouTube용 자막 웹앱입니다.

## v1.1.0 핵심 기능
- 영문 SRT 드래그앤드롭/파일 선택
- 17개 대상 언어 다중 선택
- 추천 8개 / 전체 선택 / 선택 해제
- 5가지 번역 스타일
- 브랜드·고유명사 Glossary
- OpenAI Responses API + Structured Outputs
- 최대 48 cue / 약 12,000자 기준 동적 청크
- 앞뒤 문맥을 포함한 자막 현지화
- 번역 ID 누락/중복/추가 검증
- 원본 cue 번호/start/end 보존 검증
- 실패 후 **성공한 청크부터 이어서 재시도**
- 원문 ↔ 번역 나란히 미리보기
- 개별 SRT / 완료 결과 ZIP 다운로드
- Vercel 프로덕션용 `SUBTITLE_APP_ACCESS_KEY` 보호

## 기술 스택
- Next.js 16.3.4 (App Router)
- React / React DOM 19.2.8
- TypeScript
- Custom CSS
- OpenAI Responses API
- JSZip
- Node.js 22+

> 2026-09 기준 Next.js 16.3.x 보안 수정판을 사용하도록 업데이트했습니다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
```

`.env.local`:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
SUBTITLE_APP_ACCESS_KEY=your-long-random-secret
```

그다음:

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경변수

### `OPENAI_API_KEY`
필수입니다. 클라이언트로 전달하지 않고 서버 라우트에서만 사용합니다.

### `OPENAI_TRANSLATION_MODEL`
선택값입니다. 기본값은 `gpt-5.6-luna`입니다. 고용량·비용 민감 작업에 적합한 모델을 기본으로 선택했습니다.

### `SUBTITLE_APP_ACCESS_KEY`
Vercel 프로덕션에서는 필수로 취급합니다. 공개 URL의 번역 API를 제3자가 호출해 OpenAI 비용을 소비하는 상황을 방지하기 위한 간단한 보호 장치입니다.

- Vercel 환경변수에 긴 랜덤 문자열을 설정합니다.
- 웹 화면의 `배포 보호 키` 입력란에 같은 값을 입력합니다.
- 이 값은 브라우저 저장소에 기록하지 않고 현재 탭의 React 메모리에만 유지합니다.
- 정식 공개 SaaS로 전환할 때는 이 방식 대신 사용자 인증 + 사용량 제한으로 교체해야 합니다.

랜덤 키 생성 예시(Node.js):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```

## 번역/비용 최적화 전략
1. 고정 32 cue 대신 **최대 48 cue + 문자 예산 기반 동적 청크**를 사용해 반복 프롬프트 호출 수를 줄입니다.
2. 한 언어 안에서는 청크를 순차 처리하고, 언어는 최대 2개만 병렬 처리해 rate limit 위험을 낮춥니다.
3. 실패한 언어를 재시도할 때 이미 성공한 청크는 다시 호출하지 않습니다.
4. 주변 문맥은 앞뒤 2 cue만 보내 불필요한 입력 토큰을 억제합니다.
5. 번역 응답은 구조화 JSON으로 제한해 재요청을 유발하는 포맷 오류를 줄입니다.
6. 모델에는 reasoning effort `none`을 요청하고 응답 저장을 비활성화합니다.

여러 언어를 하나의 대형 요청으로 묶는 방식은 입력 토큰은 줄일 수 있지만, 한 언어 실패가 전체 요청에 영향을 주고 언어 혼합 오류 가능성이 커져 v1.1.0에서는 채택하지 않았습니다.

## 품질/안전 규칙
- 타임코드는 AI에 수정 권한을 주지 않습니다.
- cue 번호도 AI가 수정할 수 없습니다.
- 모델은 `{id,text}`만 반환합니다.
- 서버/클라이언트가 결과 ID를 다시 검증한 뒤 원본 start/end에 주입합니다.
- 한 cue는 최대 2,000자로 제한합니다.
- 파일은 최대 5MB, 최대 20,000 cue까지 허용합니다.
- OpenAI API 키는 브라우저 코드에 포함하지 않습니다.

## 테스트

```bash
npm test
```

현재 도메인 테스트는 18개이며 다음을 포함합니다.
- BOM / CRLF
- multiline cue
- SRT round-trip
- 잘못된 타임코드
- 중복 cue ID
- 번역 ID 누락/중복/빈 텍스트
- 동적 청크 cue/문자 제한
- 원본 타임코드 보존
- 5,000 cue 장문 SRT

전체 설치 후 최종 검증:

```bash
npm run check
```

`test → typecheck → production build` 순서로 실행합니다.

## GitHub / Vercel 배포
1. 이 폴더 내용을 GitHub 저장소에 올립니다.
2. 로컬 또는 GitHub Codespaces에서 `npm install`을 한 번 실행해 `package-lock.json`을 생성·커밋하는 것을 권장합니다.
3. Vercel에서 저장소를 Import합니다.
4. Environment Variables에 아래 3개를 설정합니다.
   - `OPENAI_API_KEY`
   - `OPENAI_TRANSLATION_MODEL=gpt-5.6-luna`
   - `SUBTITLE_APP_ACCESS_KEY=<긴 랜덤 문자열>`
5. Deploy 합니다.
6. 배포 후 샘플 SRT로 한국어 1개를 먼저 번역해 smoke test합니다.
7. 정상 동작 후 다국어 테스트를 진행합니다.

## 현재 검증 상태
- `npm test`: 18/18 통과
- CSS 문법 파싱: 통과
- 5,000 cue 장문 파싱/청크 테스트: 통과
- 실제 OpenAI 호출: API 키가 필요한 항목으로 미실행
- `npm install`, `npm run build`: 현재 작업 환경의 npm 레지스트리 연결 시간 초과로 미실행

## 버전 계획
- `v1.0.0`: SRT → 다국어 번역 → SRT/ZIP MVP
- `v1.1.0`: 보안·비용·재시도·QA·UI 강화 (현재)
- `v1.2.0`: YouTube OAuth + 영상 선택 + captions 자동 업로드
- `v1.3.0`: 사용자 계정 / 프로젝트 / Translation Memory
- `v1.4.0`: 결제 / 사용량 제한 / 팀 Glossary

## License
Private project unless a license is explicitly added later.
