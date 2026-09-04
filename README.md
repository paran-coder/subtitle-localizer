# Subtitle Localizer v1.0.0

YouTube용 SRT 자막을 여러 언어로 번역하면서 **원본 타임스탬프와 자막 번호를 그대로 보존**하는 웹앱입니다.

## v1.0.0 핵심 기능
- 영문 `.srt` 업로드
- 다국어 동시 선택
- 자막 문맥을 고려한 AI 번역
- 타임스탬프/인덱스 보존
- 번역 스타일 선택
- 브랜드/고유명사 glossary
- 결과 미리보기
- 언어별 SRT 다운로드
- 전체 ZIP 다운로드

## 기술 스택
- Next.js (App Router)
- TypeScript
- Custom CSS
- OpenAI Responses API
- Zod
- JSZip
- Lucide React

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local에 OPENAI_API_KEY 입력
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 환경변수

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
```

`OPENAI_TRANSLATION_MODEL`은 선택값이며 미설정 시 비용 효율형 번역 모델을 기본값으로 사용합니다.

## Vercel 배포
1. 프로젝트를 GitHub 저장소에 push합니다.
2. Vercel에서 저장소를 Import합니다.
3. Project Settings → Environment Variables에 `OPENAI_API_KEY`를 추가합니다.
4. 필요하면 `OPENAI_TRANSLATION_MODEL`을 추가합니다.
5. Deploy 합니다.

## 보안
- OpenAI API 키는 서버 코드에서만 사용합니다.
- 업로드된 SRT는 v1.0.0에서 영구 저장하지 않습니다.
- 브라우저 localStorage에도 API 키를 저장하지 않습니다.

## 버전 계획
- `v1.0.0`: SRT → 다국어 번역 → SRT/ZIP
- `v1.1.0`: YouTube OAuth 및 자막 자동 업로드
- `v1.2.0`: 계정/프로젝트 저장

## License
Private project unless a license is explicitly added later.
