# EN → KO / JA / ES Subtitle Fixture Review

Source: `demo-en.srt`

## Korean
- Natural order rather than English word order.
- “AI” remains unchanged as a technical identifier.
- Cue 3 uses “개념” instead of a literal “아이디어” because this line introduces a conceptual point.

## Japanese
- Avoids explicit pronouns.
- Uses concise subtitle-friendly phrasing and consistent polite register.
- Cue 3 uses “ポイント” for a spoken YouTube tone rather than a stiff literal equivalent.

## Spanish
- Uses neutral, broadly understandable Spanish.
- “AI” becomes the established Spanish initialism “IA”.
- Keeps all three cues short enough for the original exposure times.

These fixtures are quality references, not hard-coded model outputs. Automated tests verify SRT structure and timing preservation, while live model wording may vary.

## v1.3.0 localization-challenge-en.srt
`localization-challenge-en.srt`는 실제 번역 프롬프트 튜닝을 위한 난이도 샘플이다.

포함한 검증 요소:
- cue 경계를 넘는 하나의 문장 (2–3, 4–5, 24–25)
- 직역보다 현지화가 필요한 관용 표현 (`break a leg`)
- 영어 대명사 `you` 처리
- 짧은 노출 시간과 자막 길이 압박
- 고유명사/브랜드명 보존 (ChatGPT, OpenAI, Subtitle Localizer)
- 숫자와 수치 정보 보존 (12,480 / 37 minutes / 1.8 seconds)
- 여러 줄 cue
- 의미 보존과 타임코드 불변 요구
