import { NextRequest, NextResponse } from "next/server";
import { CROSSOVER_ARTISTS } from "@/lib/artists";
import { getCached, setCache, rpush, llen, TTL } from "@/lib/cache";

const CRON_INDEX_KEY = "cf:cron:index";

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current index from Redis (round-robin through artist list)
    const currentIndex =
      (await getCached<number>(CRON_INDEX_KEY)) ?? 0;
    const artist = CROSSOVER_ARTISTS[currentIndex % CROSSOVER_ARTISTS.length];

    // Advance index for next run
    const nextIndex = (currentIndex + 1) % CROSSOVER_ARTISTS.length;
    await setCache(CRON_INDEX_KEY, nextIndex, TTL.DISCOVER);

    // Call the discover endpoint internally
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/discover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchName: artist, previousNames: [] }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`Cron warm-cache failed for "${artist}": ${text.slice(0, 200)}`);
      return NextResponse.json(
        {
          status: "error",
          artist,
          index: currentIndex,
          error: `Discover returned ${res.status}`,
        },
        { status: 500 }
      );
    }

    console.log(`Cron warm-cache: refreshed "${artist}" (index ${currentIndex})`);

    // Also generate a random result for the pre-computed queue
    let queueSize = await llen("cf:queue:random");
    let queueAdded: string | null = null;
    if (queueSize < 30) {
      const randomRes = await fetch(`${baseUrl}/api/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previousNames: [] }),
      });
      if (randomRes.ok) {
        const randomArtist = await randomRes.json();
        if (randomArtist?.name) {
          await rpush("cf:queue:random", randomArtist);
          queueAdded = randomArtist.name;
          queueSize++;
          console.log(`Cron queue: added "${randomArtist.name}" (queue size: ${queueSize})`);
        }
      }
    }

    return NextResponse.json({
      status: "ok",
      artist,
      index: currentIndex,
      nextIndex,
      totalArtists: CROSSOVER_ARTISTS.length,
      queueSize,
      queueAdded,
    });
  } catch (error) {
    console.error("Cron warm-cache error:", error);
    return NextResponse.json(
      { error: "Internal error during cache warming" },
      { status: 500 }
    );
  }
}
