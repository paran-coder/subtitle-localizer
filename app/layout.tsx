import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Subtitle Localizer",
  description: "타임스탬프를 보존하는 YouTube 다국어 SRT 번역 도구"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
