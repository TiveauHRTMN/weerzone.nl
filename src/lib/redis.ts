import { Redis } from "@upstash/redis";

// De Vercel/Upstash-integratie zet of UPSTASH_REDIS_REST_* of KV_REST_API_* —
// ondersteun beide. Null als (nog) niet geconfigureerd, zodat caches gracieus
// kunnen terugvallen op de bron i.p.v. de build/runtime te laten crashen.
const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;

export const isRedisConfigured = redis !== null;

export function getRedis(): Redis {
  if (!redis) {
    throw new Error(
      "Redis niet geconfigureerd: zet UPSTASH_REDIS_REST_URL/_TOKEN (vercel env pull).",
    );
  }
  return redis;
}
