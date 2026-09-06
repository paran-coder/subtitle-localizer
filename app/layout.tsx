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

const SITE_URL = new URL("https://subtitle-localizer.vercel.app");
const OG_IMAGE_URL = "/og/subtitle-localizer";
const OG_TITLE = "Subtitle Localizer | 타임코드는 그대로. 자막은 현지 언어처럼.";
const DESCRIPTION = "SRT 자막 번역부터 YouTube 업로드까지, 타임코드를 유지하는 다국어 자막 현지화 도구";

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: "Subtitle Localizer",
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Subtitle Localizer",
    title: OG_TITLE,
    description: DESCRIPTION,
    images: [{
      url: OG_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: "Subtitle Localizer — 타임코드는 그대로. 자막은 현지 언어처럼."
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: OG_TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE_URL]
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body><PrimarySectionNav /><WorkspaceChannelBar />{children}<SitePolicyFooter /></body>
    </html>
  );
}
