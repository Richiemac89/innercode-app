import { JournalEntry, Msg, OnboardingAnswer, Goal } from "../types";
import { analyzeJournalPatterns } from "./journalAnalysis";

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

