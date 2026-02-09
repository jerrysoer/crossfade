import MusicCreditsList from "../MusicCreditsList";
import type { CrossoverArtist } from "@/lib/types";

interface MusicCreditsPanelProps {
  artist: CrossoverArtist;
  isStreaming: boolean;
}

function CreditsLoadingSkeleton() {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-12 h-12 rounded bg-[var(--border)] flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 bg-[var(--border)] rounded w-3/4" />
            <div className="h-2 bg-[var(--border)] rounded w-1/2" />
          </div>
        </div>
      ))}
      <p className="text-xs text-[var(--text-muted)] text-center mt-2">Loading credits...</p>
    </div>
  );
}

export default function MusicCreditsPanel({ artist, isStreaming }: MusicCreditsPanelProps) {
  const hasCredits = artist.musicCredits.length > 0;

  return (
    <div className="feed-panel flex flex-col items-center px-6 pt-16 pb-20 bg-[var(--background)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2 w-full max-w-[280px]">
        <svg
          className="w-4 h-4 text-[var(--accent-red)] flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4 12l1.41 1.41L10 8.83V20h4V8.83l4.59 4.58L20 12l-8-8-8 8z" />
        </svg>
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--text-muted)]">
          Swipe left to go back
        </span>
      </div>

      {/* Artist name context */}
      <h3 className="font-[family-name:var(--font-lora)] text-lg font-bold text-[var(--text-primary)] mb-6 text-center">
        {artist.name}
      </h3>

      {/* Credits */}
      {hasCredits ? (
        <MusicCreditsList credits={artist.musicCredits} />
      ) : isStreaming ? (
        <CreditsLoadingSkeleton />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="w-10 h-10 mb-3 opacity-20 text-[var(--text-muted)]">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <p className="text-xs text-[var(--text-muted)]">No music credits found</p>
        </div>
      )}
    </div>
  );
}
