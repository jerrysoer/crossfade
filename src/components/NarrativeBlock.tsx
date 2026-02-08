import Image from "next/image";
import type { CrossoverDirection } from "@/lib/types";

interface NarrativeBlockProps {
  name: string;
  photoUrl: string | null;
  narrative: string;
  didYouKnow: string;
  crossoverDirection: CrossoverDirection;
}

const DIRECTION_LABELS: Record<CrossoverDirection, string> = {
  "music-to-film": "Music to Film",
  "film-to-music": "Film to Music",
  simultaneous: "Dual Threat",
};

export default function NarrativeBlock({
  name,
  photoUrl,
  narrative,
  didYouKnow,
  crossoverDirection,
}: NarrativeBlockProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-[320px] lg:max-w-[280px]">
      {/* Person photo */}
      <div
        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-5 ring-2 ring-[var(--border)] ring-offset-2 ring-offset-[var(--surface)]"
        style={{ boxShadow: "0 0 40px rgba(212, 168, 83, 0.12), 0 0 80px rgba(212, 168, 83, 0.06)" }}
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--surface-elevated)] flex items-center justify-center">
            <svg
              className="w-10 h-10 text-[var(--text-muted)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 10-16 0" />
            </svg>
          </div>
        )}
      </div>

      {/* Name */}
      <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-3">
        {name}
      </h2>

      {/* Direction badge */}
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase mb-6"
        style={{
          background:
            crossoverDirection === "film-to-music"
              ? "var(--accent-warm-dim)"
              : crossoverDirection === "music-to-film"
                ? "var(--accent-gold-dim)"
                : "linear-gradient(135deg, var(--accent-gold-dim), var(--accent-warm-dim))",
          color:
            crossoverDirection === "film-to-music"
              ? "var(--accent-warm)"
              : "var(--accent-gold)",
        }}
      >
        {crossoverDirection === "music-to-film" && (
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {crossoverDirection === "film-to-music" && (
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {DIRECTION_LABELS[crossoverDirection]}
      </span>

      {/* Narrative quote */}
      <div className="connection-quote text-sm sm:text-base mb-6 px-4">
        {narrative}
      </div>

      {/* Did you know? */}
      {didYouKnow && (
        <div className="w-full border border-dashed border-[var(--border)] rounded-xl px-5 py-4">
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[var(--text-muted)] mb-2">
            Did you know?
          </p>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {didYouKnow}
          </p>
        </div>
      )}
    </div>
  );
}
