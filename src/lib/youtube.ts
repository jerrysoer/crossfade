import { getCached, setCache, TTL } from "./cache";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface SearchOptions {
  query: string;
  videoCategoryId?: string;
}

async function searchYouTube({ query, videoCategoryId }: SearchOptions): Promise<string | null> {
  const cacheKey = `yt:${videoCategoryId || "0"}:${query.toLowerCase()}`;
  const cached = await getCached<string>(cacheKey);
  if (cached) return cached;

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.warn("YOUTUBE_API_KEY not set, skipping YouTube search");
    return null;
  }

  try {
    const params: Record<string, string> = {
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "1",
      order: "relevance",
      key,
    };
    if (videoCategoryId) {
      params.videoCategoryId = videoCategoryId;
    }

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${new URLSearchParams(params)}`);
    if (!res.ok) {
      console.warn(`YouTube search failed (${res.status}): ${query}`);
      return null;
    }

    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;
    if (videoId) {
      await setCache(cacheKey, videoId, TTL.YOUTUBE);
    }
    return videoId ?? null;
  } catch (err) {
    console.warn("YouTube search error:", err);
    return null;
  }
}

export async function findFilmClip(artistName: string, topFilmTitle?: string): Promise<string | null> {
  const titlePart = topFilmTitle ? ` "${topFilmTitle}"` : "";
  const query = `"${artistName}"${titlePart} trailer OR scene OR clip -karaoke -cover -reaction -remix -lyrics`;
  return searchYouTube({ query, videoCategoryId: "24" });
}

export async function findMusicClip(artistName: string, topMusicTitle?: string): Promise<string | null> {
  const titlePart = topMusicTitle ? ` "${topMusicTitle}"` : "";
  const query = `"${artistName}"${titlePart} official`;
  return searchYouTube({ query, videoCategoryId: "10" });
}
