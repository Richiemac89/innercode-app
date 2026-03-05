/**
 * Generate a PDF "Session summary" for the user to share with a therapist or coach.
 * Includes: life area scores, value ranking, mood trend, spark completion (with names), goals (with titles) by month.
 */

import { jsPDF } from "jspdf";
import type { JournalEntry, Goal } from "../types";
import { MICRO_ACTIONS } from "../constants/microActions";
import { getCheckInHistorySync } from "./checkInLogic";
import { dayKeyFromTs, getCurrentTime } from "./helpers";

/** Map spark id → display text for PDF labels. */
function buildSparkIdToTextMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const actions of Object.values(MICRO_ACTIONS)) {
    for (const a of actions) {
      map[a.id] = a.text;
    }
  }
  return map;
}

const MOOD_SCORES: Record<string, number> = {
  "😭": 1,
  "☹️": 2,
  "😐": 3,
  "🙂": 4,
  "😄": 5,
  "😡": 2,
};

const MOOD_LABELS: Record<number, string> = {
  1: "Very low",
  2: "Low",
  3: "Neutral",
  4: "Good",
  5: "Very good",
};

export interface SessionSummaryData {
  categoryScores: Record<string, number>;
  valueEntries: [string, number][];
  journalEntries: JournalEntry[];
  sparkCompletions: Record<string, string[]>;
  goals: Goal[];
}

function getMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7); // "2025-03-15" -> "2025-03"
}

function aggregateMoodByMonth(entries: JournalEntry[]): Array<{ month: string; count: number; avg: number; label: string }> {
  const byMonth: Record<string, { sum: number; count: number }> = {};
  entries.forEach((e) => {
    if (!e.mood) return;
    const dateKey = dayKeyFromTs(e.createdAt);
    const month = getMonthKey(dateKey);
    if (!byMonth[month]) byMonth[month] = { sum: 0, count: 0 };
    byMonth[month].sum += MOOD_SCORES[e.mood] ?? 3;
    byMonth[month].count += 1;
  });
  const months = Object.keys(byMonth).sort().reverse().slice(0, 6);
  return months.map((month) => {
    const { sum, count } = byMonth[month];
    const avg = count > 0 ? sum / count : 0;
    const label = avg >= 4.5 ? "Very good" : avg >= 3.5 ? "Good" : avg >= 2.5 ? "Neutral" : avg >= 1.5 ? "Low" : "Very low";
    return { month, count, avg: Math.round(avg * 10) / 10, label };
  });
}

function aggregateSparksByMonth(sparkCompletions: Record<string, string[]>): Array<{ month: string; completed: number }> {
  const byMonth: Record<string, number> = {};
  Object.entries(sparkCompletions).forEach(([dateKey, ids]) => {
    const month = getMonthKey(dateKey);
    byMonth[month] = (byMonth[month] || 0) + (ids?.length ?? 0);
  });
  return Object.entries(byMonth)
    .map(([month, completed]) => ({ month, completed }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);
}

/** Sparks by month with resolved names for each completed spark. */
function aggregateSparksByMonthWithNames(
  sparkCompletions: Record<string, string[]>,
  idToText: Record<string, string>
): Array<{ month: string; completed: number; names: string[] }> {
  const byMonth: Record<string, { count: number; names: Set<string> }> = {};
  Object.entries(sparkCompletions).forEach(([dateKey, ids]) => {
    const month = getMonthKey(dateKey);
    if (!byMonth[month]) byMonth[month] = { count: 0, names: new Set() };
    const entry = byMonth[month];
    (ids ?? []).forEach((id) => {
      entry.count += 1;
      const text = idToText[id] || id;
      entry.names.add(text);
    });
  });
  return Object.entries(byMonth)
    .map(([month, { count, names }]) => ({ month, completed: count, names: Array.from(names).sort() }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);
}

function aggregateGoalsByMonth(goals: Goal[]): Array<{ month: string; set: number; completed: number }> {
  const setByMonth: Record<string, number> = {};
  const completedByMonth: Record<string, number> = {};
  goals.forEach((g) => {
    const createdMonth = getMonthKey(dayKeyFromTs(g.createdAt));
    setByMonth[createdMonth] = (setByMonth[createdMonth] || 0) + 1;
    if (g.completedAt) {
      const completedMonth = getMonthKey(dayKeyFromTs(g.completedAt));
      completedByMonth[completedMonth] = (completedByMonth[completedMonth] || 0) + 1;
    }
  });
  const months = new Set([...Object.keys(setByMonth), ...Object.keys(completedByMonth)]);
  return Array.from(months)
    .sort()
    .reverse()
    .slice(0, 6)
    .map((month) => ({
      month,
      set: setByMonth[month] || 0,
      completed: completedByMonth[month] || 0,
    }));
}

/** Goals by month with titles for set and completed. */
function getGoalsByMonthWithTitles(goals: Goal[]): Array<{ month: string; set: number; completed: number; completedTitles: string[] }> {
  const setByMonth: Record<string, number> = {};
  const completedByMonth: Record<string, { count: number; titles: string[] }> = {};
  goals.forEach((g) => {
    const createdMonth = getMonthKey(dayKeyFromTs(g.createdAt));
    setByMonth[createdMonth] = (setByMonth[createdMonth] || 0) + 1;
    if (g.completedAt) {
      const completedMonth = getMonthKey(dayKeyFromTs(g.completedAt));
      if (!completedByMonth[completedMonth]) completedByMonth[completedMonth] = { count: 0, titles: [] };
      completedByMonth[completedMonth].count += 1;
      completedByMonth[completedMonth].titles.push(g.title || "Untitled goal");
    }
  });
  const months = new Set([...Object.keys(setByMonth), ...Object.keys(completedByMonth)]);
  return Array.from(months)
    .sort()
    .reverse()
    .slice(0, 6)
    .map((month) => ({
      month,
      set: setByMonth[month] || 0,
      completed: completedByMonth[month]?.count ?? 0,
      completedTitles: completedByMonth[month]?.titles ?? [],
    }));
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

const PAGE_HEIGHT_MM = 297;
const FOOTER_MARGIN_MM = 20;

/** Draw text with wrapping; returns new y position. May add page if needed. */
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y > PAGE_HEIGHT_MM - FOOTER_MARGIN_MM) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

/**
 * Generate and download the session summary PDF.
 */
export function generateSessionSummaryPdf(data: SessionSummaryData): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 18;
  let y = margin;
  const lineHeight = 6;
  const sectionGap = 10;

  const checkInHistory = getCheckInHistorySync();

  // ---- Title ----
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("InnerCode – Session summary", margin, y);
  y += lineHeight;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("For use with your therapist or coach", margin, y);
  y += lineHeight;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, y);
  doc.setTextColor(0, 0, 0);
  y += lineHeight + 2;
  doc.text("This summary reflects your self-reported scores and activity in InnerCode. Share only with people you trust.", margin, y);
  y += lineHeight + sectionGap;

  // ---- Life areas ----
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Life area scores (current)", margin, y);
  y += lineHeight;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const categories = Object.keys(data.categoryScores).sort();
  if (categories.length === 0) {
    doc.text("No life areas completed yet.", margin, y);
    y += lineHeight;
  } else {
    categories.forEach((cat) => {
      const score = data.categoryScores[cat] ?? 0;
      doc.text(`${cat}: ${score}/10`, margin, y);
      y += lineHeight;
    });
  }
  y += sectionGap;

  // ---- Values ----
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Your values (ranked)", margin, y);
  y += lineHeight;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (!data.valueEntries || data.valueEntries.length === 0) {
    doc.text("No values ranked yet.", margin, y);
    y += lineHeight;
  } else {
    data.valueEntries.forEach(([value], i) => {
      doc.text(`${i + 1}. ${value}`, margin, y);
      y += lineHeight;
    });
  }
  y += sectionGap;

  // ---- Mood trend ----
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Mood trend (from journal)", margin, y);
  y += lineHeight;

  const moodByMonth = aggregateMoodByMonth(data.journalEntries);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (moodByMonth.length === 0) {
    doc.text("No mood data from journal entries yet.", margin, y);
    y += lineHeight;
  } else {
    moodByMonth.forEach((row) => {
      doc.text(
        `${formatMonthLabel(row.month)}: ${row.count} entries, average ${row.label} (${row.avg})`,
        margin,
        y
      );
      y += lineHeight;
    });
  }
  y += sectionGap;

  // ---- Sparks ----
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Daily sparks completed", margin, y);
  y += lineHeight;

  const sparkIdToText = buildSparkIdToTextMap();
  const sparksByMonthWithNames = aggregateSparksByMonthWithNames(data.sparkCompletions, sparkIdToText);
  const maxTextWidth = 210 - margin * 2;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (sparksByMonthWithNames.length === 0) {
    doc.text("No sparks completed yet.", margin, y);
    y += lineHeight;
  } else {
    for (const row of sparksByMonthWithNames) {
      doc.setFont("helvetica", "bold");
      doc.text(`${formatMonthLabel(row.month)}: ${row.completed} spark(s) completed`, margin, y);
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      if (row.names.length > 0) {
        for (const name of row.names) {
          y = drawWrappedText(doc, `• ${name}`, margin, y, maxTextWidth, lineHeight);
        }
      }
      y += 2;
    }
  }
  y += sectionGap;

  // ---- Goals ----
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Goals set vs completed", margin, y);
  y += lineHeight;

  const goalsByMonthWithTitles = getGoalsByMonthWithTitles(data.goals);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (goalsByMonthWithTitles.length === 0 && data.goals.length === 0) {
    doc.text("No goals yet.", margin, y);
    y += lineHeight;
  } else if (goalsByMonthWithTitles.length === 0) {
    const completedCount = data.goals.filter((g) => g.completedAt).length;
    doc.text(`Total: ${data.goals.length} goals, ${completedCount} completed.`, margin, y);
    y += lineHeight;
    const completedGoals = data.goals.filter((g) => g.completedAt);
    if (completedGoals.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Completed goals:", margin, y);
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      for (const g of completedGoals) {
        y = drawWrappedText(doc, `• ${g.title || "Untitled goal"}`, margin, y, maxTextWidth, lineHeight);
      }
      y += 2;
    }
  } else {
    for (const row of goalsByMonthWithTitles) {
      doc.setFont("helvetica", "bold");
      doc.text(
        `${formatMonthLabel(row.month)}: ${row.set} set, ${row.completed} completed`,
        margin,
        y
      );
      y += lineHeight;
      doc.setFont("helvetica", "normal");
      if (row.completedTitles.length > 0) {
        for (const title of row.completedTitles) {
          y = drawWrappedText(doc, `• ${title}`, margin, y, maxTextWidth, lineHeight);
        }
        y += 2;
      }
    }
  }
  y += sectionGap;

  // ---- Weekly check-ins (optional) ----
  if (checkInHistory.length > 0) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Weekly check-ins", margin, y);
    y += lineHeight;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${checkInHistory.length} check-in(s) recorded.`, margin, y);
    y += lineHeight;
    y += sectionGap;
  }

  // ---- Footer ----
  const footerY = 297 - 12; // A4 height in mm
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Generated by InnerCode. Share only with people you trust.", margin, footerY);
  doc.setTextColor(0, 0, 0);

  // Download
  const filename = `InnerCode-Session-Summary-${dayKeyFromTs(getCurrentTime())}.pdf`;
  doc.save(filename);
}
