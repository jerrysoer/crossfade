import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache, lpop, rpush, TTL } from "@/lib/cache";
import { discoverInputSchema } from "@/lib/schemas";
import { callClaudeJSON, callClaudeJSONStream } from "@/lib/ai";
import {
  SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
  SYSTEM_PROMPT_NARRATIVE_ONLY,
  buildDiscoverPrompt,
  buildNarrativePrompt,
} from "@/lib/prompts";
import {
  searchPerson,
  searchAndGetPerson,
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
  searchAndGetArtist,
  type DiscogsArtist,
} from "@/lib/discogs";
import { CROSSOVER_ARTISTS } from "@/lib/artists";
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

    const { previousNames, searchName, skipQueue } = parsed.data;
    const seenSet = new Set((previousNames ?? []).map((n: string) => n.toLowerCase()));

    // 0a. Check cache for named searches (instant repeat lookups)
    if (searchName) {
      const resultKey = `cf:result:${searchName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const cached = await getCached<CrossoverArtist>(resultKey);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // 0b. For random discovery, try pre-computed queue first (skip when called for refilling)
    if (!searchName && !skipQueue) {
      const MAX_POPS = 10;
      const rejected: CrossoverArtist[] = [];
      for (let i = 0; i < MAX_POPS; i++) {
        const queued = await lpop<CrossoverArtist>(QUEUE_KEY);
        if (!queued) break;
        if (seenSet.has(queued.name.toLowerCase())) {
          rejected.push(queued);
          continue;
        }
        // Push rejected items back
        for (const r of rejected) await rpush(QUEUE_KEY, r);
        return NextResponse.json(queued);
      }
      // Push all rejected items back if none matched
      for (const r of rejected) await rpush(QUEUE_KEY, r);
    }

    // --- Live computation with streaming ---

    // For RANDOM discovery: pick from list, run Claude + TMDB + Discogs ALL in parallel
    if (!searchName) {
      return handleRandomDiscovery(seenSet, previousNames ?? []);
    }

    // For NAMED searches: use the full prompt (Claude picks search queries)
    return handleNamedSearch(searchName, previousNames ?? []);
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Failed to discover crossover artist. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * Random discovery: pick artist from CROSSOVER_ARTISTS list, then run
 * Claude narrative + TMDB (search+details) + Discogs (search+details) ALL in parallel.
 * Merges search+details into single calls to eliminate sequential waterfall.
 */
async function handleRandomDiscovery(
  seenSet: Set<string>,
  previousNames: string[]
) {
  // Pick a random artist not already seen
  const candidates = CROSSOVER_ARTISTS.filter(
    (name) => !seenSet.has(name.toLowerCase())
  );
  const artistName =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : CROSSOVER_ARTISTS[Math.floor(Math.random() * CROSSOVER_ARTISTS.length)];

  // Check if we already have a cached result for this artist
  const resultKey = `cf:result:${artistName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const cached = await getCached<CrossoverArtist>(resultKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Run Claude (lean 1KB prompt) + TMDB (search→details) + Discogs (search→details) ALL in parallel
  // searchAndGetPerson/searchAndGetArtist merge two sequential calls into one
  const [claude, tmdbPerson, discogsArtist] = await Promise.all([
    callClaudeJSONStream<ClaudeCrossoverResponse>(
      SYSTEM_PROMPT_NARRATIVE_ONLY,
      buildNarrativePrompt(artistName),
      { maxTokens: 1024, temperature: 0.3, model: "claude-haiku-4-5-20251001" }
    ),
    searchAndGetPerson(artistName),
    searchAndGetArtist(artistName),
  ]);

  if (!tmdbPerson) {
    // Fallback: try Claude's suggested search queries
    const allNames = collectSearchNames(claude);
    const fallbackPerson = await searchAndGetPerson(allNames);
    if (!fallbackPerson) {
      return NextResponse.json(
        { error: "Couldn't verify this artist. Please try again." },
        { status: 500 }
      );
    }
    return streamArtistResponse(claude, fallbackPerson, discogsArtist, allNames, false);
  }

  const allNames = collectSearchNames(claude);
  return streamArtistResponse(claude, tmdbPerson, discogsArtist, allNames, false);
}

/**
 * Named search: use the full 38KB prompt so Claude can determine search queries.
 * Kept for user-initiated "search for X" lookups.
 */
async function handleNamedSearch(
  searchName: string,
  previousNames: string[]
) {
  let claude = await callClaudeJSON<ClaudeCrossoverResponse>(
    SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
    buildDiscoverPrompt(previousNames, searchName),
    { maxTokens: 1024, temperature: 0.3 }
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

  return streamArtistResponse(claude, tmdbPerson, discogsResult, allNames, true);
}

/**
 * Shared streaming response builder — streams header then credits.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function streamArtistResponse(
  claude: ClaudeCrossoverResponse,
  tmdbPerson: any,
  discogsResult: DiscogsArtist | null,
  allNames: string[],
  isNamedSearch: boolean
) {
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

  const capturedClaude = claude;
  const capturedAllNames = allNames;
  const capturedTmdbPerson = tmdbPerson;
  let capturedDiscogsResult = discogsResult;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(JSON.stringify(header) + "\n"));

      try {
        // Discogs fallback — search using TMDB name if we don't have Discogs yet
        if (!capturedDiscogsResult && capturedTmdbPerson) {
          capturedDiscogsResult = await searchAndGetArtist(
            [capturedTmdbPerson.name, ...capturedAllNames]
          );
        }

        // Credits + releases in parallel
        const [combinedCredits, initReleases] = await Promise.all([
          getPersonCombinedCredits(capturedTmdbPerson.id),
          capturedDiscogsResult
            ? getArtistReleases(capturedDiscogsResult.id, 20)
            : Promise.resolve([]),
        ]);

        // Parallel variant search if no releases found (was sequential before)
        let artistReleases = initReleases;
        if (capturedDiscogsResult && artistReleases.length === 0) {
          const nameVariants = capturedAllNames.flatMap((n) => {
            const parts = n.split(/\s+/);
            return parts.length >= 2 && parts[0].length >= 4 ? [parts[0]] : [];
          });
          if (nameVariants.length > 0) {
            // Fire all variant searches in parallel instead of sequential loop
            const variantResults = await Promise.all(
              nameVariants.map((v) => searchArtist(v))
            );
            for (const altResult of variantResults) {
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
        }

        // Map credits
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

        // Match trivia
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
          filmClipId: null, musicClipId: null,
        };

        // Cache the result
        const cacheKey = `cf:result:${artist.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        await setCache(cacheKey, artist, TTL.DISCOVER);

        // Push to queue so the next random discovery is instant
        if (!isNamedSearch) {
          await rpush(QUEUE_KEY, artist);
        }

        controller.enqueue(encoder.encode(JSON.stringify({ phase: "complete", ...artist }) + "\n"));
      } catch (err) {
        console.error("Stream error:", err);
        controller.enqueue(encoder.encode(JSON.stringify({ phase: "error", error: "Failed to load credits" }) + "\n"));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/x-ndjson", "Transfer-Encoding": "chunked" },
  });
}

async function resolveTMDBPerson(
  claude: ClaudeCrossoverResponse,
  allNames: string[]
) {
  if (claude.tmdbId) {
    const person = await getPersonDetails(claude.tmdbId);
    if (person) return person;
  }
  return searchAndGetPerson(allNames);
}

async function resolveDiscogsArtist(
  claude: ClaudeCrossoverResponse,
  allNames: string[]
): Promise<DiscogsArtist | null> {
  if (claude.discogsId) {
    const artist = await getArtist(claude.discogsId);
    if (artist) return artist;
  }
  return searchAndGetArtist(allNames);
}
