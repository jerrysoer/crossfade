"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useFeedPrefetch } from "@/hooks/useFeedPrefetch";
import FeedCard from "./FeedCard";
import FeedOverlay from "./FeedOverlay";
import FeedLoadingSkeleton from "./FeedLoadingSkeleton";
import type { CrossoverArtist } from "@/lib/types";

export default function SwipeFeed() {
  const {
    entries,
    isLoadingNext,
    error,
    fetchNext,
    insertSearchResult,
    clearError,
  } = useFeedPrefetch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Track current card via scroll position
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cardHeight = el.clientHeight;
    if (cardHeight === 0) return;
    const index = Math.round(el.scrollTop / cardHeight);
    setCurrentIndex(index);
  }, []);

  // Pre-fetch when approaching the end of the feed
  useEffect(() => {
    if (entries.length === 0) return;
    if (currentIndex >= entries.length - 2) {
      fetchNext();
    }
  }, [currentIndex, entries.length, fetchNext]);

  // Handle search: fetch the artist, insert into feed, scroll to it
  const handleSearch = useCallback(
    async (name: string) => {
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchName: name }),
        });
        if (!res.ok) return;

        const contentType = res.headers.get("content-type") || "";
        let artist: CrossoverArtist;

        if (contentType.includes("text/x-ndjson") && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let result: CrossoverArtist | null = null;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const chunk = JSON.parse(line);
                if (chunk.phase === "complete") {
                  const { phase: _, ...rest } = chunk;
                  result = rest as CrossoverArtist;
                } else if (chunk.phase === "header" && !result) {
                  result = {
                    name: chunk.name,
                    slug: chunk.slug,
                    photoUrl: chunk.photoUrl,
                    narrative: chunk.narrative,
                    didYouKnow: chunk.didYouKnow,
                    crossoverDirection: chunk.crossoverDirection,
                    filmCredits: [],
                    musicCredits: [],
                    birthday: chunk.birthday,
                    birthplace: chunk.birthplace,
                    deathday: chunk.deathday,
                    filmClipId: null,
                    musicClipId: null,
                  };
                }
              } catch {
                // skip
              }
            }
          }
          if (!result) return;
          artist = result;
        } else {
          artist = await res.json();
        }

        const newIndex = insertSearchResult(artist);

        // Scroll to the new card
        requestAnimationFrame(() => {
          const el = containerRef.current;
          if (el) {
            el.scrollTo({
              top: newIndex * el.clientHeight,
              behavior: "smooth",
            });
          }
        });
      } catch {
        // Search failed silently
      }
    },
    [insertSearchResult]
  );

  // Virtualization: only render cards near the current index
  const renderCard = (index: number) => {
    const isNearby = Math.abs(index - currentIndex) <= 1;
    const entry = entries[index];

    if (!isNearby) {
      return <div key={entry.artist.slug} className="feed-card" />;
    }

    return (
      <FeedCard
        key={entry.artist.slug}
        artist={entry.artist}
        isStreaming={entry.isStreaming}
        isActive={index === currentIndex}
      />
    );
  };

  return (
    <div className="relative">
      <FeedOverlay onSearch={handleSearch} />

      <div ref={containerRef} className="feed-container" onScroll={handleScroll}>
        {entries.map((_, index) => renderCard(index))}

        {/* Loading skeleton while fetching next */}
        {isLoadingNext && <FeedLoadingSkeleton />}

        {/* Error display */}
        {error && (
          <div className="feed-card flex flex-col items-center justify-center px-6">
            <p className="text-[var(--accent-red)] text-sm mb-3">{error}</p>
            <button
              onClick={() => {
                clearError();
                fetchNext();
              }}
              className="px-5 py-2 rounded-full bg-[var(--accent-red)] text-white text-sm font-medium
                         hover:bg-[#BF2B29] active:scale-[0.98] transition-all duration-200"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
