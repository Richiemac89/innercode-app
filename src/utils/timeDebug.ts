// Time Debug Utility
// FOR TESTING ONLY - Manipulates timestamps to simulate time passing

import { dayKeyFromTs, safeGetItem, safeSetItem, safeRemoveItem } from "./helpers";

const TIME_OFFSET_KEY = "innercode_debug_time_offset";

/**
 * Get current time offset (in milliseconds)
 */
export function getTimeOffset(): number {
  try {
    const offset = safeGetItem(TIME_OFFSET_KEY);
    return offset ? parseInt(offset, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Set time offset (in milliseconds)
 */
export function setTimeOffset(offset: number): void {
  try {
    safeSetItem(TIME_OFFSET_KEY, offset.toString());
  } catch (error) {
    console.error("Failed to set time offset:", error);
  }
}

/**
 * Get "current" time accounting for debug offset
 */
export function getDebugTime(): number {
  return Date.now() + getTimeOffset();
}

/**
 * Skip forward in time by specified days
 */
export function skipDays(days: number): void {
  const daysInMs = days * 24 * 60 * 60 * 1000;
  const currentOffset = getTimeOffset();
  const newOffset = currentOffset + daysInMs;
  
  setTimeOffset(newOffset);
  
  console.log(`⏭️ Skipped ${days} day(s) forward`);
  console.log(`📅 New simulated date:`, new Date(getDebugTime()).toLocaleString());
}

/**
 * Reset time to normal (remove offset)
 */
export function resetTime(): void {
  safeRemoveItem(TIME_OFFSET_KEY);
  console.log("🔄 Time reset to normal");
}

/**
 * Get debug info
 */
export function getDebugInfo(): {
  realTime: Date;
  simulatedTime: Date;
  offsetDays: number;
  offsetMs: number;
} {
  const offset = getTimeOffset();
  const offsetDays = Math.floor(offset / (24 * 60 * 60 * 1000));
  
  return {
    realTime: new Date(),
    simulatedTime: new Date(getDebugTime()),
    offsetDays,
    offsetMs: offset
  };
}

/**
 * Invalidate all time-based caches
 * Call this after skipping time to regenerate insights, sparks, etc.
 */
export function invalidateTimeCaches(): void {
  // Clear daily insights cache
  safeRemoveItem("innercode_daily_insights");
  
  // Clear daily sparks caches (try common patterns)
  const today = dayKeyFromTs(getDebugTime());
  const yesterday = dayKeyFromTs(getDebugTime() - 24 * 60 * 60 * 1000);
  
  safeRemoveItem(`sparks_${today}`);
  safeRemoveItem(`sparks_${yesterday}`);
  
  console.log("🗑️ Time-based caches invalidated");
}

/**
 * Check if debug mode is active
 */
export function isDebugMode(): boolean {
  return getTimeOffset() !== 0;
}






