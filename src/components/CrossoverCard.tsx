import type { CrossoverArtist } from "@/lib/types";
import FilmCreditsList from "./FilmCreditsList";
import MusicCreditsList from "./MusicCreditsList";
import NarrativeBlock from "./NarrativeBlock";
import ShareButton from "./ShareButton";

function EmptyCredits({ type }: { type: "film" | "music" }) {
  const isFilm = type === "film";
  return (
    <div className="w-full max-w-[280px] flex flex-col items-center justify-center py-8 text-center">
      <div className="w-10 h-10 mb-3 opacity-20">
        {isFilm ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-[var(--text-muted)]">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <path d="M7 3v18M17 3v18M2 9h20M2 15h20" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-[var(--text-muted)]">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        {isFilm ? "No film credits found" : "No music credits found"}
      </p>
    </div>
  );
}

function CreditsLoadingSkeleton() {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-12 h-16 rounded bg-[var(--border)] flex-shrink-0" />
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

interface CrossoverCardProps {
  artist: CrossoverArtist;
  onTryAnother: () => void;
  isStreaming?: boolean;
}

export default function CrossoverCard({
  artist,
  onTryAnother,
  isStreaming = false,
}: CrossoverCardProps) {
  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Main card */}
      <div
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-10 lg:p-12
                   overflow-hidden
                   animate-fade-in-scale opacity-0"
        style={{
          animationDelay: "0.1s",
          borderTop: "3px solid var(--accent-red)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {/* Three-column layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-6">
          {/* Film credits — left */}
          <div
            className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto
                       opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            {artist.filmCredits.length > 0 ? (
              <FilmCreditsList credits={artist.filmCredits} clipId={artist.filmClipId} />
            ) : isStreaming ? (
              <CreditsLoadingSkeleton />
            ) : (
              <EmptyCredits type="film" />
            )}
          </div>

          {/* Narrative center */}
          <div
            className="flex-shrink-0 flex justify-center
                       opacity-0 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <NarrativeBlock
              name={artist.name}
              photoUrl={artist.photoUrl}
              narrative={artist.narrative}
              didYouKnow={artist.didYouKnow}
              crossoverDirection={artist.crossoverDirection}
              birthday={artist.birthday}
              birthplace={artist.birthplace}
              deathday={artist.deathday}
            />
          </div>

          {/* Music credits — right */}
          <div
            className="flex-1 flex justify-center lg:justify-start w-full lg:w-auto
                       opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {artist.musicCredits.length > 0 ? (
              <MusicCreditsList credits={artist.musicCredits} clipId={artist.musicClipId} />
            ) : isStreaming ? (
              <CreditsLoadingSkeleton />
            ) : (
              <EmptyCredits type="music" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-8
                     border-t border-[var(--border)]
                     opacity-0 animate-fade-in"
          style={{ animationDelay: "0.7s" }}
        >
          <button
            onClick={onTryAnother}
            className="px-7 py-2.5 rounded-full bg-[var(--accent-red)] text-white
                       text-sm font-medium
                       hover:bg-[#BF2B29] hover:shadow-[0_4px_20px_rgba(214,50,48,0.15)]
                       active:scale-[0.98]
                       transition-all duration-200"
          >
            Discover another
          </button>
          <ShareButton artistName={artist.name} />
        </div>
      </div>
    </div>
  );
}
