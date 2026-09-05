import type { Metadata } from "next";
import type { ReactNode } from "react";
import WorkspaceChannelBar from "@/components/workspace-channel-bar";
import "./globals.css";
import "./v17.css";

export const metadata: Metadata = {
  title: "Subtitle Localizer",
  description: "타임스탬프를 보존하는 YouTube 다국어 SRT 현지화 도구"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body><WorkspaceChannelBar />{children}</body>
    </html>
  );
}
