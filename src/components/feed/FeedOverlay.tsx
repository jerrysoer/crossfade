"use client";

import { useState, useCallback } from "react";
import ThemeToggle from "../ThemeToggle";
import SearchInput from "../SearchInput";

interface FeedOverlayProps {
  onSearch: (name: string) => void;
}

export default function FeedOverlay({ onSearch }: FeedOverlayProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelect = useCallback(
    (name: string) => {
      setSearchOpen(false);
      onSearch(name);
    },
    [onSearch]
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      {/* Top bar with gradient background */}
      <div
        className="pointer-events-auto"
        style={{
          background: "linear-gradient(to bottom, var(--background) 0%, var(--background) 40%, transparent 100%)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <button
            onClick={() => setSearchOpen((prev) => !prev)}
            className="font-[family-name:var(--font-lora)] text-lg text-[var(--text-primary)]
                       hover:text-[var(--accent-red)] transition-colors"
          >
            Cross<span className="cross-slash">/</span>Fade
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setSearchOpen((prev) => !prev)}
              className={`w-8 h-8 flex items-center justify-center rounded-full
                         border transition-all duration-200
                         ${searchOpen
                           ? "border-[var(--accent-red)] text-[var(--accent-red)] bg-[var(--accent-red-dim)]"
                           : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent-red)] hover:text-[var(--accent-red)]"
                         }`}
            >
              {searchOpen ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search panel (slides down) */}
        {searchOpen && (
          <div className="px-4 pb-4 animate-fade-in">
            <SearchInput onSelect={handleSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
