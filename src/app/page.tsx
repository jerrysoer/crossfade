"use client";

import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LoadingState from "@/components/LoadingState";
import CrossoverCard from "@/components/CrossoverCard";
import ThemeToggle from "@/components/ThemeToggle";
import type { CrossoverArtist } from "@/lib/types";

function updateOgMeta(artist: CrossoverArtist | null) {
  if (typeof document === "undefined") return;

  const ogImage = document.querySelector('meta[property="og:image"]');
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const twitterImage = document.querySelector('meta[name="twitter:image"]');

  if (artist) {
    const ogUrl = `/api/og?name=${encodeURIComponent(artist.name)}&direction=${artist.crossoverDirection}&narrative=${encodeURIComponent(artist.narrative.slice(0, 100))}${artist.photoUrl ? `&photo=${encodeURIComponent(artist.photoUrl)}` : ""}`;
    ogImage?.setAttribute("content", ogUrl);
    ogTitle?.setAttribute("content", `${artist.name} — Cross/Fade`);
    twitterImage?.setAttribute("content", ogUrl);
  }
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CrossoverArtist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seenNames, setSeenNames] = useState<string[]>([]);

  // Restore result from URL hash on mount
  useEffect(() => {
    if (window.location.hash) {
      try {
        const data = JSON.parse(
          decodeURIComponent(window.location.hash.slice(1))
        );
        if (data?.name && data?.filmCredits) {
          setResult(data as CrossoverArtist);
          updateOgMeta(data as CrossoverArtist);
        }
      } catch {
        // Invalid hash data, ignore
      }
    }
  }, []);

  async function handleDiscover() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    window.history.replaceState(null, "", "/");

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

      // Push result into URL hash for shareability
      const hash = encodeURIComponent(JSON.stringify(artist));
      window.history.replaceState(null, "", `#${hash}`);
      updateOgMeta(artist);

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
      <main className="relative min-h-screen">
        {/* Nav bar */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => {
              setResult(null);
              setError(null);
              window.history.replaceState(null, "", "/");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="font-[family-name:var(--font-lora)] text-lg text-[var(--text-primary)]
                       hover:text-[var(--accent-red)] transition-colors"
          >
            Cross<span className="cross-slash">/</span>Fade
          </button>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleDiscover}
              className="px-5 py-2 rounded-full bg-[var(--accent-red)] text-white
                         text-sm font-medium
                         hover:bg-[#BF2B29] active:scale-[0.98]
                         transition-all duration-200"
            >
              Discover another
            </button>
          </div>
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
    <main className="relative">
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
          <p className="text-[var(--accent-red)] text-sm mb-3">{error}</p>
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
