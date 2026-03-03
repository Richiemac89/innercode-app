// Spark Selection Logic
// Smart selection of daily micro-actions

import { MicroAction, MICRO_ACTIONS } from "../constants/microActions";
import { dayKeyFromTs, getCurrentTime, safeGetItem, safeSetItem } from "./helpers";

interface SparkState {
  categoryScores: Record<string, number>;
  completedCategories: string[];
  valueEntries: [string, number][];
}

interface SparkGenerationOptions {
  seed?: string;
  completedSparkIds?: string[];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function createSeededRng(seed: string): () => number {
  let state = hashString(seed) || 1;
  return () => {
    state = (state ^ (state << 13)) >>> 0;
    state = (state ^ (state >>> 17)) >>> 0;
    state = (state ^ (state << 5)) >>> 0;
    return (state >>> 0) / 0xffffffff;
  };
}

function pickRandom<T>(items: T[], rng: () => number): T | null {
  if (!items.length) {
    return null;
  }
  const idx = Math.floor(rng() * items.length);
  return items[idx] ?? null;
}

function findActionById(id: string): MicroAction | null {
  for (const actions of Object.values(MICRO_ACTIONS)) {
    const match = actions.find((action) => action.id === id);
    if (match) {
      return match;
    }
  }
  return null;
}

/**
 * Get today's sparks (3 micro-actions)
 * Selection strategy:
 * 1. Carry over uncompleted sparks from yesterday
 * 2. Fill remaining slots with new sparks based on:
 *    - Lowest scoring area (priority)
 *    - Top value alignment (strengthen what matters)
 *    - Random from completed areas (variety)
 */
export function getTodaysSparks(
  state: SparkState,
  options: SparkGenerationOptions = {}
): MicroAction[] {
  const { seed = "default", completedSparkIds = [] } = options;
  const today = dayKeyFromTs(getCurrentTime());
  const cacheKey = `sparks_${seed}_${today}`;

  // CRITICAL FIX: Check cache but ensure completed sparks are always included
  let cachedSparks: MicroAction[] | null = null;
  try {
    const cached = safeGetItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedSparks = parsed;
      }
    }
  } catch {
    // ignore cache errors
  }

  const rng = createSeededRng(`${seed}-${today}`);
  const addSpark = (action: MicroAction | null | undefined, list: MicroAction[]) => {
    if (!action) return;
    if (!list.find((spark) => spark.id === action.id)) {
      list.push(action);
    }
  };

  // CRITICAL FIX: If we have cached sparks, check if all completed sparks are included
  // If not, merge completed sparks into the cached list
  if (cachedSparks) {
    if (completedSparkIds.length === 0) {
      // No completed sparks, cached list is valid
      return cachedSparks;
    }
    
    const cachedIds = new Set(cachedSparks.map(spark => spark.id));
    const allCompletedIncluded = completedSparkIds.every(id => cachedIds.has(id));
    
    // If all completed sparks are already in cache, return cached list
    if (allCompletedIncluded) {
      return cachedSparks;
    }
    
    // Otherwise, merge completed sparks into cached list
    // Start with completed sparks first, then add non-completed cached sparks
    const sparks: MicroAction[] = [];
    
    // Add completed sparks first (they should always appear)
    completedSparkIds.slice(0, 3).forEach((sparkId) => {
      addSpark(findActionById(sparkId), sparks);
    });
    
    // Add cached sparks that aren't completed (to fill remaining slots)
    cachedSparks.forEach((spark) => {
      if (!completedSparkIds.includes(spark.id) && sparks.length < 3) {
        addSpark(spark, sparks);
      }
    });
    
    // If we still have slots, we'll need to generate more (fall through)
    // But if we have 3 sparks, return early
    if (sparks.length >= 3) {
      const capped = sparks.slice(0, 3);
      // Update cache with merged list
      try {
        safeSetItem(cacheKey, JSON.stringify(capped));
      } catch {
        // ignore cache errors
      }
      return capped;
    }
    
    // If we have less than 3 sparks, continue with generation logic below
    // Use the partially filled sparks array
    const finalSparks = sparks;
    
    // Carry over incomplete sparks from yesterday
    const yesterday = getYesterdayKey();
    const yesterdaysCachedKey = `sparks_${seed}_${yesterday}`;
    const completions = getSparkCompletionsMap();
    const yesterdaysCompletions = completions[yesterday] || [];

    try {
      const yesterdaySparks = safeGetItem(yesterdaysCachedKey);
      if (yesterdaySparks) {
        const parsedYesterdaySparks: MicroAction[] = JSON.parse(yesterdaySparks);
        const incompleteSparks = parsedYesterdaySparks.filter(
          (spark) => !yesterdaysCompletions.includes(spark.id) && !finalSparks.find(s => s.id === spark.id)
        );
        incompleteSparks.forEach((spark) => addSpark(spark, finalSparks));
      }
    } catch {
      // ignore cache errors
    }

    const recentlyCompleted = getRecentlyCompletedSparkIds();

    const lowestArea = getLowestScoringArea(state.categoryScores, state.completedCategories);
    if (lowestArea && finalSparks.length < 3) {
      const actions = MICRO_ACTIONS[lowestArea] || [];
      const freshActions = actions.filter((a) => !recentlyCompleted.includes(a.id) && !finalSparks.find(s => s.id === a.id));
      const poolToUse = freshActions.length > 0 ? freshActions : actions;
      addSpark(pickRandom(poolToUse, rng), finalSparks);
    }

    const topValue = state.valueEntries[0]?.[0];
    if (topValue && finalSparks.length < 3) {
      const valueAlignedAction = findValueAlignedAction(
        topValue,
        state.completedCategories,
        recentlyCompleted,
        rng
      );
      if (valueAlignedAction && !finalSparks.find(s => s.id === valueAlignedAction.id)) {
        addSpark(valueAlignedAction, finalSparks);
      }
    }

    let attempts = 0;
    while (finalSparks.length < 3 && attempts < 20) {
      const randomCategory = getRandomCategory(state.completedCategories, rng);
      if (randomCategory) {
        const actions = MICRO_ACTIONS[randomCategory] || [];
        const freshActions = actions.filter((a) => !recentlyCompleted.includes(a.id) && !finalSparks.find(s => s.id === a.id));
        const poolToUse = freshActions.length > 0 ? freshActions : actions;
        addSpark(pickRandom(poolToUse, rng), finalSparks);
      }
      attempts++;
    }

    const capped = finalSparks.slice(0, 3);

    try {
      safeSetItem(cacheKey, JSON.stringify(capped));
    } catch {
      // ignore cache errors
    }

    return capped;
  }

  // No cached sparks, generate from scratch
  const sparks: MicroAction[] = [];

  // Ensure completed sparks for today always appear in the list first
  if (completedSparkIds.length > 0) {
    completedSparkIds.slice(0, 3).forEach((sparkId) => {
      addSpark(findActionById(sparkId), sparks);
    });
  }

  // Carry over incomplete sparks from yesterday
  const yesterday = getYesterdayKey();
  const yesterdaysCachedKey = `sparks_${seed}_${yesterday}`;
  const completions = getSparkCompletionsMap();
  const yesterdaysCompletions = completions[yesterday] || [];

  try {
    const yesterdaySparks = safeGetItem(yesterdaysCachedKey);
    if (yesterdaySparks) {
      const parsedYesterdaySparks: MicroAction[] = JSON.parse(yesterdaySparks);
      const incompleteSparks = parsedYesterdaySparks.filter(
        (spark) => !yesterdaysCompletions.includes(spark.id)
      );
      incompleteSparks.forEach((spark) => addSpark(spark, sparks));
    }
  } catch {
    // ignore cache errors
  }

  const recentlyCompleted = getRecentlyCompletedSparkIds();

  const lowestArea = getLowestScoringArea(state.categoryScores, state.completedCategories);
  if (lowestArea && sparks.length < 3) {
    const actions = MICRO_ACTIONS[lowestArea] || [];
    const freshActions = actions.filter((a) => !recentlyCompleted.includes(a.id));
    const poolToUse = freshActions.length > 0 ? freshActions : actions;
    addSpark(pickRandom(poolToUse, rng), sparks);
  }

  const topValue = state.valueEntries[0]?.[0];
  if (topValue && sparks.length < 3) {
    const valueAlignedAction = findValueAlignedAction(
      topValue,
      state.completedCategories,
      recentlyCompleted,
      rng
    );
    addSpark(valueAlignedAction, sparks);
  }

  let attempts = 0;
  while (sparks.length < 3 && attempts < 20) {
    const randomCategory = getRandomCategory(state.completedCategories, rng);
    if (randomCategory) {
      const actions = MICRO_ACTIONS[randomCategory] || [];
      const freshActions = actions.filter((a) => !recentlyCompleted.includes(a.id));
      const poolToUse = freshActions.length > 0 ? freshActions : actions;
      addSpark(pickRandom(poolToUse, rng), sparks);
    }
    attempts++;
  }

  const capped = sparks.slice(0, 3);

  try {
    safeSetItem(cacheKey, JSON.stringify(capped));
  } catch {
    // ignore cache errors
  }

  return capped;
}

/**
 * Get yesterday's date key
 */
function getYesterdayKey(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dayKeyFromTs(yesterday.getTime());
}

/**
 * Get recently completed spark IDs (last 7 days)
 * This prevents the same spark from appearing too frequently
 */
function getRecentlyCompletedSparkIds(): string[] {
  const completions = getSparkCompletionsMap();
  const recentIds = new Set<string>();
  const today = new Date();
  
  // Look back 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = dayKeyFromTs(date.getTime());
    const dayCompletions = completions[dateKey] || [];
    dayCompletions.forEach(id => recentIds.add(id));
  }
  
  return Array.from(recentIds);
}

/**
 * Get lowest scoring area from completed categories
 */
function getLowestScoringArea(
  categoryScores: Record<string, number>,
  completedCategories: string[]
): string | null {
  if (completedCategories.length === 0) return null;
  
  const scores = completedCategories
    .map(cat => ({ category: cat, score: categoryScores[cat] || 5 }))
    .sort((a, b) => a.score - b.score);
  
  return scores[0]?.category || null;
}

/**
 * Find an action aligned with a specific value
 */
function findValueAlignedAction(
  value: string,
  completedCategories: string[],
  recentlyCompleted: string[],
  rng: () => number
): MicroAction | null {
  const allActions: MicroAction[] = [];
  
  completedCategories.forEach(cat => {
    const actions = MICRO_ACTIONS[cat] || [];
    allActions.push(...actions.filter(a => a.value === value));
  });
  
  if (allActions.length === 0) return null;
  
  // Filter out recently completed actions, but fall back to all if none available
  const freshActions = allActions.filter(a => !recentlyCompleted.includes(a.id));
  const poolToUse = freshActions.length > 0 ? freshActions : allActions;
  
  return pickRandom(poolToUse, rng);
}

/**
 * Get random category from completed
 */
function getRandomCategory(categories: string[], rng: () => number): string | null {
  if (categories.length === 0) return null;
  return pickRandom(categories, rng);
}

/**
 * Check if spark is completed today
 */
export function isSparkCompleted(sparkId: string): boolean {
  const today = dayKeyFromTs(getCurrentTime());
  const completions = getSparkCompletionsMap();
  return completions[today]?.includes(sparkId) || false;
}

/**
 * Get spark completions from localStorage
 */
export function getSparkCompletionsMap(): Record<string, string[]> {
  try {
    const saved = safeGetItem("innercode_daily_actions");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

/**
 * Save spark completions to localStorage
 */
function saveSparkCompletions(completions: Record<string, string[]>): void {
  // Keep max 30 days
  const entries = Object.entries(completions);
  if (entries.length > 30) {
    entries.sort((a, b) => b[0].localeCompare(a[0])); // Sort by date desc
    const trimmed = Object.fromEntries(entries.slice(0, 30));
    safeSetItem("innercode_daily_actions", JSON.stringify(trimmed));
  } else {
    safeSetItem("innercode_daily_actions", JSON.stringify(completions));
  }
}

/**
 * Calculate spark streak
 */
export function calculateSparkStreak(): number {
  const completions = getSparkCompletionsMap();
  const today = dayKeyFromTs(getCurrentTime());
  
  let streak = 0;
  let currentDate = new Date(today);
  
  while (true) {
    const dateKey = dayKeyFromTs(currentDate.getTime());
    const dayCompletions = completions[dateKey] || [];
    
    if (dayCompletions.length >= 3) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Get completion count for today
 */
export function getTodayCompletionCount(): number {
  const today = dayKeyFromTs(getCurrentTime());
  const completions = getSparkCompletionsMap();
  return completions[today]?.length || 0;
}

