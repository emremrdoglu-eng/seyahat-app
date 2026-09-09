"use client";

import { useState } from "react";

export default function ShareButton() {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  }

  async function handleShare() {
    const url = window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus(fallbackCopy(url) ? "copied" : "failed");
    }

    setTimeout(() => setStatus("idle"), 2000);
  }

  const label =
    status === "copied"
      ? "Kopyalandı!"
      : status === "failed"
        ? "Kopyalanamadı"
        : "Paylaş";

  return (
    <button
      onClick={handleShare}
      className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
    >
      {label}
    </button>
  );
}
