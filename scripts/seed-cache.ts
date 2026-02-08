/**
 * Cache seed script — populates Redis cache by calling the production
 * /api/discover endpoint for each curated crossover artist.
 *
 * Rate-limited to 1 request every 20s to stay within API quotas.
 * Run with: npx tsx scripts/seed-cache.ts
 *
 * Options:
 *   --start=N   Start from artist index N (for resuming after interruption)
 *   --delay=N   Delay between requests in ms (default: 20000)
 */

import { CROSSOVER_ARTISTS } from "../src/lib/artists";

const PROD_URL =
  process.env.SEED_URL || "https://crossfade-app.vercel.app/api/discover";

const args = process.argv.slice(2);
const startIndex = Number(
  args.find((a) => a.startsWith("--start="))?.split("=")[1] ?? 0
);
const delay = Number(
  args.find((a) => a.startsWith("--delay="))?.split("=")[1] ?? 20_000
);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedArtist(name: string): Promise<boolean> {
  try {
    const res = await fetch(PROD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchName: name, previousNames: [] }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`  FAIL [${res.status}]: ${text.slice(0, 200)}`);
      return false;
    }

    const data = await res.json();
    console.log(
      `  OK: ${data.name} — ${data.filmCredits?.length ?? 0} film, ${data.musicCredits?.length ?? 0} music`
    );
    return true;
  } catch (err) {
    console.error(`  ERROR: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

async function main() {
  const artists = CROSSOVER_ARTISTS.slice(startIndex);
  const total = CROSSOVER_ARTISTS.length;
  let success = 0;
  let fail = 0;

  console.log(
    `Seeding ${artists.length} artists (${startIndex > 0 ? `starting at #${startIndex}` : "from start"})...`
  );
  console.log(`Target: ${PROD_URL}`);
  console.log(`Delay: ${delay / 1000}s between requests`);
  console.log(
    `Estimated time: ~${Math.round((artists.length * delay) / 60_000)} minutes\n`
  );

  for (let i = 0; i < artists.length; i++) {
    const globalIndex = startIndex + i;
    console.log(
      `[${globalIndex + 1}/${total}] ${artists[i]}`
    );

    const ok = await seedArtist(artists[i]);
    if (ok) success++;
    else fail++;

    // Don't sleep after the last artist
    if (i < artists.length - 1) {
      await sleep(delay);
    }
  }

  console.log(`\nDone! ${success} succeeded, ${fail} failed out of ${artists.length}.`);
  if (fail > 0) {
    console.log("Re-run with --start=N to retry from a specific index.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
