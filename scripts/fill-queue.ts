/**
 * Queue fill script — generates random crossover results and pushes
 * them to the pre-computed Redis queue for instant random discovery.
 *
 * Run with: npx tsx scripts/fill-queue.ts
 *
 * Options:
 *   --count=N   Number of results to generate (default: 20)
 *   --delay=N   Delay between requests in ms (default: 25000)
 */

const PROD_URL =
  process.env.SEED_URL || "https://crossfade-neon.vercel.app/api/discover";

const args = process.argv.slice(2);
const count = Number(
  args.find((a) => a.startsWith("--count="))?.split("=")[1] ?? 20
);
const delay = Number(
  args.find((a) => a.startsWith("--delay="))?.split("=")[1] ?? 25_000
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateRandom(previousNames: string[]): Promise<{ name: string } | null> {
  try {
    const res = await fetch(PROD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ previousNames }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`  FAIL [${res.status}]: ${text.slice(0, 200)}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("text/x-ndjson")) {
      // Streaming NDJSON — read all lines and find the "complete" chunk
      const text = await res.text();
      const lines = text.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        const chunk = JSON.parse(line);
        if (chunk.phase === "complete") {
          const { phase: _, ...artist } = chunk;
          console.log(
            `  OK: ${artist.name} — ${artist.filmCredits?.length ?? 0} film, ${artist.musicCredits?.length ?? 0} music`
          );
          return artist;
        }
      }
      console.error(`  FAIL: No complete chunk in NDJSON response`);
      return null;
    }

    const data = await res.json();
    console.log(
      `  OK: ${data.name} — ${data.filmCredits?.length ?? 0} film, ${data.musicCredits?.length ?? 0} music`
    );
    return data;
  } catch (err) {
    console.error(`  ERROR: ${err instanceof Error ? err.message : err}`);
    return null;
  }
}

async function main() {
  let success = 0;
  let fail = 0;
  const seen: string[] = [];

  console.log(`Generating ${count} random results for the queue...`);
  console.log(`Target: ${PROD_URL}`);
  console.log(`Delay: ${delay / 1000}s between requests`);
  console.log(
    `Estimated time: ~${Math.round((count * delay) / 60_000)} minutes\n`
  );

  for (let i = 0; i < count; i++) {
    console.log(`[${i + 1}/${count}]`);

    const result = await generateRandom(seen);
    if (result) {
      success++;
      seen.push(result.name);
    } else {
      fail++;
    }

    if (i < count - 1) {
      await sleep(delay);
    }
  }

  console.log(`\nDone! ${success} added to queue, ${fail} failed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
