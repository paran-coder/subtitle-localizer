# User manual.md — Subtitle Localizer v1.7.0

## 0. 처음 시작하기
Subtitle Localizer를 처음 사용할 때 필요한 연결은 두 가지입니다.

1. **내 OpenAI API Key** — 자막 번역에 사용합니다.
2. **YouTube 연결** — 내 영상의 기존 자막을 가져오고 번역 자막을 다시 업로드할 때 사용합니다.

SRT 파일만 번역하고 YouTube 기능을 사용하지 않는다면 OpenAI 연결만 먼저 완료해도 됩니다. YouTube 자막 가져오기/업로드까지 사용하려면 Google Cloud와 YouTube 연결까지 완료합니다.

앱의 `/guide` 페이지는 처음 사용자를 위한 상세 설정 안내 페이지입니다. 작업공간 상단, 연결 관리 상단, 사이트 푸터에서 들어갈 수 있습니다.

---

## 1. 내 OpenAI API Key 연결하기

### 1-1. 왜 필요한가요?
Subtitle Localizer는 번역 요청을 사용자의 OpenAI 계정으로 보냅니다. 따라서 앱 운영자의 공용 API Key를 사용하는 구조가 아니라, 각 사용자가 자신의 API Key를 연결하는 BYOK 방식입니다.

- 번역 사용료: 사용자의 OpenAI 계정에 직접 청구
- API Key 소유자: 사용자
- 앱 저장 방식: 서버에서 암호화 후 HttpOnly cookie
- localStorage/sessionStorage: 비밀정보 저장 안 함
- GitHub/Vercel 환경 변수: 사용자 개인 API Key를 넣지 않음

### 1-2. OpenAI에서 API Key 만들기
1. OpenAI Platform의 API Keys 페이지를 엽니다.
2. OpenAI 계정으로 로그인합니다.
3. 새 secret key를 만드는 버튼을 누릅니다.
4. 필요하면 키 이름을 알아보기 쉽게 지정합니다. 예: `Subtitle Localizer`.
5. 생성 직후 표시되는 secret key를 복사합니다.
6. 이 값은 채팅, 문서, 메모 공개 링크, GitHub issue 등에 붙여넣지 않습니다.

중요: 전체 secret key는 생성 직후에만 확인할 수 있는 경우가 있습니다. 나중에 전체 값을 다시 볼 수 없다면 기존 값을 복구하려 하지 말고 새 키를 만든 뒤 기존 키를 폐기하는 방식으로 처리합니다.

### 1-3. Subtitle Localizer에 저장하기
1. Subtitle Localizer에서 `연결 관리`를 엽니다.
2. `내 OpenAI API Key` 카드로 이동합니다.
3. 복사한 API Key를 입력합니다.
4. 같은 브라우저에서 다음 방문에도 유지하려면 `이 브라우저에 기억하기`를 체크합니다.
5. `키 연결`을 누릅니다.
6. 카드 상태가 `연결됨`으로 바뀌면 완료입니다.

`보기` 버튼은 현재 입력 중인 값의 가시성만 전환합니다. 이미 저장된 secret의 전체 값을 다시 꺼내 보여주는 기능으로 사용하지 않습니다.

### 1-4. 키를 바꾸거나 지우기
- 새 키로 바꾸려면 새 API Key를 입력하고 `키 교체`를 누릅니다.
- 저장된 키를 더 이상 쓰지 않으려면 `저장된 키 지우기`를 누릅니다.
- OpenAI 측에서도 폐기해야 하는 키라면 OpenAI Platform에서 해당 키를 revoke/delete 합니다.

### 1-5. 자주 생기는 문제
**`연결 필요`가 계속 보일 때**
- 입력값 앞뒤에 불필요한 공백이 없는지 확인합니다.
- 생성한 키가 이미 폐기된 키가 아닌지 확인합니다.
- 필요하면 새 키를 발급해 교체합니다.

**번역 중 API Key 오류가 날 때**
- 저장된 키가 유효하지 않으면 앱은 다시 연결이 필요하다고 표시할 수 있습니다.
- 새 키를 발급해 `연결 관리`에서 교체합니다.

---

## 2. YouTube 연결 구조 이해하기
YouTube 연결은 한 번에 한 버튼으로 끝나는 구조가 아닙니다. 사용자가 직접 소유한 Google Cloud 프로젝트와 OAuth Client를 만들고, 그 Client를 Subtitle Localizer에 저장한 뒤 YouTube 계정을 연결합니다.

전체 순서:

1. Google Cloud 전용 프로젝트 만들기
2. YouTube Data API v3 켜기
3. Google Auth Platform 앱 정보/Branding 설정
4. Audience 상태 확인
5. YouTube scope 추가
6. OAuth Web Client 만들기
7. Client ID / Secret을 Subtitle Localizer에 저장
8. 첫 YouTube 채널 연결

이 설정은 **최초 1회**를 목표로 합니다. 정상적인 추가 Google 계정/YouTube 채널 연결 때문에 Google Cloud를 처음부터 반복하지 않습니다.

---

## 3. Google Cloud 8단계 상세 설정

### 3-1. 전용 프로젝트 만들기
1. Google Cloud Console에서 새 프로젝트를 만듭니다.
2. 권장 이름은 `Subtitle Localizer`입니다.
3. 생성이 끝난 뒤 상단 프로젝트 선택기에서 방금 만든 프로젝트를 다시 선택합니다.

완료 기준: 화면 상단의 현재 프로젝트가 `Subtitle Localizer`인지 확인합니다.

왜 전용 프로젝트를 권장하나요? 기존 업무용/개인 프로젝트의 API와 OAuth 설정을 건드리지 않고 Subtitle Localizer용 quota와 설정을 분리하기 쉽기 때문입니다.

### 3-2. YouTube Data API v3 사용 설정
1. API Library에서 `YouTube Data API v3`를 엽니다.
2. 현재 프로젝트가 `Subtitle Localizer`인지 다시 확인합니다.
3. `사용 설정`을 누릅니다.

완료 기준: `사용 설정됨` 또는 `Enabled` 상태가 보입니다.

### 3-3. Google Auth Platform 기본 정보와 Branding
1. Google Auth Platform을 엽니다.
2. 처음이라면 `시작하기`를 누릅니다.
3. 앱 이름은 `Subtitle Localizer`를 권장합니다.
4. 사용자 유형은 `External`을 선택합니다.
5. 지원 이메일과 개발자 연락처에는 본인이 사용하는 이메일을 지정합니다.
6. Branding의 앱 도메인에 아래 공개 URL을 저장합니다.

- 홈페이지: `https://subtitle-localizer.vercel.app/`
- 개인정보처리방침: `https://subtitle-localizer.vercel.app/privacy`
- 서비스 약관: `https://subtitle-localizer.vercel.app/terms`

완료 기준: Branding 화면에서 위 정보가 저장되어 있습니다.

### 3-4. Audience / Publishing 상태
여러 Google 계정이나 YouTube 채널을 계속 추가할 계획이면 `In Production` 상태를 권장합니다.

Testing 상태에서는 Test users로 등록되지 않은 Google 계정이 `403 access_denied`로 차단될 수 있습니다. 실제 E2E에서도 이 동작을 확인했습니다.

`앱 게시`가 활성화되지 않으면 먼저 Branding의 필수 정보와 공개 URL이 저장되어 있는지 확인합니다.

검증되지 않은 OAuth 앱을 Production으로 사용하면 Google의 `확인되지 않은 앱` 경고가 나타날 수 있습니다. 이 경고와 `403 access_denied`는 같은 문제가 아닙니다. 하나는 앱 검증 상태와 관련된 경고이고, 다른 하나는 Testing/Test user 조건 때문에 승인이 막히는 경우가 대표적입니다.

### 3-5. YouTube 권한(scope) 추가
Data Access / Scopes에서 다음 권한을 추가합니다.

`https://www.googleapis.com/auth/youtube.force-ssl`

1. `범위 추가 또는 삭제`를 누릅니다.
2. 위 scope를 입력해 선택합니다.
3. `업데이트`를 누릅니다.
4. Data Access 화면으로 돌아와 `저장`까지 완료합니다.

완료 기준: 해당 scope가 저장되어 있고 변경 대기 상태가 남아 있지 않습니다.

### 3-6. OAuth Client 만들기
1. Google Auth Platform의 Clients 화면을 엽니다.
2. `+ 클라이언트 만들기`를 누릅니다.
3. 유형은 `Web application`을 선택합니다.
4. 권장 이름은 `Subtitle Localizer Web`입니다.

가장 중요한 두 칸:

**Authorized JavaScript origins / 승인된 JavaScript 원본**
- 비워 둡니다.
- Subtitle Localizer callback 주소를 이 칸에 넣지 않습니다.

**Authorized redirect URIs / 승인된 리디렉션 URI**
- 아래 주소만 추가합니다.
- `https://subtitle-localizer.vercel.app/api/youtube/oauth/callback`

완료 기준: callback 주소가 정확히 redirect URI 목록에 있고 JavaScript origins는 비어 있습니다.

### 3-7. Client ID / Secret 저장
OAuth Client 생성 후 Google이 발급한 Client ID와 Client Secret을 Subtitle Localizer로 가져옵니다.

1. `연결 관리`의 YouTube 연결 마법사 7단계로 이동합니다.
2. `OAuth Client ID` 칸에 Client ID를 입력합니다.
3. `OAuth Client Secret` 칸에 Client Secret을 입력합니다.
4. 같은 브라우저에서 유지하려면 `이 브라우저에 기억하기`를 선택합니다.
5. 저장 버튼을 누릅니다.

Client Secret은 실제 값을 문서, GitHub, 스크린샷에 남기지 않습니다.

완료 기준: 앱이 `Cloud Client를 저장했습니다` 상태로 넘어갑니다.

### 3-8. 첫 YouTube 채널 연결
1. 앱의 마지막 단계에서 `Google로 YouTube 연결`을 누릅니다.
2. 연결할 Google 계정을 선택합니다.
3. 요청되는 YouTube 권한을 확인하고 승인합니다.
4. Google에서 앱으로 돌아오면 연결된 채널 카드가 표시됩니다.

완료 기준:
- 연결 관리에 채널 이름이 표시됨
- `현재 작업 채널`이 선택됨
- 작업공간 상단 채널 바에도 같은 채널이 표시됨

---

## 4. 추가 Google 계정 / YouTube 채널 연결
최초 Cloud 설정이 완료됐다면 정상적인 계정/채널 추가 때문에 프로젝트/API/scope/OAuth Client를 다시 만들지 않습니다.

1. 연결 관리에서 `+ 계정 또는 채널 추가`를 누릅니다.
2. 다른 Google 계정을 선택합니다.
3. YouTube 권한을 승인합니다.
4. 연결이 끝나면 채널 목록에 새 채널이 추가됩니다.
5. 작업할 채널의 `이 채널 사용`을 누르거나 작업공간 상단 선택기에서 전환합니다.

활성 채널을 바꾸면 영상 목록, YouTube 자막 가져오기, 번역 자막 업로드 대상이 모두 같은 활성 채널 기준으로 바뀝니다.

---

## 5. YouTube 연결 문제 복구

### `403 access_denied`
대표적인 원인: Google Auth Platform이 Testing 상태인데 로그인한 계정이 Test users에 없습니다.

해결 방향:
- Audience에서 해당 계정을 Test user에 추가하거나
- Branding이 준비된 상태에서 `In Production`으로 전환합니다.

### `확인되지 않은 앱` 경고
사용자가 직접 만든 미검증 OAuth 앱에서 나타날 수 있습니다. Client ID/Secret 오류와 동일한 의미는 아닙니다.

### `선택한 Google 계정에 YouTube 채널이 없습니다`
해당 Google 계정에 실제 YouTube 채널이 존재하는지 확인합니다. 채널을 만든 뒤 앱에서 다시 연결합니다.

### `Client 정보 또는 Google 승인 상태를 확인해 주세요`
- Client ID/Secret이 현재 프로젝트의 Web application Client 값인지 확인합니다.
- callback URI가 정확히 Authorized redirect URIs에 있는지 확인합니다.
- Client를 삭제했거나 Secret을 교체했다면 앱의 기존 Cloud Client 설정도 교체합니다.

### Google Cloud를 처음부터 다시 해야 하는 경우
일반적인 채널 추가가 아니라 아래와 같은 예외에서만 고려합니다.
- OAuth Client 자체를 삭제함
- Client Secret을 교체함
- Google Cloud 프로젝트를 삭제함
- YouTube Data API v3를 비활성화함
- 저장된 브라우저 데이터를 직접 삭제함

---

## 6. SRT 파일 번역하기
1. 작업공간 `원본 자막`에서 `SRT 파일`을 선택합니다.
2. `.srt` 파일을 드롭하거나 클릭해서 선택합니다.
3. 번역 언어를 선택합니다.
4. 필요하면 번역 스타일과 고급 설정을 조정합니다.
5. `번역 시작`을 누릅니다.
6. 완료 후 구조 검증에서 타임코드/cue ID/누락/추가를 확인합니다.
7. 개별 SRT 또는 ZIP을 다운로드합니다.

OpenAI 연결이 없는 상태에서 번역을 시작하면 앱은 연결 관리로 안내합니다.

---

## 7. YouTube 기존 자막 가져오기
1. `원본 자막`에서 `YouTube 자막` 탭을 선택합니다.
2. `원본 영상`을 선택합니다.
3. `기존 자막`에서 가져올 트랙을 선택합니다.
4. `SRT 가져오기`를 누릅니다.
5. 성공하면 `원본 자막` 영역 안에 `가져오기 완료` 상태가 표시됩니다.
6. 언어, cue 수, 영상 제목, 트랙 이름, 생성 파일명을 확인합니다.

가져온 원본 언어가 번역 대상 언어와 같으면 같은 언어를 다시 번역하지 않도록 해당 대상이 자동 해제됩니다.

---

## 8. 번역 자막을 YouTube에 올리기
1. 번역 완료 후 오른쪽 `YouTube에 올리기`를 확인합니다.
2. 업로드할 영상을 선택합니다.
3. 자막 트랙 이름을 확인합니다.
4. 업로드할 언어를 선택합니다.
5. `자막 YouTube에 올리기`를 누릅니다.
6. 각 언어에 `업로드 완료`가 표시되면 성공입니다.

업로드 대상 영상이 현재 YouTube 원본 영상과 같다면 앱이 기존 자막 트랙 목록을 즉시 다시 불러옵니다.

---

## 9. 실제 E2E 기준
실제 검증 파일:
- 영상: `subtitle-localizer-e2e-test.mp4`
- 원본 자막: `localization-challenge-en.srt`

확인 완료:
1. 30 cue 로드
2. 한국어 번역
3. 타임코드 30/30 / Cue ID 30/30 / 누락 0 / 추가 0
4. YouTube 한국어 자막 업로드
5. `ko · Subtitle Localizer` 트랙 확인
6. 같은 트랙을 앱에서 다시 SRT로 가져와 30 cue 확인
7. 업로드 직후 동일 영상 자막 목록 자동 갱신
8. 가져온 한국어 원본이 번역 대상 한국어 자동 해제
9. 두 Google 계정/채널 연결 및 전환
10. 채널별 영상 목록 분리

---

## 10. 화면 레이아웃 상태
v1.7.0에서는 아래 UI 보완이 Production까지 반영됐습니다.
- 연결 관리 제목과 설명의 문장 경계를 JSX 명시적 줄바꿈으로 고정
- 작업공간 상단 현재 YouTube 작업 채널 바의 위·아래 간격 확보
- 데스크톱 오른쪽 YouTube 업로드 영역과 현재 작업 요약이 스크롤 중 겹치지 않도록 우측 열 전체를 sticky + 내부 스크롤 구조로 구성

---

## 11. 보안과 비용 요약
- OpenAI API Key는 사용자가 직접 소유합니다.
- Google OAuth Client와 YouTube quota도 사용자가 직접 소유합니다.
- 비밀정보는 암호화한 HttpOnly cookie에 저장합니다.
- localStorage/sessionStorage에는 비밀정보를 저장하지 않습니다.
- SRT 파일은 서버 영구 저장소에 보관하지 않습니다.
- OpenAI 비용과 Google API quota는 각 사용자 계정에 귀속됩니다.
- 실제 secret은 문서, GitHub, 로그, 스크린샷에 남기지 않습니다.
