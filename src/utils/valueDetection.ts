import { VALUE_SIGNALS, VALUE_ICONS } from "../constants/values";
import { objEntries } from "./helpers";

function stem(word: string) {
  return word.replace(/(ing|ed|s)$/i, "");
}

export function detectValueScores(text: string): Record<string, number> {
  const tokens = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const stems = tokens.map(stem);
  const bag = new Map<string, number>();
  stems.forEach((t) => bag.set(t, (bag.get(t) ?? 0) + 1));

  const scores: Record<string, number> = {};
  for (const [value, keys] of objEntries(VALUE_SIGNALS)) {
    let total = 0;
    for (const k of keys) {
      const keyStem = stem(k.toLowerCase());
      total += bag.get(keyStem) ?? 0;
    }
    if (total > 0) scores[value] = total;
  }
  return scores;
}

export function reflectAnswer(text: string): {
  reflection?: string;
  followup?: string;
  ack?: string;
} {
  const scores = detectValueScores(text);
  const entries = objEntries(scores).sort((a, b) => b[1] - a[1]);
  const themes = entries
    .slice(0, 2)
    .map(([k]) => `${VALUE_ICONS[k] ?? "✨"} ${k}`);
  const ackTemplates = [
    "Thanks for sharing — that sounds meaningful.",
    "I appreciate the detail — I can tell this matters to you.",
    "That's clear and honest — thank you.",
  ];
  const ack = ackTemplates[Math.floor(Math.random() * ackTemplates.length)];
  if (!entries.length) {
    return {
      ack,
      followup:
        "If you had to capture that feeling in one word, what would it be?",
    };
  }
  // Make reflections statements, not questions
  const reflectionStatements = [
    `I can sense themes of ${themes.join(" and ")} in what you shared.`,
    `I'm noticing ${themes.join(" and ")} coming through here.`,
    `This sounds connected to ${themes.join(" and ")}.`,
  ];
  const reflection = reflectionStatements[Math.floor(Math.random() * reflectionStatements.length)];
  const followups = [
    "What small change would bring a little more of this into next week?",
    "When did you last feel this strongly, and what helped?",
    "If this value had a headline in your life right now, what would it say?",
  ];
  const followup = followups[Math.floor(Math.random() * followups.length)];
  return { reflection, followup, ack };
}

