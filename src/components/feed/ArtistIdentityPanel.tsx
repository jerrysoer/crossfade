import NarrativeBlock from "../NarrativeBlock";
import ShareButton from "../ShareButton";
import type { CrossoverArtist } from "@/lib/types";

interface ArtistIdentityPanelProps {
  artist: CrossoverArtist;
}

export default function ArtistIdentityPanel({ artist }: ArtistIdentityPanelProps) {
  return (
    <div className="feed-panel flex flex-col items-center justify-center px-4 pb-20 pt-16 bg-[var(--background)]">
      <div className="animate-fade-in">
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

      {/* Share button */}
      <div className="mt-6 animate-fade-in" style={{ animationDelay: "0.3s", opacity: 0 }}>
        <ShareButton artistName={artist.name} />
      </div>

      {/* Swipe hint */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-swipe-hint">
        <svg
          className="w-5 h-5 text-[var(--text-muted)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 15l7-7 7 7" />
        </svg>
        <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
          Swipe up
        </span>
      </div>
    </div>
  );
}
