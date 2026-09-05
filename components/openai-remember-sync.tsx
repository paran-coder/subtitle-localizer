"use client";

import { useEffect } from "react";

export default function OpenAiRememberSync() {
  useEffect(() => {
    function handleChange(event: Event) {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (!target.matches('#openai-connection .v17-remember input[type="checkbox"]')) return;
      void fetch("/api/openai/credential", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remember: target.checked }),
        cache: "no-store"
      });
    }

    document.addEventListener("change", handleChange);
    return () => document.removeEventListener("change", handleChange);
  }, []);

  return null;
}
