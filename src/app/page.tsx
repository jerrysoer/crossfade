"use client";

import { useState } from "react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LoadingState from "@/components/LoadingState";
import CrossoverCard from "@/components/CrossoverCard";
import type { CrossoverArtist } from "@/lib/types";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrossoverArtist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seenNames, setSeenNames] = useState<string[]>([]);

  async function handleDiscover() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousNames: seenNames }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || "Something went wrong. Please try again."
        );
      }

      const artist: CrossoverArtist = await res.json();
      setResult(artist);
      setSeenNames((prev) => [...prev, artist.name]);

      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  // Result view
  if (result) {
    return (
      <main className="relative min-h-screen grain-overlay">
        {/* Nav bar */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => {
              setResult(null);
              setError(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-[family-name:var(--font-playfair)] text-lg text-[var(--text-primary)]
                       hover:text-[var(--accent-gold)] transition-colors"
          >
            Cross<span className="cross-slash">/</span>Fade
          </button>
          <button
            onClick={handleDiscover}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Discover another
          </button>
        </nav>

        {/* Result */}
        <div className="pt-8 pb-24">
          <CrossoverCard artist={result} onTryAnother={handleDiscover} />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="relative grain-overlay">
      <Hero onDiscover={handleDiscover} isLoading={isLoading} />

      {/* Loading state */}
      {isLoading && (
        <div className="py-16">
          <LoadingState />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="max-w-xl mx-auto px-6 py-8 text-center">
          <p className="text-[var(--accent-warm)] text-sm mb-3">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <Footer />
    </main>
  );
}
