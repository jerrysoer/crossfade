import { getCached, setCache, TTL } from "./cache";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function apiKey(): string {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  return key;
}

function withKey(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}api_key=${apiKey()}`;
}

// ── Types ──

interface TMDBPerson {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
  known_for_department: string;
  birthday: string | null;
  place_of_birth: string | null;
  deathday: string | null;
}

interface TMDBPersonSearchResponse {
  results: TMDBPerson[];
}

export interface TMDBCombinedCast {
  id: number;
  title?: string; // movies
  name?: string; // TV shows
  character: string;
  release_date?: string; // movies
  first_air_date?: string; // TV shows
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  media_type: "movie" | "tv";
}

interface TMDBCombinedCredits {
  cast: TMDBCombinedCast[];
}

// ── Person endpoints ──

export async function searchPerson(
  names: string | string[]
): Promise<TMDBPerson | null> {
  const nameList = Array.isArray(names) ? names : [names];

  for (const name of nameList) {
    const cacheKey = `tmdb:search:${name.toLowerCase()}`;
    const cached = await getCached<TMDBPerson>(cacheKey);
    if (cached) return cached;

    const url = withKey(
      `${TMDB_BASE}/search/person?query=${encodeURIComponent(name)}&language=en-US&page=1`
    );
    const res = await fetch(url);
    if (!res.ok) continue;

    const data: TMDBPersonSearchResponse = await res.json();
    if (data.results.length > 0) {
      await setCache(cacheKey, data.results[0], TTL.TMDB);
      return data.results[0];
    }
  }
  return null;
}

export async function getPersonDetails(id: number): Promise<TMDBPerson | null> {
  const cacheKey = `tmdb:person:${id}`;
  const cached = await getCached<TMDBPerson>(cacheKey);
  if (cached) return cached;

  const url = withKey(`${TMDB_BASE}/person/${id}?language=en-US`);
  const res = await fetch(url);
  if (!res.ok) return null;

  const data: TMDBPerson = await res.json();
  await setCache(cacheKey, data, TTL.TMDB);
  return data;
}

export async function getPersonCombinedCredits(
  id: number
): Promise<TMDBCombinedCast[]> {
  const cacheKey = `tmdb:credits:${id}`;
  const cached = await getCached<TMDBCombinedCast[]>(cacheKey);
  if (cached) return cached;

  const url = withKey(
    `${TMDB_BASE}/person/${id}/combined_credits?language=en-US`
  );
  const res = await fetch(url);
  if (!res.ok) return [];

  const data: TMDBCombinedCredits = await res.json();
  const isSelf = (c: string) =>
    /^(self|himself|herself|themselves)\b/i.test(c.trim());

  const actingRoles = data.cast.filter((c) => {
    const hasDate = c.release_date || c.first_air_date;
    return hasDate && c.character && !isSelf(c.character);
  });

  // Prefer actual acting roles, fall back to "Self" credits if too few
  const pool =
    actingRoles.length >= 3
      ? actingRoles
      : data.cast.filter(
          (c) => (c.release_date || c.first_air_date) && c.character
        );

  // Sort by weighted score: rating * min(vote_count/50, 1)
  const sorted = pool.sort((a, b) => {
    const scoreA = a.vote_average * Math.min(a.vote_count / 50, 1);
    const scoreB = b.vote_average * Math.min(b.vote_count / 50, 1);
    return scoreB - scoreA;
  });

  await setCache(cacheKey, sorted, TTL.TMDB);
  return sorted;
}

// ── URL builders ──

export function posterUrl(
  path: string | null,
  size: "w342" | "w500" | "w780" | "original" = "w500"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function profilePhotoUrl(
  path: string | null,
  size: "w185" | "w342" | "h632" | "original" = "w342"
): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function tmdbPersonUrl(id: number): string {
  return `https://www.themoviedb.org/person/${id}`;
}

export function tmdbMovieUrl(id: number): string {
  return `https://www.themoviedb.org/movie/${id}`;
}

export function tmdbTvUrl(id: number): string {
  return `https://www.themoviedb.org/tv/${id}`;
}
