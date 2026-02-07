"use client";

import { useState } from "react";

interface ShareButtonProps {
  artistName: string;
}

export default function ShareButton({ artistName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = `${artistName} — musician AND actor. Discovered on Cross/Fade`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Cross/Fade Discovery", text, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed silently
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-5 py-2.5 rounded-full
                 border border-[var(--border)] text-sm text-[var(--text-secondary)]
                 hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]
                 transition-all duration-200"
    >
      {copied ? (
        <>
          <svg
            className="w-4 h-4 text-[var(--accent-gold)]"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share this discovery
        </>
      )}
    </button>
  );
}
