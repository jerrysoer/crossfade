"use client";

import ThemeToggle from "./ThemeToggle";

interface HeroProps {
  onDiscover: () => void;
  isLoading?: boolean;
}

export default function Hero({ onDiscover, isLoading }: HeroProps) {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6">
      {/* Theme toggle — top right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>
      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        {/* Eyebrow */}
        <p
          className="text-xs font-medium tracking-[0.3em] uppercase text-[var(--accent-red)] mb-6
                     animate-fade-in opacity-0"
          style={{ animationDelay: "0.1s" }}
        >
          Stage &times; Screen
        </p>

        {/* Logo / Title */}
        <h1
          className="font-[family-name:var(--font-lora)] text-6xl sm:text-7xl md:text-8xl font-bold
                     tracking-tight leading-[0.9] mb-4
                     opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.15s" }}
        >
          <span className="text-[var(--text-primary)]">Cross</span>
          <span className="cross-slash text-5xl sm:text-6xl md:text-7xl mx-1">
            /
          </span>
          <span className="text-[var(--text-primary)]">Fade</span>
        </h1>

        {/* Thin editorial rule */}
        <div
          className="w-16 h-px bg-[var(--border-dark)] mx-auto mb-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "0.25s" }}
        />

        {/* Subline */}
        <p
          className="font-[family-name:var(--font-lora)] italic text-lg sm:text-xl text-[var(--text-secondary)]
                     mb-12 opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        >
          Where the stage meets the screen
        </p>

        {/* Surprise Me button */}
        <div
          className="opacity-0 animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        >
          <button
            onClick={onDiscover}
            disabled={isLoading}
            className="px-10 py-4 rounded-full bg-[var(--accent-red)] text-white
                       text-lg font-medium tracking-wide
                       hover:bg-[#BF2B29] hover:shadow-[0_4px_20px_rgba(214,50,48,0.2)]
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
    </section>
  );
}
