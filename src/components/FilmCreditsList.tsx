import Image from "next/image";
import type { FilmCredit } from "@/lib/types";

interface FilmCreditsListProps {
  credits: FilmCredit[];
}

export default function FilmCreditsList({ credits }: FilmCreditsListProps) {
  if (credits.length === 0) return null;

  return (
    <div className="w-full max-w-[280px]">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--accent-red)]">
          Film
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Credits list */}
      <div className="flex flex-col">
        {credits.map((credit, i) => (
          <a
            key={`${credit.tmdbId}-${i}`}
            href={credit.tmdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 py-3 -mx-2 px-2 rounded-lg
                       hover:bg-[var(--surface-elevated)] transition-colors duration-150
                       border-b border-[var(--border)] last:border-b-0"
          >
            {/* Poster thumbnail */}
            <div className="relative w-12 aspect-[2/3] flex-shrink-0 rounded overflow-hidden bg-[var(--surface-elevated)]">
              {credit.posterUrl ? (
                <Image
                  src={credit.posterUrl}
                  alt={credit.title}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[var(--text-muted)]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <rect x="2" y="3" width="20" height="18" rx="2" />
                    <path d="M7 3v18M17 3v18M2 9h20M2 15h20" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-[var(--text-primary)] leading-tight truncate group-hover:text-[var(--accent-red)] transition-colors">
                  {credit.title}
                </p>
                {credit.mediaType === "tv" && (
                  <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-red-dim)] text-[var(--accent-red)] font-medium uppercase tracking-wider">
                    TV
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {credit.year > 0 ? credit.year : ""}
              </p>
              {credit.character && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-[family-name:var(--font-lora)] italic truncate">
                  as {credit.character}
                </p>
              )}
              {credit.rating > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <svg
                    className="w-3 h-3 text-[var(--accent-red)]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                    {credit.rating}
                  </span>
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
