import { NextRequest, NextResponse } from "next/server";
import { discoverInputSchema } from "@/lib/schemas";
import { callClaudeJSON } from "@/lib/ai";
import {
  SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
  buildDiscoverPrompt,
} from "@/lib/prompts";
import {
  searchPerson,
  getPersonDetails,
  getPersonMovieCredits,
  profilePhotoUrl,
  posterUrl,
  tmdbMovieUrl,
} from "@/lib/tmdb";
import {
  searchArtist,
  getArtist,
  getArtistReleases,
  artistImageUrl,
  discogsArtistUrl,
  type DiscogsArtist,
} from "@/lib/discogs";
import type {
  ClaudeCrossoverResponse,
  CrossoverArtist,
  FilmCredit,
  MusicCredit,
} from "@/lib/types";

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

    const { previousNames } = parsed.data;

    // 1. Ask Claude for a crossover artist
    let claude = await callClaudeJSON<ClaudeCrossoverResponse>(
      SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
      buildDiscoverPrompt(previousNames),
      { maxTokens: 1024, temperature: 0.9 }
    );

    // 2. Validate against TMDB + Discogs in parallel
    let [tmdbPerson, discogsResult] = await Promise.all([
      resolveTMDBPerson(claude),
      resolveDiscogsArtist(claude),
    ]);

    // 3. Retry once if TMDB fails (required), Discogs is best-effort
    if (!tmdbPerson) {
      const failedOn = !discogsResult ? "TMDB and Discogs" : "TMDB";

      console.log(
        `Retry: "${claude.name}" not found on ${failedOn}. Asking Claude for another pick.`
      );

      claude = await callClaudeJSON<ClaudeCrossoverResponse>(
        SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
        `Your previous pick "${claude.name}" could not be found on ${failedOn}. Pick a DIFFERENT crossover artist. Make sure they are well-known enough to appear on both TMDB and Discogs.\n\nDo NOT pick: ${[...previousNames, claude.name].join(", ")}`,
        { maxTokens: 1024, temperature: 0.9 }
      );

      [tmdbPerson, discogsResult] = await Promise.all([
        resolveTMDBPerson(claude),
        resolveDiscogsArtist(claude),
      ]);

      if (!tmdbPerson) {
        return NextResponse.json(
          { error: "Couldn't verify this artist. Please try again." },
          { status: 500 }
        );
      }
    }

    // 4. Fetch credits in parallel
    const [movieCredits, artistReleases] = await Promise.all([
      getPersonMovieCredits(tmdbPerson.id),
      discogsResult ? getArtistReleases(discogsResult.id, 10) : Promise.resolve([]),
    ]);

    // 5. Map to our types
    const filmCredits: FilmCredit[] = movieCredits.slice(0, 5).map((c) => ({
      title: c.title,
      year: parseInt(c.release_date?.split("-")[0] ?? "0"),
      character: c.character,
      posterUrl: posterUrl(c.poster_path, "w342"),
      tmdbId: c.id,
      tmdbUrl: tmdbMovieUrl(c.id),
      rating: Math.round(c.vote_average * 10) / 10,
    }));

    const musicCredits: MusicCredit[] = artistReleases.slice(0, 5).map((r) => ({
      title: r.title,
      artist: r.artist || claude.name,
      year: r.year ?? 0,
      coverUrl: r.thumb && !r.thumb.includes("spacer.gif") ? r.thumb : null,
      discogsId: r.id,
      discogsUrl: discogsResult ? discogsArtistUrl(discogsResult.id) : "",
      genres: [],
      label: r.label || "",
    }));

    // 6. Build photo URL — prefer TMDB (higher quality)
    const photoUrl =
      profilePhotoUrl(tmdbPerson.profile_path) ??
      (discogsResult ? artistImageUrl(discogsResult) : null);

    const slug = claude.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const artist: CrossoverArtist = {
      name: claude.name,
      slug,
      photoUrl,
      narrative: claude.narrative,
      didYouKnow: claude.didYouKnow,
      crossoverDirection: claude.crossoverDirection,
      filmCredits,
      musicCredits,
    };

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Discover error:", error);
    return NextResponse.json(
      { error: "Failed to discover crossover artist. Please try again." },
      { status: 500 }
    );
  }
}

async function resolveTMDBPerson(claude: ClaudeCrossoverResponse) {
  if (claude.tmdbId) {
    const person = await getPersonDetails(claude.tmdbId);
    if (person) return person;
  }
  return searchPerson(claude.tmdbSearchQuery);
}

async function resolveDiscogsArtist(
  claude: ClaudeCrossoverResponse
): Promise<DiscogsArtist | null> {
  if (claude.discogsId) {
    const artist = await getArtist(claude.discogsId);
    if (artist) return artist;
  }
  const searchResult = await searchArtist(claude.discogsSearchQuery);
  if (!searchResult) return null;
  return getArtist(searchResult.id);
}
