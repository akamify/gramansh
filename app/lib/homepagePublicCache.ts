import type { PublicHomepageData } from "@/app/lib/publicDataClient";

export const HOMEPAGE_PUBLIC_CACHE_KEY = "gramansh_homepage_public_cache_v1";
export const HOMEPAGE_RECOVERY_KEY = "gramansh_homepage_recovery_attempted_v1";
export const HOMEPAGE_SOFT_REFETCH_KEY = "gramansh_homepage_soft_refetch_done_v1";

const CACHE_VERSION = 1;
const FRESH_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEnvelope = {
  version: number;
  savedAt: number;
  data: PublicHomepageData;
};

export type HomepageCacheRead =
  | { status: "miss"; data: null; source: "static-fallback" }
  | { status: "fresh" | "stale"; data: PublicHomepageData; source: "localStorage" };

const devLog = (message: string, details?: unknown) => {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[homepage-cache] ${message}`, details ?? "");
  }
};

function isValidData(value: unknown): value is PublicHomepageData {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<PublicHomepageData>;
  return (
    Array.isArray(data.banners) &&
    Array.isArray(data.featuredProducts) &&
    Array.isArray(data.categories) &&
    Array.isArray(data.testimonials)
  );
}

export function readHomepagePublicCache(): HomepageCacheRead {
  if (typeof window === "undefined") {
    return { status: "miss", data: null, source: "static-fallback" };
  }

  try {
    const raw = window.localStorage.getItem(HOMEPAGE_PUBLIC_CACHE_KEY);
    if (!raw) {
      devLog("cache miss");
      return { status: "miss", data: null, source: "static-fallback" };
    }

    const parsed = JSON.parse(raw) as Partial<CacheEnvelope>;
    const savedAt = Number(parsed.savedAt || 0);
    const age = Date.now() - savedAt;
    if (parsed.version !== CACHE_VERSION || !savedAt || !isValidData(parsed.data) || age > STALE_TTL_MS) {
      window.localStorage.removeItem(HOMEPAGE_PUBLIC_CACHE_KEY);
      devLog("cache expired/invalid");
      return { status: "miss", data: null, source: "static-fallback" };
    }

    const status = age <= FRESH_TTL_MS ? "fresh" : "stale";
    devLog(`cache ${status}`, { ageMs: age });
    return { status, data: parsed.data, source: "localStorage" };
  } catch (error) {
    devLog("cache read failed", error);
    return { status: "miss", data: null, source: "static-fallback" };
  }
}

export function writeHomepagePublicCache(data: PublicHomepageData) {
  if (typeof window === "undefined" || !isValidData(data)) return;

  try {
    const envelope: CacheEnvelope = {
      version: CACHE_VERSION,
      savedAt: Date.now(),
      data,
    };
    window.localStorage.setItem(HOMEPAGE_PUBLIC_CACHE_KEY, JSON.stringify(envelope));
    devLog("cache updated");
  } catch (error) {
    devLog("cache write failed", error);
  }
}

