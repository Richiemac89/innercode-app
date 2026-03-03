import { JournalEntry, Msg, OnboardingAnswer } from "../types";
import { analyzeJournalPatterns } from "./journalAnalysis";

export type JournalSnapshotEntry = {
  text: string;
  createdAt: number;
  mood?: string;
};

export interface JournalSummaryPayload {
  summaryText: string;
  recentEntries: JournalSnapshotEntry[];
}

const DEFAULT_RECENT_ENTRY_LIMIT = 5;
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
    }));

  const totalEntries = entries.length;
  const latestMood = recentEntries.find((entry) => entry.mood)?.mood;
  const latestText = recentEntries[0]?.text ?? "";

  const patterns = analyzeJournalPatterns(entries, 14)
    .slice(0, 3)
    .map((pattern) => pattern.word)
    .filter(Boolean);

  const summarySegments: string[] = [`You have logged ${totalEntries} journal entries.`];

  if (latestMood) {
    summarySegments.push(`Your latest recorded mood was ${latestMood}.`);
  }

  if (patterns.length > 0) {
    summarySegments.push(`Recent themes: ${patterns.join(", ")}.`);
  }

  if (latestText) {
    summarySegments.push(`Most recent reflection: "${truncate(latestText, 160)}"`);
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

