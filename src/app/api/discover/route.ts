import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { getCached, setCache, lpop, rpush, TTL } from "@/lib/cache";
import { discoverInputSchema } from "@/lib/schemas";
import { callClaudeJSON } from "@/lib/ai";
import {
  SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
  buildDiscoverPrompt,
} from "@/lib/prompts";
import {
  searchPerson,
  getPersonDetails,
  getPersonCombinedCredits,
  profilePhotoUrl,
  posterUrl,
  tmdbMovieUrl,
  tmdbTvUrl,
} from "@/lib/tmdb";
import {
  searchArtist,
  getArtist,
  getArtistReleases,
  artistImageUrl,
  discogsArtistUrl,
  type DiscogsArtist,
} from "@/lib/discogs";
import { findFilmClip, findMusicClip } from "@/lib/youtube";
import type {
  ClaudeCrossoverResponse,
  CrossoverArtist,
  FilmCredit,
  MusicCredit,
} from "@/lib/types";

const QUEUE_KEY = "cf:queue:random";

function collectSearchNames(claude: ClaudeCrossoverResponse): string[] {
  const names = new Set<string>();
  names.add(claude.name);
  names.add(claude.tmdbSearchQuery);
  names.add(claude.discogsSearchQuery);
  if (claude.alternateNames) {
    claude.alternateNames.forEach((n) => names.add(n));
  }
  return Array.from(names);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = discoverInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { previousNames, searchName } = parsed.data;
    const seenSet = new Set((previousNames ?? []).map((n: string) => n.toLowerCase()));

    // 0a. Check cache for named searches (instant repeat lookups)
    if (searchName) {
      const resultKey = `cf:result:${searchName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const cached = await getCached<CrossoverArtist>(resultKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // 0b. For random discovery, try pre-computed queue first
    if (!searchName) {
      const MAX_POPS = 10;
      const rejected: CrossoverArtist[] = [];
      for (let i = 0; i < MAX_POPS; i++) {
        const queued = await lpop<CrossoverArtist>(QUEUE_KEY);
        if (!queued) break;
        if (seenSet.has(queued.name.toLowerCase())) {
          rejected.push(queued);
          continue;
        }
        // Push rejected items back, then trigger background refill
        for (const r of rejected) await rpush(QUEUE_KEY, r);
        after(async () => {
          await refillQueue(seenSet);
        });
        return NextResponse.json(queued);
      }
      // Push all rejected items back if none matched
      for (const r of rejected) await rpush(QUEUE_KEY, r);
    }

    // --- Live computation with streaming ---
    // Steps 1-3: Claude + TMDB/Discogs validation (must complete before streaming)
    const model = searchName ? undefined : "claude-haiku-4-5-20251001";
    let claude = await callClaudeJSON<ClaudeCrossoverResponse>(
      SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
      buildDiscoverPrompt(previousNames, searchName),
      { maxTokens: 1024, temperature: searchName ? 0.3 : 0.9, model }
    );

    let allNames = collectSearchNames(claude);
    let [tmdbPerson, discogsResult] = await Promise.all([
      resolveTMDBPerson(claude, allNames),
      resolveDiscogsArtist(claude, allNames),
    ]);

    if (!tmdbPerson) {
      console.log(`Retry: "${claude.name}" not found on TMDB.`);
      claude = await callClaudeJSON<ClaudeCrossoverResponse>(
        SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
        `Your previous pick "${claude.name}" could not be found on TMDB. Pick a DIFFERENT, well-known crossover artist. Make sure you provide accurate search names and alternate names.\n\nDo NOT pick: ${[...previousNames, claude.name].join(", ")}`,
        { maxTokens: 1024, temperature: 0.9 }
      );
      allNames = collectSearchNames(claude);
      [tmdbPerson, discogsResult] = await Promise.all([
        resolveTMDBPerson(claude, allNames),
        resolveDiscogsArtist(claude, allNames),
      ]);
      if (!tmdbPerson) {
        return NextResponse.json(
          { error: "Couldn't verify this artist. Please try again." },
          { status: 500 }
        );
      }
    }

    // We now have enough for the header — stream it
    const photoUrl =
      profilePhotoUrl(tmdbPerson.profile_path) ??
      (discogsResult ? artistImageUrl(discogsResult) : null);
    const slug = claude.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const header = {
      phase: "header" as const,
      name: claude.name,
      slug,
      photoUrl,
      narrative: claude.narrative,
      didYouKnow: claude.didYouKnow,
      crossoverDirection: claude.crossoverDirection,
      birthday: tmdbPerson.birthday ?? null,
      birthplace: tmdbPerson.place_of_birth ?? null,
      deathday: tmdbPerson.deathday ?? null,
    };

    // Capture variables needed by the stream
    const capturedClaude = claude;
    const capturedAllNames = allNames;
    const capturedTmdbPerson = tmdbPerson;
    let capturedDiscogsResult = discogsResult;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send header immediately
        controller.enqueue(encoder.encode(JSON.stringify(header) + "\n"));

        try {
          // Step 4: Discogs fallback
          if (!capturedDiscogsResult && capturedTmdbPerson) {
            const fallbackNames = [capturedTmdbPerson.name, ...capturedAllNames];
            const sr = await searchArtist(fallbackNames);
            if (sr) capturedDiscogsResult = await getArtist(sr.id);
          }

          // Step 5: Credits + releases
          const [combinedCredits, initReleases] = await Promise.all([
            getPersonCombinedCredits(capturedTmdbPerson.id),
            capturedDiscogsResult
              ? getArtistReleases(capturedDiscogsResult.id, 20)
              : Promise.resolve([]),
          ]);

          let artistReleases = initReleases;
          if (capturedDiscogsResult && artistReleases.length === 0) {
            const nameVariants = capturedAllNames.flatMap((n) => {
              const parts = n.split(/\s+/);
              return parts.length >= 2 && parts[0].length >= 4 ? [parts[0]] : [];
            });
            for (const variant of nameVariants) {
              const altResult = await searchArtist(variant);
              if (altResult && altResult.id !== capturedDiscogsResult!.id) {
                const altReleases = await getArtistReleases(altResult.id, 20);
                if (altReleases.length > 0) {
                  capturedDiscogsResult = await getArtist(altResult.id);
                  artistReleases = altReleases;
                  break;
                }
              }
            }
          }

          // Step 5c: YouTube
          const topFilmTitle = combinedCredits[0]?.title || combinedCredits[0]?.name;
          const topMusicTitle = artistReleases[0]?.title;
          const [filmClipId, musicClipId] = await Promise.all([
            findFilmClip(capturedClaude.name, topFilmTitle),
            findMusicClip(capturedClaude.discogsSearchQuery || capturedClaude.name, topMusicTitle),
          ]);

          // Step 6: Map credits
          const filmCredits: FilmCredit[] = combinedCredits.slice(0, 5).map((c) => ({
            title: c.title || c.name || "Unknown",
            year: parseInt((c.release_date || c.first_air_date || "0").split("-")[0]),
            character: c.character,
            posterUrl: posterUrl(c.poster_path, "w342"),
            tmdbId: c.id,
            tmdbUrl: c.media_type === "tv" ? tmdbTvUrl(c.id) : tmdbMovieUrl(c.id),
            rating: Math.round(c.vote_average * 10) / 10,
            mediaType: c.media_type,
          }));

          const musicCredits: MusicCredit[] = artistReleases.slice(0, 5).map((r) => ({
            title: r.title,
            artist: r.artist || capturedClaude.name,
            year: r.year ?? 0,
            coverUrl: r.thumb && !r.thumb.includes("spacer.gif") ? r.thumb : null,
            discogsId: r.id,
            discogsUrl: capturedDiscogsResult ? discogsArtistUrl(capturedDiscogsResult.id) : "",
            genres: [],
            label: r.label || "",
          }));

          // Step 8b: Match trivia
          if (capturedClaude.creditTrivia) {
            const triviaEntries = capturedClaude.creditTrivia.map((t) => ({
              key: t.title.toLowerCase().replace(/[^a-z0-9\s]/g, ""),
              fact: t.fact,
              used: false,
            }));
            const allCredits = [...filmCredits, ...musicCredits];
            for (const credit of allCredits) {
              const cKey = credit.title.toLowerCase().replace(/[^a-z0-9\s]/g, "");
              let match = triviaEntries.find((t) => !t.used && t.key === cKey);
              if (!match) match = triviaEntries.find((t) => !t.used && (cKey.includes(t.key) || t.key.includes(cKey)));
              if (!match) {
                const cWords = new Set(cKey.split(/\s+/).filter((w) => w.length > 2));
                match = triviaEntries.find((t) => {
                  if (t.used) return false;
                  const tWords = t.key.split(/\s+/).filter((w) => w.length > 2);
                  const overlap = tWords.filter((w) => cWords.has(w)).length;
                  return overlap >= 2 || (tWords.length === 1 && cWords.has(tWords[0]));
                });
              }
              if (match) { credit.trivia = match.fact; match.used = true; }
            }
          }

          const artist: CrossoverArtist = {
            name: capturedClaude.name, slug, photoUrl,
            narrative: capturedClaude.narrative,
            didYouKnow: capturedClaude.didYouKnow,
            crossoverDirection: capturedClaude.crossoverDirection,
            filmCredits, musicCredits,
            birthday: capturedTmdbPerson.birthday ?? null,
            birthplace: capturedTmdbPerson.place_of_birth ?? null,
            deathday: capturedTmdbPerson.deathday ?? null,
            filmClipId, musicClipId,
          };

          // Cache + send complete
          if (searchName) {
            const resultKey = `cf:result:${searchName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
            await setCache(resultKey, artist, TTL.DISCOVER);
          }

          controller.enqueue(encoder.encode(JSON.stringify({ phase: "complete", ...artist }) + "\n"));
        } catch (err) {
          console.error("Stream error:", err);
          controller.enqueue(encoder.encode(JSON.stringify({ phase: "error", error: "Failed to load credits" }) + "\n"));
        }

        controller.close();
      },
    });

    // For random discovery, refill the queue in the background
    if (!searchName) {
      after(async () => {
        await refillQueue(seenSet);
      });
    }

    return new Response(stream, {
      headers: { "Content-Type": "text/x-ndjson", "Transfer-Encoding": "chunked" },
    });
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Failed to discover crossover artist. Please try again." },
      { status: 500 }
    );
  }
}

async function resolveTMDBPerson(
  claude: ClaudeCrossoverResponse,
  allNames: string[]
) {
  if (claude.tmdbId) {
    const person = await getPersonDetails(claude.tmdbId);
    if (person) return person;
  }
  const searchResult = await searchPerson(allNames);
  if (!searchResult) return null;
  // Fetch full person details (birthday, birthplace, etc.)
  return (await getPersonDetails(searchResult.id)) ?? searchResult;
}

async function resolveDiscogsArtist(
  claude: ClaudeCrossoverResponse,
  allNames: string[]
): Promise<DiscogsArtist | null> {
  if (claude.discogsId) {
    const artist = await getArtist(claude.discogsId);
    if (artist) return artist;
  }
  const searchResult = await searchArtist(allNames);
  if (!searchResult) return null;
  return getArtist(searchResult.id);
}

// Background queue refill — generates a random result and pushes to queue
async function refillQueue(exclude: Set<string>): Promise<void> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousNames: Array.from(exclude),
      }),
    });

    if (res.ok) {
      const artist = await res.json();
      if (artist?.name) {
        await rpush(QUEUE_KEY, artist);
        console.log(`Queue refill: added "${artist.name}"`);
      }
    }
  } catch (err) {
    console.error("Queue refill error:", err);
  }
}
