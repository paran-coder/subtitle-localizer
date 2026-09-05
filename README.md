# Subtitle Localizer v1.6.4

사용자가 자신의 OpenAI API Key와 Google Cloud OAuth Client를 연결해 SRT를 다국어로 현지화하고 YouTube 자막으로 다시 업로드할 수 있는 BYOK/BYOC 웹앱입니다.

## v1.6.4
이번 패치는 Google Cloud / YouTube 연결 Wizard의 **설명-시각화-CTA 매핑**을 정리합니다. 기능 로직과 비용 구조는 v1.6.3과 동일합니다.

- 1/4~4/4 단계 내부 번호 체계를 하나로 통일
- 각 행동 번호가 시각화의 같은 번호와 1:1로 대응
- 각 행동에 `어디를 클릭 → 무엇이 보여야 함 → 완료 기준`을 묶어서 표시
- 주 CTA는 행동당 하나만 두고 보조 이동은 텍스트 링크로 낮춤
- 단계 하단의 분리된 버튼 모음을 제거해 설명과 실제 행동의 연결을 명확화
- Google Cloud 화면 예시는 `안내용 재구성 화면`으로 유지
- 충분한 시각 크기와 자연스러운 세로 스크롤 유지

## 비용 소유
- OpenAI 사용료: 최종 사용자의 OpenAI API Key 계정
- YouTube Data API quota: 최종 사용자의 Google Cloud 프로젝트
- Vercel hosting/functions: 배포자 계정

## 배포 환경변수
```env
APP_SESSION_SECRET=use-a-long-random-secret-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://subtitle-localizer.vercel.app
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
```

운영자 소유 `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`은 필요하지 않습니다.

## Secret 처리
사용자 OpenAI API Key, Google OAuth Client Secret, access/refresh token은 서버에서 AES-256-GCM으로 암호화한 HttpOnly cookie로 보관합니다. `localStorage` / `sessionStorage` / DB / Git 저장소에 비밀정보를 저장하지 않습니다.

## Google 연결 흐름
1. Google Cloud 프로젝트를 선택/생성하고 YouTube Data API v3를 활성화합니다.
2. Google Auth Platform에서 Branding, Audience, Data Access를 준비합니다.
3. Clients에서 Web application OAuth Client를 만들고 Authorized redirect URI를 등록합니다.
4. Client ID / Secret을 Subtitle Localizer에 저장한 뒤 `Google로 YouTube 연결`에서 OAuth 승인을 완료합니다.

각 단계는 행동 번호와 시각화 번호를 동일하게 사용해 사용자가 설명과 화면 예시를 바로 매칭할 수 있도록 설계합니다.

## 로컬 검증
```bash
npm install
npm run check
```

## v1.6.4 검증 결과
- 자동 테스트 **53/53 통과**
- 행동/시각화/CTA 매핑 architecture 테스트 추가
- TS/TSX **28개 파일 ES2017 구문 진단 0**
- CSS 구조 검사 통과
- OpenAI/YouTube API 및 `lib` 로직은 v1.6.3과 동일
- 하드코딩 API Key 없음
- 브라우저 평문 비밀 저장소 사용 없음
