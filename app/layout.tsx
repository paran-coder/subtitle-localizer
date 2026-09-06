import type { Metadata } from "next";
import type { ReactNode } from "react";
import WorkspaceChannelBar from "@/components/workspace-channel-bar";
import PrimarySectionNav from "@/components/first-use-guide-link";
import SitePolicyFooter from "@/components/site-policy-footer";
import "./globals.css";
import "./v17.css";
import "./v17-version.css";
import "./legal.css";
import "./ui-polish-v17.css";
import "./guide.css";
import "./first-use-guide.css";

export const metadata: Metadata = {
  title: "Subtitle Localizer",
  description: "타임스탬프를 보존하는 YouTube 다국어 SRT 현지화 도구"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body><PrimarySectionNav /><WorkspaceChannelBar />{children}<SitePolicyFooter /></body>
    </html>
  );
}
