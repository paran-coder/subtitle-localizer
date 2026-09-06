"use client";

import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/guide", label: "초기 설정" },
  { href: "/connections", label: "연결 관리" },
  { href: "/", label: "작업하기" }
] as const;

export default function PrimarySectionNav() {
  const pathname = usePathname();
  if (pathname !== "/" && pathname !== "/guide" && pathname !== "/connections") return null;

  return (
    <nav className="primary-section-nav" aria-label="주요 화면">
      {SECTIONS.map((section) => {
        const active = pathname === section.href;
        return (
          <a
            key={section.href}
            href={section.href}
            className={active ? "is-active" : ""}
            aria-current={active ? "page" : undefined}
          >
            {section.label}
          </a>
        );
      })}
    </nav>
  );
}
