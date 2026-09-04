# Subtitle Localizer v1.4.0 — User Manual

## 1. OpenAI 연결
번역 비용은 사용자의 OpenAI 계정에 청구됩니다.

1. `내 OpenAI API Key`에 본인의 API Key를 입력합니다.
2. `키 연결`을 누릅니다. 이 단계는 키를 안전하게 저장하며, 실제 키 유효성은 첫 번역 요청에서 확인됩니다.
3. 기본 상태에서는 브라우저 세션이 끝나면 키가 삭제됩니다.
4. `이 브라우저에 기억하기`를 켜면 암호화된 HttpOnly 쿠키로 최대 30일 유지됩니다.
5. `키 지우기`를 누르면 저장된 키를 즉시 삭제합니다.

API Key는 localStorage/sessionStorage에 저장하지 않습니다. 브라우저 JavaScript가 저장된 값을 다시 읽을 수 없도록 암호화된 HttpOnly 쿠키를 사용합니다.

## 2. YouTube 연결
YouTube API quota는 사용자가 만든 Google Cloud 프로젝트에서 사용됩니다.

1. Google Cloud에서 프로젝트를 만들거나 선택합니다.
2. YouTube Data API v3를 활성화합니다.
3. OAuth 동의 화면을 설정합니다. 테스트 모드라면 사용할 본인 Google 계정을 테스트 사용자로 추가합니다.
4. OAuth Client 유형을 `Web application`으로 만듭니다.
5. Subtitle Localizer에 표시된 Redirect URI를 Google Cloud의 `Authorized redirect URIs`에 추가합니다.
6. Client ID와 Client Secret을 앱에 입력합니다.
7. `저장하고 YouTube 연결`을 누릅니다.
8. Google/YouTube 계정에서 권한을 승인합니다.

`이 브라우저에서 Google 연결 유지`를 켜면 Client ID/Secret과 OAuth 토큰이 암호화된 HttpOnly 지속 쿠키로 유지됩니다. 끄면 브라우저 세션에서만 유지됩니다.

## 3. 번역
1. SRT를 업로드하거나 30-cue 샘플을 불러옵니다.
2. 번역 언어를 선택합니다.
3. 번역 스타일과 Glossary를 설정합니다.
4. `번역 시작`을 누릅니다.
5. 결과를 원문과 비교하고 SRT 또는 ZIP으로 다운로드합니다.

## 4. YouTube 자막 가져오기
1. YouTube 연결 후 `YouTube 자막` 탭을 선택합니다.
2. 영상을 선택합니다.
3. 기존 자막 트랙을 선택합니다.
4. `SRT 가져오기`를 누릅니다.

## 5. YouTube 자막 업로드
1. 번역을 완료합니다.
2. 오른쪽 YouTube 패널에서 업로드 영상을 선택합니다.
3. 업로드할 언어를 선택합니다.
4. 자막 트랙 이름을 확인합니다.
5. YouTube 업로드를 실행합니다.

## 6. 비용 원칙
- OpenAI 번역 API 비용: 사용자 부담
- YouTube Data API quota: 사용자의 Google Cloud 프로젝트 부담
- 앱 운영자 OpenAI/Google 유료 자격 증명: 사용하지 않음
- Vercel 호스팅/함수 사용량: 배포 운영자의 Vercel 계정에 속함
