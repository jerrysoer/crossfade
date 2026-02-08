import { Redis } from "@upstash/redis";

// Lazy-init Redis client (gracefully handles missing env vars)
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function getCached<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get<T>(key);
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, data, { ex: ttlSeconds });
  } catch {
    // Cache write failures are non-fatal
  }
}

// TTL constants (seconds)
export const TTL = {
  TMDB: 7 * 24 * 60 * 60, // 7 days
  YOUTUBE: 30 * 24 * 60 * 60, // 30 days
  DISCOGS: 24 * 60 * 60, // 24 hours
  DISCOVER: 7 * 24 * 60 * 60, // 7 days
} as const;
