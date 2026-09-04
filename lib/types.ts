export type SubtitleCue = {
  id: number;
  start: string;
  end: string;
  text: string;
};

export type TranslationStyle =
  | "natural"
  | "faithful"
  | "concise"
  | "education"
  | "business";

export type TranslationItem = {
  id: number;
  text: string;
};

export type LanguageProgress = {
  languageCode: string;
  status: "queued" | "translating" | "done" | "error";
  completedChunks: number;
  totalChunks: number;
  error?: string;
};
