// Check-In Logic
// Smart selection of which areas to check in on

import { CheckInEntry, CategoryHistory, CategoryPhase } from "../types";
import { dayKeyFromTs, getCurrentTime, safeGetItem, safeSetItem } from "./helpers";
import { 
  loadCheckInHistoryFromSupabase, 
  saveCheckInHistoryToSupabase,
  loadCategoryHistoryFromSupabase,
  saveCategoryHistoryToSupabase
} from "../lib/supabaseData";
import { devLog } from "./devLog";

const ONBOARDING_COMPLETED_KEY = "innercode_onboardingCompletedAt";
const DAY_MS = 1000 * 60 * 60 * 24;

function getOnboardingCompletedAt(): number | null {
  try {
    const stored = safeGetItem(ONBOARDING_COMPLETED_KEY);
    if (stored) {
      const parsed = Number(stored);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    const stateRaw = safeGetItem("innercode_state_v1");
    if (!stateRaw) {
      return null;
    }

    const state = JSON.parse(stateRaw) as { categoryPhases?: Record<string, CategoryPhase> } | undefined;
    const categoryPhases = state?.categoryPhases;
    if (!categoryPhases) {
      return null;
    }

    const phaseDates = Object.values(categoryPhases)
      .map((phase) => phase?.phase1Date)
      .filter((ts): ts is number => typeof ts === "number" && Number.isFinite(ts));

    if (phaseDates.length === 0) {
      return null;
    }

    const earliest = Math.min(...phaseDates);
    safeSetItem(ONBOARDING_COMPLETED_KEY, String(earliest));
    return earliest;
  } catch {
    return null;
  }
}

/**
 * Get areas for check-in based on user's completed categories
 * 
 * Logic:
 * - 3-5 areas: Check all
 * - 6-12 areas: Smart selection of 5:
 *   1. Lowest scoring area
 *   2. Declining area (if any)
 *   3. Highest scoring area (celebrate!)
 *   4-5. Mid-range or neglected areas
 */
export function getAreasForCheckIn(
  completedCategories: string[],
  categoryScores: Record<string, number>,
  checkInHistory: CheckInEntry[]
): string[] {
  const total = completedCategories.length;
  
  // If 5 or fewer areas, check them all
  if (total <= 5) {
    return completedCategories;
  }
  
  // Smart selection for 6+ areas
  // Get last check-in timestamp
  const lastCheckIn = checkInHistory.length > 0 
    ? checkInHistory[checkInHistory.length - 1].timestamp 
    : null;
  
  // Get history to detect trends (use sync version for immediate access)
  const history = getCheckInHistorySync();
  
  // Analyze each area
  const areaAnalysis = completedCategories.map(category => {
    const score = categoryScores[category] || 5;
    
    // Detect trend (improving, stable, declining)
    let trend: "improving" | "stable" | "declining" = "stable";
    if (lastCheckIn && history.length >= 2) {
      const recentHistory = history.slice(-3); // Last 3 check-ins
      const scores = recentHistory.map(h => {
        const rating = h.ratings.find(r => r.category === category);
        return rating ? rating.newScore : undefined;
      }).filter(s => s !== undefined) as number[];
      if (scores.length >= 2) {
        const trendValue = scores[scores.length - 1] - scores[0];
        if (trendValue > 1) trend = "improving";
        else if (trendValue < -1) trend = "declining";
      }
    }
    
    // Get days since last check
    const daysSinceCheck = lastCheckIn 
      ? Math.floor((getCurrentTime() - lastCheckIn) / (1000 * 60 * 60 * 24))
      : 999;
    
    return {
      category,
      score,
      trend,
      daysSinceCheck,
    };
  });
  
  // Sort by priority
  const sorted = areaAnalysis.sort((a, b) => {
    // Priority 1: Declining areas
    if (a.trend === "declining" && b.trend !== "declining") return -1;
    if (b.trend === "declining" && a.trend !== "declining") return 1;
    
    // Priority 2: Lowest scores
    if (a.score !== b.score) return a.score - b.score;
    
    // Priority 3: Longest since last check
    return b.daysSinceCheck - a.daysSinceCheck;
  });
  
  // Select 5 areas using smart strategy
  const selected: string[] = [];
  
  // 1. Lowest scoring area (always)
  selected.push(sorted[0].category);
  
  // 2. Declining area (if any, and not already selected)
  const declining = sorted.find(a => a.trend === "declining" && !selected.includes(a.category));
  if (declining) selected.push(declining.category);
  
  // 3. Highest scoring area (celebrate wins!)
  const highest = sorted[sorted.length - 1];
  if (!selected.includes(highest.category)) selected.push(highest.category);
  
  // 4-5. Fill remaining spots with mid-range or neglected
  const remaining = sorted.filter(a => !selected.includes(a.category));
  selected.push(...remaining.slice(0, 5 - selected.length).map(a => a.category));
  
  return selected.slice(0, 5);
}

/**
 * Check if user should be shown weekly check-in banner
 */
export function shouldShowCheckIn(checkInHistory: CheckInEntry[] | (() => CheckInEntry[])): boolean {
  // Handle both array and function (for backward compatibility)
  const history = typeof checkInHistory === 'function' ? checkInHistory() : checkInHistory;
  
  if (history.length === 0) {
    // No check-ins yet, check if 7 days since onboarding
    const baseline = getOnboardingCompletedAt();
    if (!baseline) {
      return false;
    }
    const daysSince = Math.floor((getCurrentTime() - baseline) / DAY_MS);
    return daysSince >= 7;
  }
  
  // CRITICAL FIX: Check if there's been a check-in TODAY
  const lastCheckInTs = history[history.length - 1].timestamp;
  const today = dayKeyFromTs(getCurrentTime());
  const lastCheckInDay = dayKeyFromTs(lastCheckInTs);
  
  // If there's been a check-in today, don't show banner
  if (lastCheckInDay === today) {
    return false;
  }
  
  // Otherwise, check if 7 days have passed since last check-in
  const daysSince = Math.floor((getCurrentTime() - lastCheckInTs) / DAY_MS);
  return daysSince >= 7;
}

/**
 * Get check-in history from Supabase (with localStorage fallback)
 */
export async function getCheckInHistory(): Promise<CheckInEntry[]> {
  try {
    // Try Supabase first
    const supabaseHistory = await loadCheckInHistoryFromSupabase();
    if (supabaseHistory.length > 0) {
      // Also update localStorage for offline access
      safeSetItem("innercode_checkins", JSON.stringify(supabaseHistory));
      return supabaseHistory;
    }
  } catch (error) {
    devLog.warn('Failed to load check-in history from Supabase, falling back to localStorage', error);
  }

  // Fallback to localStorage
  try {
    const saved = safeGetItem("innercode_checkins");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Get check-in history synchronously from localStorage only
 * Use this when you need immediate access without async
 */
export function getCheckInHistorySync(): CheckInEntry[] {
  try {
    const saved = safeGetItem("innercode_checkins");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save check-in to history (Supabase + localStorage)
 */
export async function saveCheckIn(checkIn: CheckInEntry): Promise<void> {
  // Get current history (try Supabase first, fallback to localStorage)
  let history: CheckInEntry[];
  try {
    history = await getCheckInHistory();
  } catch {
    // If async fails, use sync localStorage version
    history = getCheckInHistorySync();
  }

  history.push(checkIn);
  
  // Keep max 52 entries (1 year)
  if (history.length > 52) {
    history.shift();
  }
  
  // CRITICAL: Save to localStorage FIRST for immediate availability
  safeSetItem("innercode_checkins", JSON.stringify(history));
  
  // Save to Supabase (async, will queue if offline)
  try {
    await saveCheckInHistoryToSupabase(history);
    // After successful Supabase save, ensure localStorage is still in sync
    safeSetItem("innercode_checkins", JSON.stringify(history));
  } catch (error) {
    devLog.warn('Failed to save check-in history to Supabase', error);
    // localStorage already saved, so user data is preserved
  }
}

/**
 * Get category history from Supabase (with localStorage fallback)
 */
export async function getCategoryHistory(): Promise<CategoryHistory[]> {
  try {
    // Try Supabase first
    const supabaseHistory = await loadCategoryHistoryFromSupabase();
    if (supabaseHistory.length > 0) {
      // Also update localStorage for offline access
      safeSetItem("innercode_category_history", JSON.stringify(supabaseHistory));
      return supabaseHistory;
    }
  } catch (error) {
    devLog.warn('Failed to load category history from Supabase, falling back to localStorage', error);
  }

  // Fallback to localStorage
  try {
    const saved = safeGetItem("innercode_category_history");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Get category history synchronously from localStorage only
 */
export function getCategoryHistorySync(): CategoryHistory[] {
  try {
    const saved = safeGetItem("innercode_category_history");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save category scores snapshot (Supabase + localStorage)
 */
export async function saveCategorySnapshot(scores: Record<string, number>): Promise<void> {
  // Get current history (try Supabase first, fallback to localStorage)
  let history: CategoryHistory[];
  try {
    history = await getCategoryHistory();
  } catch {
    // If async fails, use sync localStorage version
    history = getCategoryHistorySync();
  }

  const today = dayKeyFromTs(getCurrentTime());
  
  history.push({
    date: today,
    scores,
  });
  
  // Keep max 52 entries (1 year)
  if (history.length > 52) {
    history.shift();
  }
  
  // Save to localStorage immediately for offline access
  safeSetItem("innercode_category_history", JSON.stringify(history));
  
  // Save to Supabase (async, will queue if offline)
  try {
    await saveCategoryHistoryToSupabase(history);
  } catch (error) {
    devLog.warn('Failed to save category history to Supabase', error);
    // localStorage already saved, so user data is preserved
  }
}

/**
 * Calculate check-in changes summary
 */
export function calculateCheckInChanges(
  oldScores: Record<string, number>,
  newScores: Record<string, number>
): {
  improvements: Array<{ category: string; oldScore: number; newScore: number }>;
  stable: Array<{ category: string; score: number }>;
  declines: Array<{ category: string; oldScore: number; newScore: number }>;
} {
  const improvements: Array<{ category: string; oldScore: number; newScore: number }> = [];
  const stable: Array<{ category: string; score: number }> = [];
  const declines: Array<{ category: string; oldScore: number; newScore: number }> = [];
  
  Object.keys(newScores).forEach(category => {
    const oldScore = oldScores[category] || 5;
    const newScore = newScores[category];
    
    if (newScore > oldScore) {
      improvements.push({ category, oldScore, newScore });
    } else if (newScore < oldScore) {
      declines.push({ category, oldScore, newScore });
    } else {
      stable.push({ category, score: newScore });
    }
  });
  
  return { improvements, stable, declines };
}

// Re-export for convenience
export type { CheckInEntry, CategoryHistory } from "../types";

