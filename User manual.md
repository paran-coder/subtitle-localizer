# Subtitle Localizer v1.2.0 — User Manual

## 1. SRT 번역
1. 앱을 엽니다.
2. 영문 `.srt`를 드롭하거나 선택합니다.
3. 번역할 언어를 고릅니다. 처음 품질 확인에는 한국어·일본어·스페인어 3개를 권장합니다.
4. 번역 스타일을 고릅니다.
5. 브랜드명·인명·전문용어 규칙이 있으면 **고급 설정 → 용어집**에 입력합니다.
6. 운영 배포가 `SUBTITLE_APP_ACCESS_KEY`로 보호되어 있으면 **배포 보호 키**를 입력합니다.
7. **번역 시작**을 누릅니다.
8. 실패한 언어가 있으면 **이어서 재시도**를 사용합니다. 이미 완료된 chunk는 다시 번역하지 않습니다.

## 2. 결과 검토
번역이 끝나면 **검토 & 다운로드**에서:
- 왼쪽: 원문
- 오른쪽: 선택 언어 번역
- cue 번호 / timestamp
- 타임코드·ID 보존 상태
- 읽기 길이 참고 경고
를 확인합니다.

읽기 길이 경고는 자동 수정 명령이 아니라 검토 포인트입니다.

## 3. 파일 받기
- 한 언어만 필요하면 해당 언어의 **SRT 다운로드**를 사용합니다.
- 여러 언어가 완료되면 **완료 언어 ZIP**을 사용합니다.

## 4. YouTube 연결 — 최초 1회 설정
### Google Cloud
1. Google Cloud 프로젝트에서 YouTube Data API v3를 활성화합니다.
2. OAuth consent screen을 구성합니다.
3. OAuth Client를 **Web application**으로 생성합니다.
4. Authorized redirect URI에 다음 주소를 등록합니다.

```text
https://subtitle-localizer.vercel.app/api/youtube/oauth/callback
```

### Vercel 환경변수
```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
YOUTUBE_SESSION_SECRET=24자 이상 충분히 긴 랜덤 값
NEXT_PUBLIC_APP_URL=https://subtitle-localizer.vercel.app
```

환경변수를 추가한 뒤 새 production deployment에 반영합니다.

## 5. YouTube에 자막 올리기
1. 앱에서 **YouTube 연결**을 선택합니다.
2. Google 권한 화면에서 연결할 YouTube 계정을 선택합니다.
3. 앱으로 돌아오면 최근 업로드 영상 목록에서 대상을 선택합니다.
4. 자막 트랙 이름을 확인합니다. 기본값은 `Subtitle Localizer`입니다.
5. 업로드할 완료 언어를 선택합니다.
6. **YouTube에 올리기**를 실행합니다.

언어별로 별도의 caption track이 생성됩니다.

### 이미 같은 자막이 있는 경우
YouTube는 같은 영상에서 **같은 언어 + 같은 track name** 조합이 이미 존재하면 충돌을 반환할 수 있습니다. 앱은 기존 자막을 자동으로 지우지 않습니다. track name을 바꾸거나 YouTube Studio에서 기존 track을 정리한 뒤 다시 시도합니다.

## 6. Quota
YouTube `captions.insert`는 언어 1개당 400 quota units를 사용합니다. 많은 언어를 한 번에 올리기 전에 Google Cloud의 현재 quota를 확인하는 것이 좋습니다.

## 7. 권장 첫 실전 테스트
운영 채널의 중요한 영상보다 **비공개 또는 일부 공개 테스트 영상 1개**로 먼저 확인합니다.

권장 순서:
1. 짧은 영어 SRT
2. 한국어·일본어·스페인어 번역
3. 화면에서 문맥/길이 확인
4. 3개 SRT 다운로드 확인
5. 테스트 영상에 1개 언어만 먼저 업로드
6. YouTube Studio에서 timestamp/언어/track name 확인
7. 이상 없으면 나머지 언어 업로드

## 8. Vercel 배포 직후 smoke test
```text
[ ] 홈 렌더링
[ ] SRT 업로드
[ ] 보호 키를 사용한 실제 1개 언어 번역
[ ] SRT 다운로드
[ ] ZIP 다운로드
[ ] YouTube OAuth callback
[ ] 채널명/영상 목록 표시
[ ] 비공개 테스트 영상에 자막 1개 업로드
```
