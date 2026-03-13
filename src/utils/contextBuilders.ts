import { JournalEntry, Msg, OnboardingAnswer, Goal } from "../types";
import { analyzeJournalPatterns, getMostNegativePattern } from "./journalAnalysis";
import { dayKeyFromTs } from "./helpers";
import { MICRO_ACTIONS } from "../constants/microActions";

export type JournalSnapshotEntry = {
  text: string;
  createdAt: number;
  mood?: string;
  slot?: 'morning' | 'evening';
  /** Morning journal: 3 things grateful for */
  gratitude?: string[];
  /** Evening journal: 3 things that went well */
  wentWell?: string[];
};

export interface JournalSummaryPayload {
  summaryText: string;
  recentEntries: JournalSnapshotEntry[];
}

const DEFAULT_RECENT_ENTRY_LIMIT = 120;
const DEFAULT_ONBOARDING_LIMIT = 20;

export function extractOnboardingAnswers(
  messages: Msg[],
  limit: number = DEFAULT_ONBOARDING_LIMIT
): string[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  const answers = messages
    .filter((message) => message.sender === "you" && message.text?.trim())
    .map((message) => message.text.trim());

  if (answers.length <= limit) {
    return answers;
  }

  return answers.slice(-limit);
}

export function formatOnboardingAnswersFromSupabase(
  records: OnboardingAnswer[],
  limit: number = DEFAULT_ONBOARDING_LIMIT
): string[] {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  return records
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((record) => record.answer.trim())
    .filter(Boolean)
    .slice(-limit);
}

export function buildJournalSummary(
  entries: JournalEntry[],
  limit: number = DEFAULT_RECENT_ENTRY_LIMIT
): JournalSummaryPayload {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      summaryText: "No journal entries yet.",
      recentEntries: [],
    };
  }

  const recentEntries: JournalSnapshotEntry[] = entries
    .slice(0, limit)
    .map((entry) => ({
      text: entry.text,
      createdAt: entry.createdAt,
      mood: entry.mood,
      slot: entry.slot,
      gratitude: entry.gratitude?.length ? entry.gratitude : undefined,
      wentWell: entry.wentWell?.length ? entry.wentWell : undefined,
    }));

  const totalEntries = entries.length;
  const latestMood = recentEntries.find((entry) => entry.mood)?.mood;
  const latestText = recentEntries[0]?.text ?? "";

  const patterns = analyzeJournalPatterns(entries, 14)
    .slice(0, 3)
    .map((pattern) => pattern.word)
    .filter(Boolean);

  const summarySegments: string[] = [`You have logged ${totalEntries} journal entries.`];

  const morningEntry = recentEntries.find((e) => e.slot === "morning");
  const eveningEntry = recentEntries.find((e) => e.slot === "evening" || e.slot == null);
  if (morningEntry?.mood) summarySegments.push(`Morning mood: ${morningEntry.mood}.`);
  if (eveningEntry?.mood) summarySegments.push(`Evening mood: ${eveningEntry.mood}.`);
  if (!morningEntry?.mood && !eveningEntry?.mood && latestMood) {
    summarySegments.push(`Latest recorded mood: ${latestMood}.`);
  }

  if (patterns.length > 0) {
    summarySegments.push(`Recent themes: ${patterns.join(", ")}.`);
  }

  if (latestText) {
    summarySegments.push(`Most recent reflection: "${truncate(latestText, 160)}"`);
  }

  const goalReflections = entries
    .filter((e) => e.goalRef?.goalId)
    .slice(0, 3)
    .map((e) => {
      const snip = e.goalRef?.snippet?.trim();
      return snip ? `"${truncate(snip, 80)}"` : "(linked to goal)";
    });
  if (goalReflections.length > 0) {
    summarySegments.push("Recent goal reflections: " + goalReflections.join("; "));
  }

  return {
    summaryText: summarySegments.join(" "),
    recentEntries,
  };
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

/** Build a short summary of the user's goals for Inny and check-in context. Includes completed status and next step for better conversations. */
export function buildGoalsSummary(goals: Goal[]): string {
  if (!Array.isArray(goals) || goals.length === 0) {
    return "";
  }
  const parts = goals.slice(0, 5).map((g) => {
    const isCompleted = !!g.completedAt;
    if (isCompleted) {
      return `${g.title} (${g.relevantValue}, ${g.horizon}, completed)`;
    }
    const steps = g.actionSteps || [];
    const done = steps.filter((s) => s.done).length;
    const pct = steps.length > 0 ? Math.round((done / steps.length) * 100) : 0;
    const nextStep = steps.find((s) => !s.done);
    const nextLabel = nextStep?.label ? `, next: ${truncate(nextStep.label, 30)}` : "";
    return `${g.title} (${g.relevantValue}, ${g.horizon}, ${pct}%${nextLabel})`;
  });
  return "Goals: " + parts.join("; ") + ". Reference their goals when relevant (e.g. progress, next steps). If a goal is completed, you can congratulate; if there's a next step, you can ask about it.";
}

const MOOD_SCORES: Record<string, number> = {
  "😭": 1, "☹️": 2, "😐": 3, "🙂": 4, "😄": 5, "😡": 2,
};

/** Build payload for weekly reflection AI: last 7 days of journals, mood, sparks, goals. */
export interface WeeklyReflectionPayload {
  journalSummary: string;
  recentJournalEntries: JournalSnapshotEntry[];
  moodByDay: Array<{ dateKey: string; moodLabel?: string; score?: number }>;
  sparksCompletedThisWeek: string[];
  goalsForReview: Array<{
    goalId: string;
    title: string;
    relevantValue: string;
    horizon: string;
    isCompleted: boolean;
    hasSteps: boolean;
    stepsDone: number;
    stepsTotal: number;
  }>;
  valueEntries: [string, number][];
  onboardingAnswers: string[];
  negativeThemes?: string[];
  /** Average mood 1–5 over the last 7 days (from moodByDay), or null if no mood data */
  averageMoodScoreLast7Days?: number | null;
}

function buildSparkIdToTextMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const actions of Object.values(MICRO_ACTIONS)) {
    for (const a of actions) {
      map[a.id] = a.text;
    }
  }
  return map;
}

export function buildWeeklyReflectionPayload(
  journalEntries: JournalEntry[],
  sparkCompletions: Record<string, string[]>,
  goals: Goal[],
  valueEntries: [string, number][],
  onboardingAnswers: string[]
): WeeklyReflectionPayload {
  // Use real time for the data window so debug skip doesn't exclude real journals/sparks/mood
  const now = Date.now();
  const dayMs = 1000 * 60 * 60 * 24;
  const sevenDaysAgo = now - 7 * dayMs;
  const sparkIdToText = buildSparkIdToTextMap();

  const recentEntries = journalEntries
    .filter((e) => e.createdAt >= sevenDaysAgo)
    .sort((a, b) => b.createdAt - a.createdAt);
  const { summaryText, recentEntries: snapshots } = buildJournalSummary(recentEntries, 30);
  const patterns = analyzeJournalPatterns(recentEntries, 7);
  const negativePattern = getMostNegativePattern(patterns);
  const negativeThemes = negativePattern ? [negativePattern.word] : undefined;

  const moodByDay: WeeklyReflectionPayload["moodByDay"] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dateKey = dayKeyFromTs(d.getTime());
    const dayEntries = recentEntries.filter((e) => dayKeyFromTs(e.createdAt) === dateKey);
    const scores: number[] = [];
    dayEntries.forEach((e) => {
      if (e.mood) scores.push(MOOD_SCORES[e.mood] ?? 3);
    });
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : undefined;
    const moodLabel =
      avg !== undefined
        ? avg >= 4.5
          ? "Very good"
          : avg >= 3.5
            ? "Good"
            : avg >= 2.5
              ? "Neutral"
              : avg >= 1.5
                ? "Low"
                : "Very low"
        : undefined;
    moodByDay.push({ dateKey, moodLabel, score: avg });
  }

  const sparksCompletedThisWeek: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateKey = dayKeyFromTs(d.getTime());
    const ids = sparkCompletions[dateKey] ?? [];
    ids.forEach((id) => {
      const text = sparkIdToText[id] || id;
      if (text && !sparksCompletedThisWeek.includes(text)) sparksCompletedThisWeek.push(text);
    });
  }

  const goalsForReview = goals.map((g) => {
    const steps = g.actionSteps || [];
    return {
      goalId: g.id,
      title: g.title,
      relevantValue: g.relevantValue,
      horizon: g.horizon,
      isCompleted: !!g.completedAt,
      hasSteps: steps.length > 0,
      stepsDone: steps.filter((s) => s.done).length,
      stepsTotal: steps.length,
    };
  });

  const dayScores = moodByDay.map((d) => d.score).filter((s): s is number => s !== undefined);
  const averageMoodScoreLast7Days =
    dayScores.length > 0 ? Math.round((dayScores.reduce((a, b) => a + b, 0) / dayScores.length) * 10) / 10 : null;

  return {
    journalSummary: summaryText,
    recentJournalEntries: snapshots,
    moodByDay,
    sparksCompletedThisWeek,
    goalsForReview,
    valueEntries,
    onboardingAnswers,
    negativeThemes,
    averageMoodScoreLast7Days,
  };
}

