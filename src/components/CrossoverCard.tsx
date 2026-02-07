import type { CrossoverArtist } from "@/lib/types";
import FilmCreditsList from "./FilmCreditsList";
import MusicCreditsList from "./MusicCreditsList";
import NarrativeBlock from "./NarrativeBlock";
import ShareButton from "./ShareButton";

interface CrossoverCardProps {
  artist: CrossoverArtist;
  onTryAnother: () => void;
}

export default function CrossoverCard({
  artist,
  onTryAnother,
}: CrossoverCardProps) {
  return (
    <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6">
      {/* Background glow behind the card */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[60%] rounded-full pointer-events-none opacity-[0.03]"
        style={{
          background:
            "radial-gradient(ellipse, var(--accent-gold) 0%, var(--accent-warm) 40%, transparent 70%)",
        }}
      />

      {/* Main card */}
      <div
        className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-10 lg:p-12
                   grain-overlay overflow-hidden
                   animate-fade-in-scale opacity-0"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Three-column layout */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-6">
          {/* Film credits — left */}
          <div
            className="flex-1 flex justify-center lg:justify-end w-full lg:w-auto
                       opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <FilmCreditsList credits={artist.filmCredits} />
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
            />
          </div>

          {/* Music credits — right */}
          <div
            className="flex-1 flex justify-center lg:justify-start w-full lg:w-auto
                       opacity-0 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <MusicCreditsList credits={artist.musicCredits} />
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
            className="px-7 py-2.5 rounded-full bg-[var(--accent-gold)] text-[var(--background)]
                       text-sm font-medium
                       hover:bg-[#E8B85E] hover:shadow-[0_0_24px_rgba(212,168,83,0.15)]
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
