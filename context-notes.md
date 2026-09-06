# context-notes.md — Subtitle Localizer v1.7.0

## 이번 버전의 목적
v1.6.4의 Google Cloud / YouTube 연결 흐름은 사용자가 Google Cloud 구조를 이해해야 하고, Google OAuth Client 1개와 YouTube 세션 1개만 보유하는 구조라 초보자와 다중 채널 운영자에게 맞지 않는다.

v1.7.0은 다음 두 문제를 함께 해결한다.
- 초보자가 생각하지 않고 그대로 따라갈 수 있는 **완결형 Google 연결 마법사**
- Google Cloud 설정은 한 번만 하고 이후 앱 안에서 여러 Google 계정/YouTube 채널을 추가·전환하는 **다중 채널 연결 구조**

## 제품 원칙
- 운영자 소유 Google OAuth Client / Google Cloud 프로젝트 / YouTube quota를 사용하지 않는다.
- 각 사용자는 자신의 Google Cloud 프로젝트와 OAuth Client를 계속 사용한다(BYOC).
- 사용자는 Google Cloud를 이해할 필요가 없다. 한 화면에서 한 행동만 안내한다.
- 사용자가 판단해야 하는 항목과 직접 입력해야 하는 항목을 최소화한다.
- 앱 이름, OAuth Client 이름, YouTube scope, redirect URI처럼 고정 가능한 값은 앱이 제시하고 복사 버튼을 제공한다.
- 초기 설정을 끝낸 뒤 정상적인 계정/채널 추가 때문에 Google Cloud Console에 다시 들어가게 하지 않는다.
- 여러 Google 계정과 여러 YouTube 채널을 독립 연결로 보유할 수 있어야 한다.
- 작업공간에서는 항상 하나의 활성 채널을 명확히 선택하고, 영상 조회/자막 다운로드/자막 업로드가 모두 그 활성 채널을 사용한다.

## 실제 E2E에서 추가로 확인된 요구사항
2026-09-06 실제 다중 계정 추가 E2E에서 기존 OAuth 앱이 `Testing` 상태라 새 Google 계정 연결이 `403 access_denied`로 차단되는 것을 확인했다.

또한 Google Auth Platform의 `대상` 화면에서 OAuth 구성이 완료되지 않았다는 경고가 표시되었고, `앱 게시`가 비활성화되어 있었다. `브랜딩` 화면에는 앱 이름/지원 이메일/승인된 도메인/개발자 연락처가 이미 저장되어 있었지만 앱 도메인의 공개 링크가 비어 있었다.

따라서 v1.7.0 초기 설정은 다음 공개 URL을 앱 자체에서 제공하고 Google Branding에 그대로 등록하도록 안내해야 한다.
- 애플리케이션 홈페이지: `https://subtitle-localizer.vercel.app/`
- 개인정보처리방침: `https://subtitle-localizer.vercel.app/privacy`
- 서비스 약관: `https://subtitle-localizer.vercel.app/terms`

`/privacy`와 `/terms`는 로그인 없이 공개 접근 가능해야 하며 메인 화면에서도 사용자가 찾을 수 있어야 한다.

중요: 앱은 사용자 OAuth Client가 저장되었다는 사실은 알 수 있지만 Google Auth Platform의 실제 Publishing 상태를 직접 검증하지 않는다. 따라서 Client 저장만으로 `Google Cloud 설정은 끝났습니다`라고 단정하지 않는다. 연결 관리 UI에서는 `Cloud Client 저장됨`과 `추가 계정 연결을 위한 Publishing 준비`를 구분해 설명한다.

## 초기 설정 마법사
기존 4단계를 실제 Google Cloud 흐름 기준의 8단계 마법사로 재구성한다.

1. **Google Cloud 프로젝트 준비**
   - 기존 프로젝트를 실수로 수정하지 않도록 새 전용 프로젝트 생성 경로를 우선 안내한다.
   - 프로젝트 이름 기본값: `Subtitle Localizer`
   - 생성 후 새 프로젝트를 실제로 선택했는지 확인한다.

2. **YouTube Data API v3 활성화**
   - 정확한 Google Cloud 이동 링크를 제공한다.
   - 사용자는 `사용 설정`만 누르면 되도록 안내한다.

3. **Google Auth Platform 기본 설정 + Branding 완성**
   - 앱 이름 기본값: `Subtitle Localizer`
   - 사용자 유형: External
   - 지원 이메일 / 개발자 연락처처럼 사용자에게 꼭 필요한 값만 입력하게 한다.
   - 홈페이지 / 개인정보처리방침 / 서비스 약관 URL을 앱에서 복사해 Branding의 앱 도메인에 입력하도록 안내한다.

4. **Publishing 상태 정리**
   - Branding 저장을 완료한 뒤 Audience에서 `In Production` 전환을 권장 경로로 안내한다.
   - 정상적인 추가 계정 연결 때마다 Test user를 다시 추가하지 않도록 한다.
   - 개인용/소규모 미검증 앱은 Google의 미검증 경고와 사용자 제한이 남을 수 있음을 짧게 알린다.
   - Google 검증 자체는 별도 운영 절차이며 일반 초기 설정의 필수 자동 완료 조건으로 취급하지 않는다.

5. **YouTube 권한 추가**
   - scope: `https://www.googleapis.com/auth/youtube.force-ssl`
   - 복사 버튼 제공.
   - 긴 OAuth 설명은 기본 화면에서 숨기고 `왜 필요한가요?`에서만 제공한다.

6. **OAuth Web Client 생성**
   - Application type: `Web application`
   - Name: `Subtitle Localizer Web`
   - `Authorized JavaScript origins`는 비워두도록 강하게 안내한다.
   - `Authorized redirect URIs`에만 앱이 제공하는 callback URI를 붙여넣게 한다.

7. **Client ID / Secret 저장**
   - 사용자가 입력해야 할 Google 자격증명은 Client ID / Secret으로 제한한다.
   - 저장은 서버 암호화 + HttpOnly cookie 방식을 유지한다.

8. **첫 YouTube 채널 연결 및 검증**
   - Google OAuth 승인 후 실제 channel ID/title을 조회한다.
   - 실제 채널 API 호출이 성공해야 첫 채널 연결 완료로 본다.

## 초기 설정 완료 기준
`Client 저장됨`과 `추가 계정 연결 준비 완료`를 구분한다.

앱이 직접 확인 가능한 항목:
- Client ID / Secret 저장 성공
- OAuth 승인 성공
- 실제 YouTube 채널 식별 성공
- 활성 채널 세션 저장 성공
- 해당 채널의 기본 API 호출 성공

사용자가 Google Console에서 완료해야 하는 항목:
- Branding 필수 정보 저장
- 홈페이지 / 개인정보처리방침 / 서비스 약관 URL 등록
- 여러 Google 계정을 Test user 재등록 없이 연결하려는 경우 Audience에서 `In Production` 전환

정상적인 추가 연결 외에 다음과 같은 복구 상황에서는 재설정이 필요할 수 있다.
- 사용자가 브라우저 저장 데이터를 직접 삭제
- Google 계정에서 앱 권한을 직접 취소
- OAuth Client 삭제 또는 Secret 교체
- Google Cloud 프로젝트/API 삭제 또는 비활성화

## 다중 YouTube 연결 구조
Google Cloud 설정과 YouTube 연결을 분리한다.

### Cloud config
하나의 사용자 소유 OAuth Client 설정을 재사용한다.
- clientId
- clientSecret
- remember

### Channel connection
채널별 OAuth 세션을 독립 저장한다.
- connectionId
- channelId
- channelTitle
- channelThumbnail
- accessToken
- refreshToken
- expiresAt
- scope
- connectedAt

같은 channelId를 다시 연결하면 중복 생성하지 않고 기존 연결을 갱신한다.

## 채널 선택 UX
작업공간에 활성 채널 선택기를 둔다.

```text
현재 작업 채널
[ 채널 A ▾ ]

채널 A
채널 B
채널 C
────────────
+ 계정 또는 채널 추가
연결 관리
```

- 채널을 바꾸면 기존 영상/자막 선택 상태를 초기화한다.
- 원본 YouTube 자막 가져오기와 번역 자막 업로드가 항상 동일한 활성 채널을 사용한다.
- 채널별 연결 해제가 다른 채널 세션을 삭제하지 않아야 한다.

## 빈 채널 / 채널 없음 상태
- 업로드 영상 0개면 `0개`만 보여주지 않는다.
- 원인과 다음 행동을 바로 안내한다.
- 예: `이 채널에는 업로드된 영상이 없습니다.` + `YouTube Studio 열기` + `다시 불러오기`
- 연결 계정에 YouTube 채널 자체가 없으면 영상 없음과 구분해 안내한다.

## 공개 정책 페이지
### 개인정보처리방침
다음 앱 동작을 사용자에게 공개한다.
- 사용자가 직접 입력한 OpenAI API Key와 Google OAuth Client Secret은 서버에서 암호화한 HttpOnly cookie에 보관한다.
- YouTube access/refresh token도 서버에서 암호화한 HttpOnly cookie에 보관한다.
- 번역 시 자막 텍스트는 사용자가 연결한 OpenAI API를 통해 처리된다.
- YouTube 연결/가져오기/업로드 시 필요한 데이터는 Google/YouTube API를 통해 처리된다.
- 업로드한 SRT 파일을 앱의 영구 파일 저장소에 보관하도록 설계하지 않는다.
- 사용자는 연결 관리에서 저장된 자격증명을 삭제할 수 있다.

### 서비스 약관
서비스의 BYOK/BYOC 구조, 사용자가 자신의 API 비용/quota를 부담한다는 점, 사용자가 업로드·번역·게시할 콘텐츠에 필요한 권한을 보유해야 한다는 점, 외부 API 제공자의 정책/가용성에 따라 일부 기능이 제한될 수 있다는 점을 명시한다.

## 보안
- OpenAI API Key, Google Client Secret, YouTube access/refresh token은 서버에서 암호화한다.
- 비밀정보는 HttpOnly cookie에만 저장한다.
- localStorage / sessionStorage에 비밀정보를 저장하지 않는다.
- APP_SESSION_SECRET은 배포자 Vercel에만 존재한다.
- 운영자 소유 Google OAuth 자격증명을 추가하지 않는다.

## 비용 구조
- OpenAI: 최종 사용자의 OpenAI API Key(BYOK)
- YouTube Data API: 최종 사용자의 Google Cloud 프로젝트 quota(BYOC)
- Vercel hosting/functions: 배포자 계정

## 버전 정책
이번 변경은 연결 정보 구조와 다중 채널 동작이 바뀌는 기능 추가이므로 `v1.7.0` Minor 버전으로 관리한다.

## 구현 단계
1. 문서 4종을 v1.7.0 기준으로 갱신
2. 연결 데이터 모델 및 암호화 cookie 구조 재설계
3. OAuth callback을 채널별 연결 등록 구조로 변경
4. 채널 목록 / 활성 채널 API 추가
5. 영상·자막 API가 활성 채널 연결을 사용하도록 변경
6. 초보자용 8단계 Google 연결 마법사 구현
7. 작업공간 채널 선택기 + 빈 채널 UX 구현
8. 공개 `/privacy` / `/terms` 페이지와 홈페이지 정책 링크 추가
9. Publishing 안내를 실제 E2E 결과에 맞게 보정
10. 회귀/보안/다중 연결 테스트
11. 전체 ZIP 생성(배포 저장소에는 포함하지 않음)
12. GitHub main 반영 → Vercel Production READY 및 Runtime Error 확인 → 실제 E2E

## 테스트 핵심 케이스
- 기존 OpenAI BYOK 동작 유지
- 기존 Google BYOC 자격증명 암호화 유지
- 연결 A 추가 후 연결 B 추가 시 A 유지
- 동일 channelId 재연결 시 중복 없음
- 활성 채널 변경
- 채널별 영상 목록 분리
- 채널별 자막 조회/다운로드/업로드
- 한 채널 연결 해제 시 다른 채널 유지
- Google Cloud 설정 삭제 시 모든 YouTube 연결 제거
- 채널 없음 / 영상 0개 상태 구분
- OAuth 오류 복구
- refresh token 갱신
- `/privacy`와 `/terms` 공개 접근
- 메인/연결 화면에서 정책 페이지 접근 가능
- Client 저장만으로 Google Publishing 완료를 단정하지 않음
- localStorage/sessionStorage 비밀정보 0건
- 모바일/키보드/focus-visible/reduced-motion 회귀 없음

## 단계별 자체 점검
각 주요 단계가 끝날 때 다음을 기록한다.
- 완료 항목
- 발견한 문제와 수정
- 남은 작업
- 자체 점수 /10
