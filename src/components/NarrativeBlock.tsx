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
        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden mb-5 border border-[var(--border)]"
        style={{ boxShadow: "var(--photo-shadow)" }}
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
      <h2 className="font-[family-name:var(--font-lora)] text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight mb-2">
        {name}
      </h2>

      {/* Direction label */}
      <span className="text-[11px] font-medium tracking-[0.15em] uppercase text-[var(--accent-red)] mb-6">
        {DIRECTION_LABELS[crossoverDirection]}
      </span>

      {/* Narrative quote */}
      <div className="connection-quote text-sm sm:text-base mb-6 px-4">
        {narrative}
      </div>

      {/* Did you know? */}
      {didYouKnow && (
        <div className="w-full bg-[var(--accent-red-dim)] border border-[var(--border)] rounded-lg px-5 py-4">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--accent-red)] mb-2">
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
