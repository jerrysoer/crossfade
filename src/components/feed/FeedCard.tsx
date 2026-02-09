"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { CrossoverArtist } from "@/lib/types";
import ArtistIdentityPanel from "./ArtistIdentityPanel";
import FilmCreditsPanel from "./FilmCreditsPanel";
import MusicCreditsPanel from "./MusicCreditsPanel";
import PanelDots from "./PanelDots";

interface FeedCardProps {
  artist: CrossoverArtist;
  isStreaming: boolean;
  isActive: boolean;
}

export default function FeedCard({ artist, isStreaming, isActive }: FeedCardProps) {
  const panelsRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState(1); // Start on center (identity)
  const hasScrolledRef = useRef(false);

  // Scroll to center panel on mount and when becoming active
  useEffect(() => {
    const el = panelsRef.current;
    if (!el) return;

    if (!hasScrolledRef.current || isActive) {
      // Scroll to center panel (index 1)
      el.scrollTo({ left: el.clientWidth, behavior: "instant" });
      hasScrolledRef.current = true;
      setActivePanel(1);
    }
  }, [isActive]);

  // Track which panel is in view
  const handleScroll = useCallback(() => {
    const el = panelsRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActivePanel(index);
  }, []);

  return (
    <div className="feed-card bg-[var(--background)]">
      <div
        ref={panelsRef}
        className="feed-panels"
        onScroll={handleScroll}
      >
        {/* Panel 0: Film credits (swipe right from center) */}
        <FilmCreditsPanel artist={artist} isStreaming={isStreaming} />

        {/* Panel 1: Identity (center, default) */}
        <ArtistIdentityPanel artist={artist} />

        {/* Panel 2: Music credits (swipe left from center) */}
        <MusicCreditsPanel artist={artist} isStreaming={isStreaming} />
      </div>

      <PanelDots activeIndex={activePanel} />
    </div>
  );
}
