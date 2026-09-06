"use client";

import { usePathname } from "next/navigation";

export default function FirstUseGuideLink() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/connections") return null;

  const onConnections = pathname === "/connections";
  return <div className={`first-use-guide-strip ${onConnections ? "is-connections" : ""}`} role="note">
    <div>
      <span>{onConnections ? "설정이 낯설다면" : "처음 사용하시나요?"}</span>
      <strong>{onConnections ? "OpenAI API Key와 Google Cloud 8단계를 상세 가이드와 함께 진행할 수 있습니다." : "OpenAI API Key와 YouTube 연결을 처음부터 안내해 드립니다."}</strong>
    </div>
    <a href={onConnections ? "/guide#openai" : "/guide"}>{onConnections ? "설정 가이드 보기 →" : "처음 사용 가이드 →"}</a>
  </div>;
}
