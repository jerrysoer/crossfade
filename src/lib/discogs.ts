const DISCOGS_BASE = "https://api.discogs.com";

function getHeaders(): HeadersInit {
  const token = process.env.DISCOGS_TOKEN;
  if (!token) throw new Error("DISCOGS_TOKEN is not set");
  return {
    Authorization: `Discogs token=${token}`,
    "User-Agent": "CrossFade/1.0",
  };
}

// ── Token bucket rate limiter (60 req/min) ──

let tokens = 60;
let lastRefill = Date.now();
const queue: Array<() => void> = [];

function refillTokens() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  const refill = Math.floor(elapsed / 1000);
  if (refill > 0) {
    tokens = Math.min(60, tokens + refill);
    lastRefill = now;
  }
}

function acquireToken(): Promise<void> {
  refillTokens();
  if (tokens > 0) {
    tokens--;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    queue.push(resolve);
    setTimeout(() => {
      refillTokens();
      if (tokens > 0 && queue.length > 0) {
        tokens--;
        const next = queue.shift();
        next?.();
      }
    }, 1100);
  });
}

// ── In-memory cache (24h TTL) ──

const cache = new Map<string, { data: unknown; expires: number }>();
const TTL = 24 * 60 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, expires: Date.now() + TTL });
}

// ── Types ──

interface DiscogsSearchResult {
  id: number;
  title: string;
  year?: string;
  cover_image?: string;
  thumb?: string;
  label?: string[];
  genre?: string[];
  style?: string[];
  type: string;
  resource_url: string;
  uri: string;
}

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[];
}

export interface DiscogsArtist {
  id: number;
  name: string;
  profile: string;
  images?: Array<{ type: string; uri: string; uri150: string }>;
  urls?: string[];
}

interface DiscogsArtistRelease {
  id: number;
  title: string;
  year?: number;
  type: string;
  role: string;
  thumb: string;
  artist: string;
  format: string;
  label: string;
  resource_url: string;
}

interface DiscogsArtistReleasesResponse {
  releases: DiscogsArtistRelease[];
}

// ── Artist endpoints ──

export async function searchArtist(name: string): Promise<DiscogsSearchResult | null> {
  const cacheKey = `artist-search:${name}`;
  const cached = getCached<DiscogsSearchResult>(cacheKey);
  if (cached) return cached;

  await acquireToken();

  const params = new URLSearchParams({
    q: name,
    type: "artist",
    per_page: "5",
  });

  const url = `${DISCOGS_BASE}/database/search?${params}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return null;

  const data: DiscogsSearchResponse = await res.json();
  const result = data.results[0] ?? null;
  if (result) setCache(cacheKey, result);
  return result;
}

export async function getArtist(id: number): Promise<DiscogsArtist | null> {
  const cacheKey = `artist:${id}`;
  const cached = getCached<DiscogsArtist>(cacheKey);
  if (cached) return cached;

  await acquireToken();

  const url = `${DISCOGS_BASE}/artists/${id}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return null;

  const data: DiscogsArtist = await res.json();
  setCache(cacheKey, data);
  return data;
}

export async function getArtistReleases(
  id: number,
  limit: number = 10
): Promise<DiscogsArtistRelease[]> {
  const cacheKey = `artist-releases:${id}:${limit}`;
  const cached = getCached<DiscogsArtistRelease[]>(cacheKey);
  if (cached) return cached;

  await acquireToken();

  const url = `${DISCOGS_BASE}/artists/${id}/releases?sort=year&sort_order=desc&per_page=${limit}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];

  const data: DiscogsArtistReleasesResponse = await res.json();

  // Prefer main releases that are master-level (albums, not individual pressings)
  let releases = data.releases.filter(
    (r) => r.role === "Main" && r.type === "master"
  );

  // Fallback: include regular releases if too few masters
  if (releases.length < 3) {
    releases = data.releases.filter((r) => r.role === "Main");
  }

  setCache(cacheKey, releases);
  return releases;
}

// ── URL/image builders ──

export function artistImageUrl(artist: DiscogsArtist): string | null {
  if (!artist.images || artist.images.length === 0) return null;
  const primary = artist.images.find((img) => img.type === "primary");
  const image = primary ?? artist.images[0];
  if (image.uri && !image.uri.includes("spacer.gif")) return image.uri;
  if (image.uri150 && !image.uri150.includes("spacer.gif")) return image.uri150;
  return null;
}

export function discogsArtistUrl(id: number): string {
  return `https://www.discogs.com/artist/${id}`;
}
