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

// ── Name matching ──

function normalizeForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\(\d+\)\s*$/, "") // Discogs disambiguation like "John Smith (2)"
    .replace(/[^a-z0-9]/g, "");
}

function namesMatch(searchName: string, resultName: string): boolean {
  const a = normalizeForComparison(searchName);
  const b = normalizeForComparison(resultName);
  return a === b || b.includes(a) || a.includes(b);
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

// ── Name variants ──

function generateNameVariants(names: string[]): string[] {
  const seen = new Set(names.map((n) => n.toLowerCase()));
  const variants: string[] = [];

  for (const name of names) {
    const parts = name.split(/\s+/);
    // For multi-word names, try first name only (handles "Tyrese Gibson" → "Tyrese",
    // "Aaliyah Haughton" → "Aaliyah", etc.)
    if (parts.length >= 2) {
      const first = parts[0];
      if (first.length >= 4 && !seen.has(first.toLowerCase())) {
        seen.add(first.toLowerCase());
        variants.push(first);
      }
    }
  }

  return variants;
}

// ── Artist endpoints ──

export async function searchArtist(
  names: string | string[]
): Promise<DiscogsSearchResult | null> {
  const nameList = Array.isArray(names) ? names : [names];

  // Try all provided names first, then fall back to generated variants
  const allNames = [...nameList, ...generateNameVariants(nameList)];

  for (const name of allNames) {
    const cacheKey = `artist-search:${name}`;
    const cached = getCached<DiscogsSearchResult>(cacheKey);
    if (cached) return cached;

    await acquireToken();

    const params = new URLSearchParams({
      q: name,
      type: "artist",
      per_page: "10",
    });

    const url = `${DISCOGS_BASE}/database/search?${params}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) continue;

    const data: DiscogsSearchResponse = await res.json();
    if (data.results.length === 0) continue;

    // Try exact match first
    const exactMatch = data.results.find((r) => namesMatch(name, r.title));
    if (exactMatch) {
      setCache(cacheKey, exactMatch);
      return exactMatch;
    }

    // Fall back to first result (original behavior as last resort)
    const first = data.results[0];
    setCache(cacheKey, first);
    return first;
  }

  return null;
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
  limit: number = 20
): Promise<DiscogsArtistRelease[]> {
  const cacheKey = `artist-releases:${id}:${limit}`;
  const cached = getCached<DiscogsArtistRelease[]>(cacheKey);
  if (cached) return cached;

  await acquireToken();

  const url = `${DISCOGS_BASE}/artists/${id}/releases?sort=year&sort_order=desc&per_page=${limit}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) return [];

  const data: DiscogsArtistReleasesResponse = await res.json();

  const musicRoles = new Set([
    "Main",
    "TrackAppearance",
    "Appearance",
    "Producer",
    "Co-producer",
    "Remix",
    "Vocal",
  ]);

  // Tier 1: Main artist on master releases (albums)
  let releases = data.releases.filter(
    (r) => r.role === "Main" && r.type === "master"
  );

  // Tier 2: Any Main releases (singles, EPs, compilations)
  if (releases.length < 3) {
    releases = data.releases.filter((r) => r.role === "Main");
  }

  // Tier 3: Include features, soundtracks
  if (releases.length < 2) {
    releases = data.releases.filter(
      (r) => r.role === "Main" || r.role === "TrackAppearance"
    );
  }

  // Tier 4: Any music-related role (producer, appearance, etc.)
  if (releases.length < 2) {
    releases = data.releases.filter((r) => musicRoles.has(r.role));
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
