/**
 * Goal unlock logic: user must complete all life areas, minimum journal entries, and minimum sparks
 * before they can set value-aligned goals.
 *
 * Set to true to always unlock goals for testing. Set to false for production.
 */
const GOALS_UNLOCKED_FOR_TESTING = false;

const REQUIRED_JOURNAL_ENTRIES = 5;
const REQUIRED_SPARKS_COMPLETED = 3;

export interface GoalsUnlockProgress {
  areasComplete: boolean;
  areasCount: number;
  areasRequired: number;
  journalCount: number;
  journalRequired: number;
  sparksCount: number;
  sparksRequired: number;
  unlocked: boolean;
}

/**
 * Count total completed sparks from sparkCompletions (date -> spark ids).
 */
export function countCompletedSparks(sparkCompletions: Record<string, string[]>): number {
  if (!sparkCompletions || typeof sparkCompletions !== "object") {
    return 0;
  }
  return Object.values(sparkCompletions).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
}

/**
 * Whether the user has unlocked the Goals feature.
 */
export function canUnlockGoals(
  completedCategories: string[],
  totalCategories: number,
  journalEntryCount: number,
  sparkCompletions: Record<string, string[]>
): boolean {
  if (GOALS_UNLOCKED_FOR_TESTING) return true;
  const areasOk = totalCategories > 0 && completedCategories.length >= totalCategories;
  const journalOk = journalEntryCount >= REQUIRED_JOURNAL_ENTRIES;
  const sparksOk = countCompletedSparks(sparkCompletions) >= REQUIRED_SPARKS_COMPLETED;
  return areasOk && journalOk && sparksOk;
}

/**
 * Progress toward unlocking Goals (for teaser UI).
 */
export function getGoalsUnlockProgress(
  completedCategories: string[],
  totalCategories: number,
  journalEntryCount: number,
  sparkCompletions: Record<string, string[]>
): GoalsUnlockProgress {
  const areasRequired = totalCategories || 12;
  const areasComplete = completedCategories.length >= areasRequired;
  const journalOk = journalEntryCount >= REQUIRED_JOURNAL_ENTRIES;
  const sparksCount = countCompletedSparks(sparkCompletions ?? {});
  const sparksOk = sparksCount >= REQUIRED_SPARKS_COMPLETED;
  return {
    areasComplete,
    areasCount: completedCategories.length,
    areasRequired,
    journalCount: journalEntryCount,
    journalRequired: REQUIRED_JOURNAL_ENTRIES,
    sparksCount,
    sparksRequired: REQUIRED_SPARKS_COMPLETED,
    unlocked: GOALS_UNLOCKED_FOR_TESTING || (areasComplete && journalOk && sparksOk),
  };
}
