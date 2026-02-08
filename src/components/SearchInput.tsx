"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";

interface SearchResult {
  id: number;
  name: string;
  photoPath: string | null;
  department: string;
}

interface SearchInputProps {
  onSelect: (name: string) => void;
  disabled?: boolean;
}

export default function SearchInput({ onSelect, disabled }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data: SearchResult[] = await res.json();
      setResults(data);
      setIsOpen(data.length > 0);
      setActiveIndex(-1);
    } catch {
      // Silently fail
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const handleSelect = (name: string) => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelect(name);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex].name);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm mx-auto">
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          disabled={disabled}
          placeholder="Search for an artist..."
          className="w-full pl-10 pr-4 py-2.5 rounded-full
                     bg-[var(--surface)] border border-[var(--border)]
                     text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
                     focus:outline-none focus:border-[var(--accent-red)] focus:ring-1 focus:ring-[var(--accent-red-dim)]
                     transition-colors duration-150
                     disabled:opacity-50"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 w-full bg-[var(--surface)] border border-[var(--border)]
                     rounded-xl shadow-lg overflow-hidden z-50
                     animate-fade-in"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r.name)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left
                         transition-colors duration-100
                         ${i === activeIndex ? "bg-[var(--accent-red-dim)]" : "hover:bg-[var(--surface-elevated)]"}`}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-[var(--surface-elevated)]">
                {r.photoPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w185${r.photoPath}`}
                    alt={r.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 10-16 0" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {r.name}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {r.department}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
