"use client";

import { usePathname } from "next/navigation";

export default function FirstUseGuideLink() {
  const pathname = usePathname();
  if (pathname !== "/") return null;

  return <div className="first-use-guide-strip" role="note">
    <div>
      <span>처음 사용하시나요?</span>
      <strong>OpenAI API Key와 YouTube 연결을 처음부터 안내해 드립니다.</strong>
    </div>
    <a href="/guide">처음 사용 가이드 →</a>
  </div>;
}
