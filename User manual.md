# User manual.md — Subtitle Localizer v1.7.0

## 1. 처음 연결하기
1. `연결 관리`에서 내 OpenAI API Key를 저장합니다.
2. YouTube 연결의 Google Cloud 마법사를 위에서 아래 순서대로 진행합니다.
3. Google Cloud 프로젝트는 전용 프로젝트 `Subtitle Localizer`를 권장합니다.
4. YouTube Data API v3를 사용 설정합니다.
5. Google Auth Platform에서 External 앱을 설정합니다.
6. Branding에 아래 공개 URL을 넣습니다.
   - 홈페이지: `https://subtitle-localizer.vercel.app/`
   - 개인정보처리방침: `https://subtitle-localizer.vercel.app/privacy`
   - 서비스 약관: `https://subtitle-localizer.vercel.app/terms`
7. 여러 Google 계정을 계속 추가하려면 Audience를 `In Production`으로 전환하는 경로를 권장합니다.
8. scope `https://www.googleapis.com/auth/youtube.force-ssl`를 추가합니다.
9. OAuth Client는 `Web application`, 이름은 `Subtitle Localizer Web`을 권장합니다.
10. `Authorized JavaScript origins`는 비워 둡니다.
11. `Authorized redirect URIs`에 앱이 보여주는 callback URI만 넣습니다.
12. Client ID / Secret을 앱에 저장합니다.
13. `Google로 YouTube 연결`을 눌러 첫 채널을 연결합니다.

Google의 `확인되지 않은 앱` 경고가 보일 수 있습니다. 사용자가 직접 만든 미검증 Production OAuth 앱에서 나타날 수 있는 경고입니다.

## 2. 계정/채널 추가 및 전환
최초 Cloud 설정 후에는 정상적인 채널 추가 때문에 Google Cloud를 다시 설정할 필요가 없습니다.

1. `+ 계정 또는 채널 추가`를 누릅니다.
2. Google 계정을 선택합니다.
3. YouTube 권한을 승인합니다.
4. 연결이 끝나면 채널 목록에 새 채널이 추가됩니다.
5. 작업공간 상단 채널 선택기에서 원하는 채널을 선택합니다.

채널을 바꾸면 영상 목록, YouTube 자막 가져오기, 자막 업로드 대상이 모두 새 활성 채널 기준으로 바뀝니다.

## 3. SRT 파일 번역하기
1. 작업공간 `원본 자막`에서 `SRT 파일`을 선택합니다.
2. 실제 `.srt` 파일을 드롭하거나 클릭해서 선택합니다.
3. 번역 언어를 선택합니다.
4. 필요하면 번역 스타일과 고급 설정을 조정합니다.
5. `번역 시작`을 누릅니다.
6. 완료 후 구조 검증에서 타임코드/cue ID/누락/추가를 확인합니다.
7. 개별 SRT 또는 ZIP을 다운로드할 수 있습니다.

## 4. 번역 자막을 YouTube에 올리기
1. 번역이 끝난 상태에서 오른쪽 `YouTube에 올리기`를 확인합니다.
2. 업로드할 영상을 선택합니다.
3. 자막 트랙 이름을 확인합니다.
4. 업로드할 언어를 선택합니다.
5. `자막 YouTube에 올리기`를 누릅니다.
6. 각 언어에 `업로드 완료`가 표시되면 성공입니다.

v1.7.0에서는 업로드 대상 영상이 현재 `YouTube 자막` 원본 영상과 같다면 새 자막 트랙 목록을 자동으로 다시 불러옵니다. 다른 영상으로 갔다가 돌아오는 수동 새로고침이 필요하지 않습니다.

## 5. YouTube 기존 자막 가져오기
1. `원본 자막`에서 `YouTube 자막` 탭을 선택합니다.
2. `원본 영상`을 선택합니다.
3. `기존 자막`에서 가져올 트랙을 선택합니다.
4. `SRT 가져오기`를 누릅니다.
5. 성공하면 `원본 자막` 영역 안에 `가져오기 완료` 상태가 표시됩니다.
6. 성공 상태에서 언어, cue 수, 영상 제목, 트랙 이름, 생성된 원본 파일명을 확인합니다.
7. 가져온 SRT는 일반 SRT와 동일하게 번역 파이프라인으로 이어집니다.

가져온 원본 언어가 앱의 번역 대상 언어 중 하나와 같으면 같은 언어를 다시 번역하지 않도록 해당 번역 대상 선택이 자동 해제됩니다. 필요한 경우 사용자가 다시 선택할 수 있습니다.

## 6. 실제 E2E 기준
현재 실제 검증에 사용한 파일명은 다음과 같습니다.
- 영상: `subtitle-localizer-e2e-test.mp4`
- 원본 자막: `localization-challenge-en.srt`

확인된 실제 흐름:
1. `localization-challenge-en.srt` 30 cue 로드
2. 한국어 번역
3. 타임코드 30/30 / Cue ID 30/30 / 누락 0 / 추가 0
4. Subtitle Localizer에서 YouTube 한국어 자막 업로드
5. YouTube에서 `ko · Subtitle Localizer` 트랙 확인
6. 같은 트랙을 앱에서 다시 SRT로 가져와 30 cue 확인
7. 업로드 직후 동일 영상의 자막 목록 자동 갱신 확인
8. 가져온 한국어 원본이 번역 대상 한국어를 자동 해제하는 동작 확인

## 7. 영상이 없는 채널
활성 채널에 업로드 영상이 없으면 앱이 `0개`만 표시하지 않고 이유와 다음 행동을 보여줍니다.
- `YouTube Studio 열기`
- `다시 불러오기`

영상 자체를 하나 업로드한 뒤 다시 불러오면 목록에 나타납니다.

## 8. 연결 문제 복구
Google Cloud를 다시 설정해야 할 수 있는 예외:
- 브라우저의 저장 데이터를 직접 삭제한 경우
- Google 계정에서 앱 권한을 취소한 경우
- OAuth Client를 삭제했거나 Secret을 교체한 경우
- Google Cloud 프로젝트/API를 삭제하거나 비활성화한 경우

일반적인 추가 계정/채널 연결 때문에 Cloud 설정을 반복하지는 않습니다.

## 9. 보안과 비용
- OpenAI API Key는 사용자가 직접 소유합니다.
- Google OAuth Client와 YouTube quota도 사용자가 직접 소유합니다.
- 비밀정보는 암호화한 HttpOnly cookie에 저장합니다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.
- SRT 파일은 서버 영구 저장소에 보관하지 않습니다.
- OpenAI 비용과 Google API quota는 각 사용자 계정에 귀속됩니다.
