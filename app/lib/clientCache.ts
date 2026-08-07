"use client";

type CacheEnvelope<T> = {
  v: 1;
  savedAt: number;
  ttlMs: number;
  data: T;
};

const mem = new Map<string, CacheEnvelope<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function now() {
  return Date.now();
}

function isFresh(savedAt: number, ttlMs: number) {
  return now() - savedAt <= ttlMs;
}

function safeKey(key: string) {
  return `gramansh_cache:${key}`;
}

function readLocal<T>(key: string): CacheEnvelope<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(safeKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || parsed.v !== 1 || typeof parsed.savedAt !== "number" || typeof parsed.ttlMs !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, env: CacheEnvelope<T>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(safeKey(key), JSON.stringify(env));
  } catch {
    // ignore quota / private mode
  }
}

export function peekCached<T>(key: string): { data: T | null; isFresh: boolean } {
  const memHit = mem.get(key) as CacheEnvelope<T> | undefined;
  if (memHit) {
    return { data: memHit.data, isFresh: isFresh(memHit.savedAt, memHit.ttlMs) };
  }
  const localHit = readLocal<T>(key);
  if (localHit) {
    mem.set(key, localHit as CacheEnvelope<unknown>);
    return { data: localHit.data, isFresh: isFresh(localHit.savedAt, localHit.ttlMs) };
  }
  return { data: null, isFresh: false };
}

export function putCached<T>(key: string, ttlMs: number, data: T) {
  const env: CacheEnvelope<T> = { v: 1, savedAt: now(), ttlMs, data };
  mem.set(key, env as CacheEnvelope<unknown>);
  writeLocal(key, env);
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: { allowStaleOnError?: boolean }
): Promise<T> {
  const allowStaleOnError = options?.allowStaleOnError !== false;

  const memHit = mem.get(key) as CacheEnvelope<T> | undefined;
  if (memHit && isFresh(memHit.savedAt, memHit.ttlMs)) {
    return memHit.data;
  }

  const localHit = readLocal<T>(key);
  if (localHit) {
    mem.set(key, localHit as CacheEnvelope<unknown>);
    if (isFresh(localHit.savedAt, localHit.ttlMs)) {
      return localHit.data;
    }
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = fetcher()
    .then((data) => {
      const env: CacheEnvelope<T> = { v: 1, savedAt: now(), ttlMs, data };
      mem.set(key, env as CacheEnvelope<unknown>);
      writeLocal(key, env);
      return data;
    })
    .catch((err) => {
      if (allowStaleOnError && localHit) return localHit.data;
      if (allowStaleOnError && memHit) return memHit.data;
      throw err;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, p as Promise<unknown>);
  return p;
}

