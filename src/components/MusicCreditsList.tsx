import Image from "next/image";
import type { MusicCredit } from "@/lib/types";

interface MusicCreditsListProps {
  credits: MusicCredit[];
}

export default function MusicCreditsList({ credits }: MusicCreditsListProps) {
  if (credits.length === 0) return null;

  return (
    <div className="w-full max-w-[280px]">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-xs font-semibold tracking-[0.25em] uppercase text-[var(--text-primary)]">
          Music
        </h3>
        <div className="flex-1 h-px bg-[var(--border)]" />
      </div>

      {/* Credits list */}
      <div className="flex flex-col">
        {credits.map((credit, i) => (
          <a
            key={`${credit.discogsId}-${i}`}
            href={credit.discogsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-3 py-3 -mx-2 px-2 rounded-lg
                       hover:bg-[var(--surface-elevated)] transition-colors duration-150
                       border-b border-[var(--border)] last:border-b-0"
          >
            {/* Cover thumbnail */}
            <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-[var(--surface-elevated)]">
              {credit.coverUrl ? (
                <Image
                  src={credit.coverUrl}
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
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] leading-tight truncate group-hover:text-[var(--accent-red)] transition-colors">
                {credit.title}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {credit.year > 0 ? credit.year : ""}
                {credit.year > 0 && credit.label ? " · " : ""}
                {credit.label}
              </p>
              {credit.genres.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {credit.genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="text-[10px] px-1.5 py-0.5 rounded-full
                                 bg-[var(--surface-elevated)] text-[var(--text-muted)]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
