import type { JournalSnapshotEntry } from "../utils/contextBuilders";
export type Route =
  | "landing"
  | "newLanding"
  | "whatIsInnerCode"
  | "nameCollection"
  | "signup"
  | "login"
  | "verifyEmail"
  | "welcomeBack"
  | "dashboard"
  | "instructions"
  | "howToUseInny"
  | "categorySelection"
  | "onboarding"
  | "analyzing"
  | "results"
  | "journal"
  | "aiCoach"
  | "journalCalendar"
  | "quickCheckIn"
  | "goals"
  | "settings";

export type Msg = {
  id: string;
  sender: "ai" | "you" | "system";
  text: string;
  kind?: "text" | "section";
};

export type Prompt = {
  id: string;
  category: string;
  q: string;
  chips?: string[];
  xp?: boolean;
  essential?: boolean; // Used for progressive onboarding - these questions asked first
  phase?: 1 | 2 | 3; // Phase 1: Foundation, Phase 2: Exploration, Phase 3: Mastery
};

/** Morning or evening journal slot. Omit = treat as evening (backward compat). */
export type JournalSlot = 'morning' | 'evening';

export type JournalEntry = {
  id: string;
  text: string;
  categories: string[];
  values: string[];
  gratitude: string[];
  /** Evening journal: "3 things that went well today". Morning uses gratitude. */
  wentWell?: string[];
  mood?: string;
  suggestionRef?: string;
  /** Optional link to a goal when this entry reflects on that goal */
  goalRef?: { goalId: string; snippet?: string };
  createdAt: number;
  category?: string; // legacy back-compat
  /** Morning (☀️) or evening (🌙). Omit = evening. */
  slot?: JournalSlot;
};

export interface OnboardingAnswer {
  id: string;
  stepKey: string;
  question?: string | null;
  answer: string;
  category?: string | null;
  createdAt: number;
  updatedAt: number;
}

export type JournalDraft = {
  text?: string;
  category?: string;
  values?: string[];
  suggestionRef?: string;
};

export type ResultsData = {
  personalCode: string;
  aligned: string[];
  improvement: string[];
  valueEntries: [string, number][];
  suggestions: import("../components/SuggestionCard").Suggestion[];
  weakAreaSuggestions: import("../components/SuggestionCard").Suggestion[];
  valueStrengthSuggestions: import("../components/SuggestionCard").Suggestion[];
  discoveryAreaSuggestions: import("../components/SuggestionCard").Suggestion[];
};

// Weekly Check-In Types
export interface CheckInEntry {
  id: string;
  timestamp: number;
  ratings: Array<{
    category: string;
    oldScore: number;
    newScore: number;
  }>;
  note?: string;
}

export interface CategoryPhase {
  phase1Complete: boolean;
  phase1Date?: number;
  phase2Complete: boolean;
  phase2Date?: number;
  phase3Complete: boolean;
  phase3Date?: number;
}

export interface CategoryHistory {
  date: string; // YYYY-MM-DD
  scores: Record<string, number>;
}

// Daily Insights Types
export interface InsightPattern {
  type: "scoreDrop" | "neglectedCategory" | "repeatedWords" | "valueDisconnect";
  category?: string;
  oldScore?: number;
  newScore?: number;
  word?: string;
  value?: string;
}

export interface DailyInsight {
  id: string;
  date: string; // YYYY-MM-DD
  pattern: InsightPattern;
  text: string; // AI-generated insight
  dismissed: boolean;
  timestamp: number;
  interacted: boolean; // User clicked "Talk About This"
}

export interface InsightState {
  categoryScores: Record<string, number>;
  completedCategories: string[];
  valueEntries: [string, number][];
  checkInHistory: CheckInEntry[];
  journalEntries: JournalEntry[];
  onboardingAnswers?: string[];
  journalSummary?: string;
  recentJournalEntries?: JournalSnapshotEntry[];
}

// Goal-setting (SMART, value-aligned)
export type GoalHorizon = "short" | "mid" | "long";

export interface GoalActionStep {
  id: string;
  label: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  specific: string;
  measurable: string;
  achievable?: string;
  relevantValue: string;
  lifeArea?: string;
  dueDate: number;
  horizon: GoalHorizon;
  actionSteps: GoalActionStep[];
  createdAt: number;
  updatedAt: number;
  /** When set, goal is completed (100%) regardless of steps */
  completedAt?: number;
}

