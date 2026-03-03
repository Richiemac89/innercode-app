// Phase Unlocking Logic
// Determines when users can unlock Phase 2/3 for each category

import { CategoryPhase, JournalEntry } from "../types";
import { dayKeyFromTs } from "./helpers";

interface PhaseCheckContext {
  categoryPhases: Record<string, CategoryPhase>;
  journalEntries: JournalEntry[];
  category: string;
}

/**
 * Check if user can unlock Phase 2 for a category
 * Criteria:
 * - Phase 1 complete
 * - 7 days since Phase 1 completion
 * - 3+ journal entries tagged to this category
 */
export function canUnlockPhase2(context: PhaseCheckContext): boolean {
  const { categoryPhases, journalEntries, category } = context;
  const phaseData = categoryPhases[category];
  
  // Must have completed Phase 1
  if (!phaseData?.phase1Complete || !phaseData.phase1Date) {
    return false;
  }
  
  // Check time requirement (7 days)
  const daysSincePhase1 = Math.floor((Date.now() - phaseData.phase1Date) / (1000 * 60 * 60 * 24));
  if (daysSincePhase1 < 7) {
    return false;
  }
  
  // Check journal entry requirement (3+ entries)
  const phase1Date = phaseData.phase1Date;
  const entriesSincePhase1 = journalEntries.filter(entry => 
    entry.categories.includes(category) && 
    entry.createdAt > phase1Date
  );
  
  if (entriesSincePhase1.length < 3) {
    return false;
  }
  
  return true;
}

/**
 * Check if user can unlock Phase 3 for a category
 * Criteria:
 * - Phase 2 complete
 * - 14 days since Phase 2 completion
 * - 5+ journal entries tagged to this category
 */
export function canUnlockPhase3(context: PhaseCheckContext): boolean {
  const { categoryPhases, journalEntries, category } = context;
  const phaseData = categoryPhases[category];
  
  // Must have completed Phase 2
  if (!phaseData?.phase2Complete || !phaseData.phase2Date) {
    return false;
  }
  
  // Check time requirement (14 days)
  const daysSincePhase2 = Math.floor((Date.now() - phaseData.phase2Date) / (1000 * 60 * 60 * 24));
  if (daysSincePhase2 < 14) {
    return false;
  }
  
  // Check journal entry requirement (5+ entries)
  const phase2Date = phaseData.phase2Date;
  const entriesSincePhase2 = journalEntries.filter(entry => 
    entry.categories.includes(category) && 
    entry.createdAt > phase2Date
  );
  
  if (entriesSincePhase2.length < 5) {
    return false;
  }
  
  return true;
}

/**
 * Get phase status message for a category
 */
export function getPhaseStatus(
  category: string,
  categoryPhases: Record<string, CategoryPhase>
): {
  phase: 1 | 2 | 3;
  completed: boolean;
  locked: boolean;
  message: string;
} {
  const phaseData = categoryPhases[category];
  
  if (!phaseData?.phase1Complete) {
    return {
      phase: 1,
      completed: false,
      locked: false,
      message: "Phase 1: Foundation",
    };
  }
  
  if (!phaseData.phase2Complete) {
    return {
      phase: 2,
      completed: false,
      locked: true,
      message: "Phase 2: Exploration Ready",
    };
  }
  
  if (!phaseData.phase3Complete) {
    return {
      phase: 3,
      completed: false,
      locked: true,
      message: "Phase 3: Mastery Ready",
    };
  }
  
  return {
    phase: 3,
    completed: true,
    locked: false,
    message: "All Phases Complete",
  };
}

/**
 * Initialize phase data for a category
 */
export function initializePhaseData(category: string): CategoryPhase {
  return {
    phase1Complete: false,
    phase2Complete: false,
    phase3Complete: false,
  };
}

/**
 * Mark phase as complete
 */
export function markPhaseComplete(
  category: string,
  phase: 1 | 2 | 3,
  categoryPhases: Record<string, CategoryPhase>
): Record<string, CategoryPhase> {
  const updated = { ...categoryPhases };
  
  if (!updated[category]) {
    updated[category] = initializePhaseData(category);
  }
  
  if (phase === 1) {
    updated[category].phase1Complete = true;
    updated[category].phase1Date = Date.now();
  } else if (phase === 2) {
    updated[category].phase2Complete = true;
    updated[category].phase2Date = Date.now();
  } else if (phase === 3) {
    updated[category].phase3Complete = true;
    updated[category].phase3Date = Date.now();
  }
  
  return updated;
}

/**
 * Get all categories ready for deepening
 */
export function getCategoriesReadyForDeepening(
  completedCategories: string[],
  categoryPhases: Record<string, CategoryPhase>,
  journalEntries: JournalEntry[]
): Array<{
  category: string;
  phase: 2 | 3;
  ready: boolean;
}> {
  return completedCategories.map(category => {
    const context = { categoryPhases, journalEntries, category };
    
    if (canUnlockPhase3(context)) {
      return { category, phase: 3 as const, ready: true };
    }
    
    if (canUnlockPhase2(context)) {
      return { category, phase: 2 as const, ready: true };
    }
    
    return { category, phase: 2 as const, ready: false };
  }).filter(item => item.ready);
}

