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
import type {
  ClaudeCrossoverResponse,
  CrossoverArtist,
  FilmCredit,
  MusicCredit,
} from "@/lib/types";

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

    const { previousNames } = parsed.data;

    // 1. Ask Claude for a crossover artist
    let claude = await callClaudeJSON<ClaudeCrossoverResponse>(
      SYSTEM_PROMPT_CROSSOVER_DISCOVERY,
      buildDiscoverPrompt(previousNames),
      { maxTokens: 1024, temperature: 0.9 }
    );

    // 2. Validate against TMDB + Discogs in parallel (using all known names)
    let allNames = collectSearchNames(claude);
    let [tmdbPerson, discogsResult] = await Promise.all([
      resolveTMDBPerson(claude, allNames),
      resolveDiscogsArtist(claude, allNames),
    ]);

    // 3. If TMDB fails, ask Claude for a different artist
    if (!tmdbPerson) {
      console.log(
        `Retry: "${claude.name}" not found on TMDB. Asking Claude for another pick.`
      );

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

    // 4. If Discogs still failed, try with TMDB person's canonical name
    if (!discogsResult && tmdbPerson) {
      console.log(
        `Discogs miss, trying TMDB canonical name: "${tmdbPerson.name}"`
      );
      const fallbackNames = [tmdbPerson.name, ...allNames];
      const searchResult = await searchArtist(fallbackNames);
      if (searchResult) {
        discogsResult = await getArtist(searchResult.id);
      }
    }

    // 5. Fetch credits in parallel
    let [combinedCredits, artistReleases] = await Promise.all([
      getPersonCombinedCredits(tmdbPerson.id),
      discogsResult
        ? getArtistReleases(discogsResult.id, 20)
        : Promise.resolve([]),
    ]);

    // 5b. If Discogs artist found but has 0 releases, try name variants
    if (discogsResult && artistReleases.length === 0) {
      console.log(
        `Discogs artist "${discogsResult.name}" has 0 releases, trying name variants...`
      );
      const nameVariants = allNames.flatMap((n) => {
        const parts = n.split(/\s+/);
        return parts.length >= 2 && parts[0].length >= 4 ? [parts[0]] : [];
      });
      for (const variant of nameVariants) {
        const altResult = await searchArtist(variant);
        if (altResult && altResult.id !== discogsResult.id) {
          const altReleases = await getArtistReleases(altResult.id, 20);
          if (altReleases.length > 0) {
            discogsResult = await getArtist(altResult.id);
            artistReleases = altReleases;
            break;
          }
        }
      }
    }

    // 6. Map to our types
    const filmCredits: FilmCredit[] = combinedCredits.slice(0, 5).map((c) => ({
      title: c.title || c.name || "Unknown",
      year: parseInt(
        (c.release_date || c.first_air_date || "0").split("-")[0]
      ),
      character: c.character,
      posterUrl: posterUrl(c.poster_path, "w342"),
      tmdbId: c.id,
      tmdbUrl:
        c.media_type === "tv" ? tmdbTvUrl(c.id) : tmdbMovieUrl(c.id),
      rating: Math.round(c.vote_average * 10) / 10,
      mediaType: c.media_type,
    }));

    const musicCredits: MusicCredit[] = artistReleases
      .slice(0, 5)
      .map((r) => ({
        title: r.title,
        artist: r.artist || claude.name,
        year: r.year ?? 0,
        coverUrl:
          r.thumb && !r.thumb.includes("spacer.gif") ? r.thumb : null,
        discogsId: r.id,
        discogsUrl: discogsResult ? discogsArtistUrl(discogsResult.id) : "",
        genres: [],
        label: r.label || "",
      }));

    // 7. Minimum credit check
    if (filmCredits.length === 0 && musicCredits.length === 0) {
      return NextResponse.json(
        {
          error:
            "Couldn't find enough credits for this artist. Please try again.",
        },
        { status: 500 }
      );
    }

    // 8. Build photo URL — prefer TMDB (higher quality)
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

async function resolveTMDBPerson(
  claude: ClaudeCrossoverResponse,
  allNames: string[]
) {
  if (claude.tmdbId) {
    const person = await getPersonDetails(claude.tmdbId);
    if (person) return person;
  }
  return searchPerson(allNames);
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
