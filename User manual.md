# Subtitle Localizer v1.3.0 — User Manual

## 1. 가장 빠른 테스트
SRT가 없어도 앱 첫 화면에서 **SRT 파일 → 30-cue 샘플로 테스트**를 누르면 샘플 영어 자막이 바로 로드됩니다.

추천 첫 테스트:
1. 샘플 불러오기
2. 한국어 / 일본어 / 스페인어 선택
3. `자연스럽게` 유지
4. 번역 시작
5. 원문↔번역 비교
6. 언어별 SRT 또는 ZIP 다운로드

## 2. 로컬 SRT 번역
1. **원본 자막 → SRT 파일**을 선택합니다.
2. `.srt`를 드롭하거나 클릭해 선택합니다.
3. 대상 언어를 고릅니다.
4. 번역 스타일을 고릅니다.
5. 브랜드명·인명·전문용어가 있으면 **고급 설정 → 용어집**에 적습니다.
6. 운영 배포가 `SUBTITLE_APP_ACCESS_KEY`로 보호되어 있으면 **배포 보호 키**를 입력합니다.
7. **번역 시작**을 누릅니다.
8. 실패한 언어는 **이어서 재시도**를 누릅니다. 완료된 chunk는 다시 번역하지 않습니다.

## 3. YouTube 기존 자막을 원본으로 사용
### 최초 연결
Google Cloud / Vercel에 YouTube OAuth 설정이 완료되어 있어야 합니다.

앱에서:
1. **원본 자막 → YouTube 자막**을 선택합니다.
2. 연결되지 않았다면 **YouTube 연결**을 누릅니다.
3. 내 영상 중 원본으로 사용할 영상을 선택합니다.
4. 앱이 그 영상의 기존 caption track 목록을 불러옵니다.
5. 영어 또는 원하는 원본 자막을 선택합니다.
   - `자동 생성` 표시는 ASR 자막입니다.
   - `초안`은 공개되지 않은 draft track입니다.
6. **SRT 가져오기**를 누릅니다.
7. 가져온 cue 수가 표시되면 로컬 파일과 동일하게 번역을 진행합니다.

YouTube에서 가져온 원본의 영상은 번역 후 YouTube 업로드 대상에 자동으로 채워집니다.

## 4. 결과 검토
**검토 & 다운로드**에서 다음을 확인합니다.
- 왼쪽: 원문
- 오른쪽: 선택한 번역
- cue 번호 / timestamp
- 타임코드·ID 보존 여부
- 읽기 길이 참고 경고

읽기 길이 경고는 자동 수정이 아니라 사람이 볼 검토 포인트입니다.

## 5. 파일 다운로드
- 한 언어: 해당 언어 **SRT 다운로드**
- 여러 언어: **완료 언어 ZIP**

## 6. YouTube에 번역 자막 업로드
1. YouTube가 연결되어 있어야 합니다.
2. 업로드할 영상을 선택합니다.
3. 자막 트랙 이름을 확인합니다. 기본값은 `Subtitle Localizer`입니다.
4. 완료된 번역 언어 중 업로드할 언어를 선택합니다.
5. **YouTube에 올리기**를 실행합니다.

같은 영상에 **같은 언어 + 같은 track name**이 이미 있으면 앱은 기존 자막을 자동 삭제하지 않습니다. 트랙 이름을 바꾸거나 기존 트랙을 직접 정리한 뒤 재시도합니다.

## 7. Google / YouTube OAuth 설정
### Google Cloud
1. YouTube Data API v3 활성화
2. OAuth consent screen 구성
3. OAuth Client를 **Web application**으로 생성
4. Authorized redirect URI 등록

```text
https://subtitle-localizer.vercel.app/api/youtube/oauth/callback
```

### Vercel environment variables
```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
YOUTUBE_SESSION_SECRET=24자 이상 충분히 긴 랜덤 값
NEXT_PUBLIC_APP_URL=https://subtitle-localizer.vercel.app
```

OpenAI 번역용:

```text
OPENAI_API_KEY=...
OPENAI_TRANSLATION_MODEL=gpt-5.6-luna
SUBTITLE_APP_ACCESS_KEY=긴 랜덤 보호 키
```

## 8. YouTube quota 참고
- 자막 목록 조회: 50 units
- 선택한 자막 SRT 다운로드: 200 units
- 자막 업로드: 언어 1개당 400 units

영상 하나를 선택할 때만 자막 목록을 조회하도록 되어 있어 불필요한 quota 사용을 줄입니다.

## 9. 배포 후 권장 smoke test
```text
[ ] 홈 렌더링
[ ] 30-cue 샘플 불러오기
[ ] 보호 키를 사용한 실제 한국어 번역
[ ] SRT 다운로드
[ ] ZIP 다운로드
[ ] YouTube OAuth callback
[ ] 채널 / 영상 목록 표시
[ ] 테스트 영상의 기존 영어 caption track 표시
[ ] 영어 SRT 가져오기
[ ] 가져온 SRT 번역
[ ] 비공개 테스트 영상에 번역 자막 1개 업로드
[ ] YouTube Studio에서 언어 / timestamp / track name 확인
```

중요한 운영 영상보다 비공개 또는 일부 공개 테스트 영상으로 먼저 확인하는 것을 권장합니다.
