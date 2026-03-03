import { useEffect, useRef } from "react";

// Safe "includes" without ES2016 lib
export function has<T>(arr: T[], x: T) {
  return arr.indexOf(x) !== -1;
}

// Local-day key like "2025-09-09"
export function dayKeyFromTs(ts: number) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = ("0" + (d.getMonth() + 1)).slice(-2);
  const dd = ("0" + d.getDate()).slice(-2);
  return `${y}-${m}-${dd}`;
}

// Shorten body text for cards
export function snippet(s: string, n = 12) {
  const w = (s || "").trim().split(/\s+/);
  return w.slice(0, n).join(" ") + (w.length > n ? "…" : "");
}

// Word count
export const wc = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Lightweight object helpers to avoid requiring ES2017 lib
export function objEntries<T extends Record<string, any>>(
  o: T
): [string, any][] {
  return Object.keys(o).map((k) => [k, (o as any)[k]] as [string, any]);
}

export function objFromEntries<K extends string, V>(
  pairs: [K, V][]
): Record<K, V> {
  const out = {} as Record<K, V>;
  for (const [k, v] of pairs) (out as any)[k] = v;
  return out;
}

// Timer helper to avoid leaks
export function useTimeoutManager() {
  const timers = useRef<number[]>([]);
  useEffect(() => {
    return () => {
      timers.current.forEach((id) => clearTimeout(id));
      timers.current = [];
    };
  }, []);
  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }
  return { later };
}

// Debug time helpers
// These allow time-skip functionality for testing
import { getDebugTime, isDebugMode } from "./timeDebug";

/**
 * Get current time (respects debug time offset)
 * Use this instead of Date.now() for time-sensitive features
 */
export function getCurrentTime(): number {
  if (isDebugMode()) {
    return getDebugTime();
  }
  return Date.now();
}

/**
 * Get today's date key (respects debug time offset)
 */
export function getTodayKey(): string {
  return dayKeyFromTs(getCurrentTime());
}

export function getSafeLocalStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

export function safeGetItem(key: string): string | null {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return null;
  }
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string): void {
  const storage = getSafeLocalStorage();
  try {
    storage?.setItem(key, value);
  } catch {
    // ignore
  }
}

export function safeRemoveItem(key: string): void {
  const storage = getSafeLocalStorage();
  try {
    storage?.removeItem(key);
  } catch {
    // ignore
  }
}

