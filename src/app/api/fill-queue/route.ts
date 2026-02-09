import { NextRequest, NextResponse } from "next/server";
import { getCached, setCache, rpush, llen, TTL } from "@/lib/cache";
import { CROSSOVER_ARTISTS } from "@/lib/artists";
import { callClaudeJSONStream } from "@/lib/ai";
import {
  SYSTEM_PROMPT_NARRATIVE_ONLY,
  buildNarrativePrompt,
} from "@/lib/prompts";
import {
  searchAndGetPerson,
  getPersonCombinedCredits,
  profilePhotoUrl,
  posterUrl,
  tmdbMovieUrl,
  tmdbTvUrl,
} from "@/lib/tmdb";
import {
  searchAndGetArtist,
  searchArtist,
  getArtist,
  getArtistReleases,
  artistImageUrl,
  discogsArtistUrl,
} from "@/lib/discogs";
import type {
  ClaudeCrossoverResponse,
  CrossoverArtist,
  FilmCredit,
  MusicCredit,
} from "@/lib/types";

const QUEUE_KEY = "cf:queue:random";
const TARGET_QUEUE_SIZE = 100;

/**
 * Direct queue filler — processes artists without HTTP round-trips.
 * Call with POST { count: 10, secret: "..." } to fill the queue.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const secret = body.secret;
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = Math.min(body.count ?? 10, 20);
  const queueSize = await llen(QUEUE_KEY);

  if (queueSize >= TARGET_QUEUE_SIZE) {
    return NextResponse.json({
      status: "ok",
      message: "Queue already full",
      queueSize,
    });
  }

  const toFill = Math.min(count, TARGET_QUEUE_SIZE - queueSize);

  // Pick random artists and process them in parallel batches of 3
  // (limited by Discogs rate limiter + Claude concurrency)
  const BATCH_SIZE = 3;
  const added: string[] = [];
  const errors: string[] = [];

  const shuffled = [...CROSSOVER_ARTISTS].sort(() => Math.random() - 0.5);
  let artistIndex = 0;

  for (let filled = 0; filled < toFill && artistIndex < shuffled.length; ) {
    const batchNames = shuffled.slice(artistIndex, artistIndex + BATCH_SIZE);
    artistIndex += BATCH_SIZE;

    const results = await Promise.allSettled(
      batchNames.map((name) => processArtist(name))
    );

    for (let i = 0; i < results.length && filled < toFill; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        await rpush(QUEUE_KEY, result.value);
        added.push(result.value.name);
        filled++;
      } else if (result.status === "rejected") {
        errors.push(`${batchNames[i]}: ${result.reason?.message ?? "unknown"}`);
      }
    }
  }

  const finalQueueSize = await llen(QUEUE_KEY);

  return NextResponse.json({
    status: "ok",
    added,
    errors: errors.slice(0, 5),
    queueSize: finalQueueSize,
    addedCount: added.length,
  });
}

/**
 * Process a single artist: Claude narrative + TMDB + Discogs all in parallel.
 * Returns the full CrossoverArtist or null on failure.
 */
async function processArtist(artistName: string): Promise<CrossoverArtist | null> {
  // Check if already cached
  const resultKey = `cf:result:${artistName.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  const cached = await getCached<CrossoverArtist>(resultKey);
  if (cached) return cached;

  // All three in parallel
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
    console.error(`fill-queue: TMDB not found for "${artistName}"`);
    return null;
  }

  let capturedDiscogs = discogsArtist;

  // Discogs fallback
  if (!capturedDiscogs) {
    capturedDiscogs = await searchAndGetArtist([tmdbPerson.name, artistName]);
  }

  // Credits + releases in parallel
  const [combinedCredits, initReleases] = await Promise.all([
    getPersonCombinedCredits(tmdbPerson.id),
    capturedDiscogs
      ? getArtistReleases(capturedDiscogs.id, 20)
      : Promise.resolve([]),
  ]);

  // Variant search for releases if needed
  let artistReleases = initReleases;
  if (capturedDiscogs && artistReleases.length === 0) {
    const allNames = [artistName, claude.name, claude.tmdbSearchQuery, claude.discogsSearchQuery];
    const nameVariants = allNames.flatMap((n) => {
      const parts = n.split(/\s+/);
      return parts.length >= 2 && parts[0].length >= 4 ? [parts[0]] : [];
    });
    if (nameVariants.length > 0) {
      const variantResults = await Promise.all(
        nameVariants.map((v) => searchArtist(v))
      );
      for (const altResult of variantResults) {
        if (altResult && altResult.id !== capturedDiscogs.id) {
          const altReleases = await getArtistReleases(altResult.id, 20);
          if (altReleases.length > 0) {
            capturedDiscogs = await getArtist(altResult.id);
            artistReleases = altReleases;
            break;
          }
        }
      }
    }
  }

  const photoUrl =
    profilePhotoUrl(tmdbPerson.profile_path) ??
    (capturedDiscogs ? artistImageUrl(capturedDiscogs) : null);
  const slug = claude.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

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
    artist: r.artist || claude.name,
    year: r.year ?? 0,
    coverUrl: r.thumb && !r.thumb.includes("spacer.gif") ? r.thumb : null,
    discogsId: r.id,
    discogsUrl: capturedDiscogs ? discogsArtistUrl(capturedDiscogs.id) : "",
    genres: [],
    label: r.label || "",
  }));

  // Match trivia
  if (claude.creditTrivia) {
    const triviaEntries = claude.creditTrivia.map((t) => ({
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
    name: claude.name,
    slug,
    photoUrl,
    narrative: claude.narrative,
    didYouKnow: claude.didYouKnow,
    crossoverDirection: claude.crossoverDirection,
    filmCredits,
    musicCredits,
    birthday: tmdbPerson.birthday ?? null,
    birthplace: tmdbPerson.place_of_birth ?? null,
    deathday: tmdbPerson.deathday ?? null,
    filmClipId: null,
    musicClipId: null,
  };

  // Cache the result for 7 days
  await setCache(resultKey, artist, TTL.DISCOVER);

  return artist;
}
