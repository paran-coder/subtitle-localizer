# User manual.md — Subtitle Localizer v1.7.0

## 1. 자막 번역
1. 메인 작업공간에서 SRT를 업로드하거나 샘플을 불러옵니다.
2. 대상 언어와 번역 스타일을 선택합니다.
3. OpenAI가 연결되어 있지 않으면 `연결 관리`에서 자신의 OpenAI API Key를 연결합니다.
4. 번역을 실행하고 타임코드 / Cue ID 검증 결과를 확인합니다.
5. SRT 또는 ZIP으로 다운로드합니다.

## 2. Google / YouTube 처음 연결하기
처음 한 번만 Google Cloud 설정 마법사를 진행합니다.

목표는 Google Cloud를 공부하는 것이 아니라, 화면에서 안내하는 순서대로 필요한 버튼만 누르고 필요한 값만 입력하는 것입니다.

### 1/8 Google Cloud 프로젝트 준비
- `Google Cloud 열기`를 누릅니다.
- 새 전용 프로젝트를 만드는 것을 권장합니다.
- 프로젝트 이름은 `Subtitle Localizer`를 사용합니다.
- 프로젝트 생성 후 반드시 새 프로젝트가 선택되어 있는지 확인합니다.

### 2/8 YouTube Data API v3 켜기
- 앱의 `YouTube Data API v3 열기` 버튼을 누릅니다.
- Google Cloud 화면에서 `사용 설정`을 누릅니다.
- `사용 설정됨` 상태가 보이면 완료입니다.

### 3/8 Google Auth Platform 기본 설정 + Branding 완성
- Google Auth Platform에서 시작합니다.
- 앱 이름은 `Subtitle Localizer`를 사용합니다.
- Audience는 `External`을 선택합니다.
- 지원 이메일과 개발자 연락처처럼 본인만 알 수 있는 필수 값을 입력합니다.

Branding의 앱 도메인에는 Subtitle Localizer가 보여주는 아래 공개 URL을 그대로 사용합니다.

```text
애플리케이션 홈페이지
https://subtitle-localizer.vercel.app/

애플리케이션 개인정보처리방침 링크
https://subtitle-localizer.vercel.app/privacy

애플리케이션 서비스 약관 링크
https://subtitle-localizer.vercel.app/terms
```

`승인된 도메인`에는 `subtitle-localizer.vercel.app`을 사용합니다. 이미 들어가 있으면 다시 추가할 필요가 없습니다.

앱 이름, 지원 이메일, 승인된 도메인, 개발자 연락처를 이미 설정한 기존 사용자는 다시 입력하지 말고 비어 있는 앱 도메인 URL만 확인하면 됩니다.

### 4/8 Publishing 상태 정리
Branding 저장을 완료한 뒤 왼쪽 `대상`으로 이동합니다.

- 여러 Google 계정을 나중에 추가할 때 Test user를 계속 관리하지 않으려면 `In Production` 전환을 권장합니다.
- 화면이 `테스트 중`이면 새로운 Google 계정이 `403 access_denied`로 차단될 수 있습니다.
- `앱 게시` 버튼이 비활성화되어 있다면 먼저 Branding의 필수 정보와 앱 도메인 URL이 저장되어 있는지 확인합니다.
- Testing을 유지할 수도 있지만 실제로 로그인할 Google 계정을 Test users에 계속 추가해야 할 수 있습니다.
- Google 검증 신청은 별도 절차이며 일반 초기 연결의 필수 단계로 보지 않습니다.

### 5/8 YouTube 권한 추가
Data Access에서 앱이 제공하는 아래 값을 그대로 사용합니다.

```text
https://www.googleapis.com/auth/youtube.force-ssl
```

앱의 `복사` 버튼을 사용하면 직접 입력할 필요가 없습니다.

### 6/8 OAuth Web Client 만들기
- Application type: `Web application`
- Name: `Subtitle Localizer Web`

중요:
- `Authorized JavaScript origins`에는 아무것도 입력하지 않습니다.
- `Authorized redirect URIs`에만 Subtitle Localizer가 보여주는 callback URI를 붙여넣습니다.

두 입력 영역을 혼동하지 마십시오.

### 7/8 Client ID / Secret 저장
Google에서 생성된 다음 두 값만 Subtitle Localizer에 입력합니다.
- Google OAuth Client ID
- Google OAuth Client Secret

Secret은 채팅이나 문서에 붙여넣지 말고 Subtitle Localizer 입력칸에 직접 넣습니다.

앱은 이 값을 서버에서 암호화한 HttpOnly cookie로 저장합니다.

Client가 저장됐다는 사실만으로 Google Auth Platform의 Publishing 상태까지 자동 확인되는 것은 아닙니다. 여러 Google 계정을 추가할 예정이라면 3/8과 4/8의 Branding/Publishing 상태도 완료해야 합니다.

### 8/8 첫 YouTube 채널 연결
- `Google로 YouTube 연결`을 누릅니다.
- Google 계정을 선택합니다.
- YouTube 권한을 승인합니다.
- Subtitle Localizer로 돌아오면 실제 YouTube 채널 정보를 확인합니다.

실제 채널이 확인되고 기본 API 호출이 성공하면 첫 채널 연결이 완료됩니다.

## 3. 이후 계정 또는 채널 추가하기
초기 Google Cloud 및 Publishing 설정이 완료된 뒤에는 정상적인 추가 연결 때문에 Google Cloud Console을 다시 설정하지 않습니다.

`+ 계정 또는 채널 추가`를 누른 뒤 다음 순서만 진행합니다.

1. Google 계정 선택
2. YouTube 권한 승인
3. 실제 YouTube 채널 확인
4. 연결 목록에 추가

기존에 연결한 채널은 유지됩니다.

예:

```text
채널 A
채널 B
채널 C
+ 계정 또는 채널 추가
```

같은 채널을 다시 연결하면 중복으로 하나 더 만들지 않고 기존 연결 정보를 갱신합니다.

새 계정 선택 직후 Google에서 `403 access_denied`가 보이고 앱이 `Testing` 상태라면, Google Auth Platform → Branding에서 공개 URL 저장 여부를 확인한 뒤 → Audience에서 Publishing 상태를 확인합니다.

## 4. 작업 채널 선택하기
메인 작업공간의 `현재 작업 채널`에서 사용할 YouTube 채널을 선택합니다.

```text
현재 작업 채널
[ 채널 A ▾ ]
```

채널을 변경하면 이전 채널에서 선택했던 영상과 자막 선택 상태는 초기화됩니다.

다음 작업은 모두 선택한 동일 채널을 사용합니다.
- YouTube 영상 목록 불러오기
- 기존 자막 트랙 조회
- 기존 자막 SRT 가져오기
- 번역된 자막 YouTube 업로드

## 5. 영상이 없는 경우
연결은 정상인데 해당 채널에 업로드 영상이 없으면 다음과 같이 안내됩니다.

```text
이 채널에는 업로드된 영상이 없습니다.
YouTube에 영상을 올린 뒤 다시 불러오세요.
```

`YouTube Studio 열기`를 눌러 영상을 업로드한 뒤 `다시 불러오기`를 누릅니다.

YouTube 채널 자체가 없는 계정은 `업로드 영상 0개`와 다른 상태로 안내됩니다.

## 6. 연결 관리
각 YouTube 채널 연결은 독립적으로 관리됩니다.

- 특정 채널 연결 해제: 해당 채널만 제거
- 다른 채널 연결: 유지
- Google Cloud 설정 전체 삭제: 해당 Cloud 설정을 사용하는 YouTube 연결 전체 제거

정상적인 채널 추가 외에 다음 상황에서는 재연결이나 재설정이 필요할 수 있습니다.
- 브라우저의 저장 데이터를 직접 삭제한 경우
- Google 계정에서 Subtitle Localizer 권한을 직접 취소한 경우
- OAuth Client를 삭제하거나 Secret을 교체한 경우
- Google Cloud 프로젝트나 YouTube Data API를 삭제/비활성화한 경우
- Google OAuth 앱을 다시 Testing으로 돌리거나 Branding 필수 정보가 제거된 경우

## 7. 개인정보처리방침 / 서비스 약관
공개 페이지는 로그인 없이 열립니다.

- 개인정보처리방침: `/privacy`
- 서비스 약관: `/terms`

개인정보처리방침에는 OpenAI/Google 연결에서 어떤 정보가 처리되는지, 비밀정보를 어떻게 보관하는지, SRT 파일을 영구 저장하도록 설계하지 않았다는 점을 설명합니다.

서비스 약관에는 BYOK/BYOC 비용 구조, 외부 API 의존성, 업로드·번역·게시 콘텐츠에 필요한 권한을 사용자가 보유해야 한다는 점을 설명합니다.

## 8. 보안
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화됩니다.
- 비밀정보는 HttpOnly cookie에 저장됩니다.
- localStorage / sessionStorage에는 비밀정보를 저장하지 않습니다.
- APP_SESSION_SECRET은 배포자 Vercel에만 저장합니다.
- 운영자 소유 Google OAuth Client는 사용하지 않습니다.

## 9. 비용
- OpenAI 번역 비용: 사용자가 입력한 자신의 OpenAI 계정
- YouTube Data API quota: 사용자가 설정한 자신의 Google Cloud 프로젝트
- Vercel hosting/function 사용량: 앱 배포자 계정

## 10. 처음 설정 완료 기준
앱에서 직접 확인할 수 있는 상태와 Google Console에서 사용자가 완료해야 하는 상태를 구분합니다.

앱에서 확인:
- Client ID / Secret 저장
- Google OAuth 승인
- 실제 YouTube 채널 확인
- 채널 세션 저장
- 해당 채널 API 호출 성공

Google Console에서 확인:
- Branding 필수 정보 저장
- 홈페이지 / 개인정보처리방침 / 서비스 약관 URL 저장
- 여러 Google 계정을 Test user 재등록 없이 추가하려면 Audience에서 `In Production` 전환
