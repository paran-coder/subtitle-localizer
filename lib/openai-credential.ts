import { sealJson, unsealJson } from "./secure-session.ts";

export const OPENAI_CREDENTIAL_COOKIE = "subtitle_openai_credential";

export type OpenAiCredential = {
  apiKey: string;
  remember: boolean;
};

export function validateOpenAiCredential(value: Partial<OpenAiCredential>): OpenAiCredential {
  const apiKey = typeof value.apiKey === "string" ? value.apiKey.trim() : "";
  const remember = Boolean(value.remember);
  if (!apiKey || apiKey.length > 512) throw new Error("OpenAI API Key를 확인해 주세요.");
  return { apiKey, remember };
}

export function sealOpenAiCredential(value: OpenAiCredential, secret: string) {
  return sealJson(validateOpenAiCredential(value), secret);
}

export function unsealOpenAiCredential(value: string, secret: string) {
  return validateOpenAiCredential(unsealJson<Partial<OpenAiCredential>>(value, secret));
}
