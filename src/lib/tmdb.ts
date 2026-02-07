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
}

interface TMDBPersonSearchResponse {
  results: TMDBPerson[];
}

interface TMDBMovieCast {
  id: number;
  title: string;
  character: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
}

interface TMDBPersonMovieCredits {
  cast: TMDBMovieCast[];
}

// ── Person endpoints ──

export async function searchPerson(name: string): Promise<TMDBPerson | null> {
  const url = withKey(`${TMDB_BASE}/search/person?query=${encodeURIComponent(name)}&language=en-US&page=1`);
  const res = await fetch(url);
  if (!res.ok) return null;

  const data: TMDBPersonSearchResponse = await res.json();
  return data.results[0] ?? null;
}

export async function getPersonDetails(id: number): Promise<TMDBPerson | null> {
  const url = withKey(`${TMDB_BASE}/person/${id}?language=en-US`);
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

export async function getPersonMovieCredits(id: number): Promise<TMDBMovieCast[]> {
  const url = withKey(`${TMDB_BASE}/person/${id}/movie_credits?language=en-US`);
  const res = await fetch(url);
  if (!res.ok) return [];

  const data: TMDBPersonMovieCredits = await res.json();
  const isSelf = (c: string) => /^(self|himself|herself|themselves)\b/i.test(c.trim());
  const actingRoles = data.cast.filter((c) => c.release_date && c.character && !isSelf(c.character));
  // Prefer actual acting roles, fall back to "Self" credits if too few
  const pool = actingRoles.length >= 3
    ? actingRoles
    : data.cast.filter((c) => c.release_date && c.character);
  // Sort by weighted score: rating matters, but heavily penalize films with very few votes
  return pool.sort((a, b) => {
    const scoreA = a.vote_average * Math.min(a.vote_count / 50, 1);
    const scoreB = b.vote_average * Math.min(b.vote_count / 50, 1);
    return scoreB - scoreA;
  });
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
