const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

async function searchYouTube(query: string): Promise<string | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    console.warn("YOUTUBE_API_KEY not set, skipping YouTube search");
    return null;
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "1",
      order: "viewCount",
      key,
    });

    const res = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
    if (!res.ok) {
      console.warn(`YouTube search failed (${res.status}): ${query}`);
      return null;
    }

    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;
    return videoId ?? null;
  } catch (err) {
    console.warn("YouTube search error:", err);
    return null;
  }
}

export async function findFilmClip(artistName: string): Promise<string | null> {
  return searchYouTube(`"${artistName}" movie scene OR trailer`);
}

export async function findMusicClip(artistName: string): Promise<string | null> {
  return searchYouTube(`"${artistName}" official music video`);
}
