"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { CrossoverArtist } from "@/lib/types";

export interface FeedEntry {
  artist: CrossoverArtist;
  isStreaming: boolean;
}

interface UseFeedReturn {
  entries: FeedEntry[];
  isLoadingNext: boolean;
  isLoadingPrev: boolean;
  prependCount: number;
  error: string | null;
  fetchNext: () => Promise<void>;
  fetchPrev: () => Promise<void>;
  insertSearchResult: (artist: CrossoverArtist) => number;
  clearError: () => void;
}

function getSeenNames(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("cf:seen") || "[]");
  } catch {
    return [];
  }
}

function addSeenName(name: string) {
  try {
    const seen = getSeenNames();
    seen.push(name);
    localStorage.setItem("cf:seen", JSON.stringify(seen));
  } catch {
    // localStorage unavailable
  }
}

/** Fetch a single artist from /api/discover. Returns the full artist (waits for complete phase if NDJSON). */
async function fetchArtist(searchName?: string): Promise<CrossoverArtist | null> {
  const seenNames = getSeenNames();
  const res = await fetch("/api/discover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      previousNames: seenNames,
      ...(searchName && { searchName }),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Something went wrong.");
  }

  const contentType = res.headers.get("content-type") || "";

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
    return result;
  } else {
    return await res.json();
  }
}

export function useFeedPrefetch(): UseFeedReturn {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isLoadingPrev, setIsLoadingPrev] = useState(false);
  const [prependCount, setPrependCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fetchingNextRef = useRef(false);
  const fetchingPrevRef = useRef(false);

  // Append a new artist to the end of the feed
  const fetchNext = useCallback(async () => {
    if (fetchingNextRef.current) return;
    fetchingNextRef.current = true;
    setIsLoadingNext(true);
    setError(null);

    try {
      const seenNames = getSeenNames();
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousNames: seenNames }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong.");
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/x-ndjson") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

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
              if (chunk.phase === "header") {
                const partial: CrossoverArtist = {
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
                addSeenName(chunk.name);
                setEntries((prev) => [...prev, { artist: partial, isStreaming: true }]);
                setIsLoadingNext(false);
              } else if (chunk.phase === "complete") {
                const { phase: _, ...artist } = chunk;
                setEntries((prev) => {
                  const updated = [...prev];
                  const idx = updated.findIndex(
                    (e) => e.artist.slug === (artist as CrossoverArtist).slug
                  );
                  if (idx >= 0) {
                    updated[idx] = { artist: artist as CrossoverArtist, isStreaming: false };
                  }
                  return updated;
                });
              } else if (chunk.phase === "error") {
                setError(chunk.error || "Failed to load credits.");
              }
            } catch {
              // Malformed line, skip
            }
          }
        }
      } else {
        const artist: CrossoverArtist = await res.json();
        addSeenName(artist.name);
        setEntries((prev) => [...prev, { artist, isStreaming: false }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoadingNext(false);
      fetchingNextRef.current = false;
    }
  }, []);

  // Prepend a new artist to the beginning of the feed
  const fetchPrev = useCallback(async () => {
    if (fetchingPrevRef.current) return;
    fetchingPrevRef.current = true;
    setIsLoadingPrev(true);

    try {
      const artist = await fetchArtist();
      if (artist) {
        addSeenName(artist.name);
        setEntries((prev) => [{ artist, isStreaming: false }, ...prev]);
        setPrependCount((c) => c + 1);
      }
    } catch {
      // Silent failure for prepend — the user still has current content
    } finally {
      setIsLoadingPrev(false);
      fetchingPrevRef.current = false;
    }
  }, []);

  // Fetch first artist on mount
  useEffect(() => {
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insertSearchResult = useCallback(
    (artist: CrossoverArtist): number => {
      addSeenName(artist.name);
      const newIndex = entries.length;
      setEntries((prev) => [...prev, { artist, isStreaming: false }]);
      return newIndex;
    },
    [entries.length]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    entries,
    isLoadingNext,
    isLoadingPrev,
    prependCount,
    error,
    fetchNext,
    fetchPrev,
    insertSearchResult,
    clearError,
  };
}
