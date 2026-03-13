// Weekly Reflection persistence (Option A: reuse check-in timing)
// Store last completed timestamp + optional reflection data; use for "7 days since" and "not today"

import type { WeeklyReflectionStored, WeeklyReflectionData } from "../types";
import { dayKeyFromTs, getCurrentTime, safeGetItem, safeSetItem } from "./helpers";
import { getOnboardingCompletedAt } from "./checkInLogic";

const STORAGE_KEY = "innercode_weekly_reflection";
const DAY_MS = 1000 * 60 * 60 * 24;

export function getLastWeeklyReflection(): WeeklyReflectionStored | null {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeeklyReflectionStored;
    if (typeof parsed?.lastCompletedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Whether to show the weekly reflection banner (same timing as old check-in: 7 days since last or since onboarding, and not already done today). */
export function shouldShowWeeklyReflection(): boolean {
  const stored = getLastWeeklyReflection();

  if (!stored) {
    const baseline = getOnboardingCompletedAt();
    if (!baseline) return false;
    const daysSince = Math.floor((getCurrentTime() - baseline) / DAY_MS);
    return daysSince >= 7;
  }

  const today = dayKeyFromTs(getCurrentTime());
  const lastDay = dayKeyFromTs(stored.lastCompletedAt);
  if (lastDay === today) return false;

  const daysSince = Math.floor((getCurrentTime() - stored.lastCompletedAt) / DAY_MS);
  return daysSince >= 7;
}

export function saveWeeklyReflection(entry: WeeklyReflectionStored): void {
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function saveWeeklyReflectionCompletion(reflection?: WeeklyReflectionData): void {
  saveWeeklyReflection({
    lastCompletedAt: getCurrentTime(),
    reflection,
  });
}
