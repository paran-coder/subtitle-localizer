export type LanguageOption = {
  code: string;
  label: string;
  nativeLabel: string;
  fileSuffix: string;
};

export const LANGUAGES: LanguageOption[] = [
  { code: "ko", label: "Korean", nativeLabel: "한국어", fileSuffix: "ko" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語", fileSuffix: "ja" },
  { code: "es", label: "Spanish", nativeLabel: "Español", fileSuffix: "es" },
  { code: "fr", label: "French", nativeLabel: "Français", fileSuffix: "fr" },
  { code: "de", label: "German", nativeLabel: "Deutsch", fileSuffix: "de" },
  { code: "pt-BR", label: "Portuguese (Brazil)", nativeLabel: "Português (Brasil)", fileSuffix: "pt-BR" },
  { code: "zh-CN", label: "Chinese (Simplified)", nativeLabel: "简体中文", fileSuffix: "zh-CN" },
  { code: "zh-TW", label: "Chinese (Traditional)", nativeLabel: "繁體中文", fileSuffix: "zh-TW" },
  { code: "th", label: "Thai", nativeLabel: "ไทย", fileSuffix: "th" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt", fileSuffix: "vi" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia", fileSuffix: "id" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", fileSuffix: "ar" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", fileSuffix: "hi" },
  { code: "it", label: "Italian", nativeLabel: "Italiano", fileSuffix: "it" },
  { code: "nl", label: "Dutch", nativeLabel: "Nederlands", fileSuffix: "nl" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe", fileSuffix: "tr" },
  { code: "pl", label: "Polish", nativeLabel: "Polski", fileSuffix: "pl" }
];

export function getLanguage(code: string) {
  return LANGUAGES.find((language) => language.code === code);
}
