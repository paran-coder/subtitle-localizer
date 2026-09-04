import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export function appSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET?.trim() ?? "";
  return { configured: secret.length >= 32, secret };
}

function deriveKey(secret: string) {
  if (secret.trim().length < 32) throw new Error("APP_SESSION_SECRET는 32자 이상이어야 합니다.");
  return createHash("sha256").update(secret).digest();
}

export function sealJson(value: unknown, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function unsealJson<T>(value: string, secret: string): T {
  const [ivPart, tagPart, cipherPart] = value.split(".");
  if (!ivPart || !tagPart || !cipherPart) throw new Error("암호화 세션 형식이 올바르지 않습니다.");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(cipherPart, "base64url")),
    decipher.final()
  ]).toString("utf8");
  return JSON.parse(plaintext) as T;
}

export const secureCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/"
};

export function rememberedCookieOptions(remember: boolean): typeof secureCookieOptions & { maxAge?: number } {
  return remember ? { ...secureCookieOptions, maxAge: 30 * 24 * 60 * 60 } : { ...secureCookieOptions };
}
