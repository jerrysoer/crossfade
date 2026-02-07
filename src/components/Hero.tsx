"use client";

interface HeroProps {
  onDiscover: () => void;
  isLoading?: boolean;
}

export default function Hero({ onDiscover, isLoading }: HeroProps) {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Projector glow — warm light spilling from above */}
      <div className="projector-glow -top-40 left-1/2 -translate-x-1/2" />
      <div
        className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none opacity-[0.04]"
        style={{
          background:
            "radial-gradient(circle, var(--accent-warm) 0%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Eyebrow */}
        <p
          className="text-xs font-medium tracking-[0.3em] uppercase text-[var(--text-muted)] mb-6
                     animate-fade-in opacity-0"
          style={{ animationDelay: "0.1s" }}
        >
          Stage <span className="text-[var(--accent-gold)] mx-1">&times;</span>{" "}
          Screen
        </p>

        {/* Logo / Title */}
        <h1
          className="font-[family-name:var(--font-playfair)] text-6xl sm:text-7xl md:text-8xl font-bold
                     tracking-tight leading-[0.9] mb-4
                     opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="text-[var(--text-primary)]">Cross</span>
          <span className="cross-slash text-5xl sm:text-6xl md:text-7xl mx-1">
            /
          </span>
          <span className="text-gradient-gold">Fade</span>
        </h1>

        {/* Subline */}
        <p
          className="font-[family-name:var(--font-playfair)] italic text-lg sm:text-xl text-[var(--text-secondary)]
                     mb-12 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          Where the stage meets the screen
        </p>

        {/* Surprise Me button */}
        <div
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.6s" }}
        >
          <button
            onClick={onDiscover}
            disabled={isLoading}
            className="px-10 py-4 rounded-full bg-[var(--accent-gold)] text-[var(--background)]
                       text-lg font-medium tracking-wide
                       hover:bg-[#E8B85E] hover:shadow-[0_0_32px_rgba(212,168,83,0.2)]
                       active:scale-[0.98]
                       transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Discovering..." : "Surprise Me"}
          </button>
          <p className="text-xs text-[var(--text-muted)] mt-4 max-w-xs mx-auto leading-relaxed">
            Discover a musician who acts — or an actor who sings
          </p>
        </div>
      </div>

      {/* Bottom fade to surface */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
    </section>
  );
}
