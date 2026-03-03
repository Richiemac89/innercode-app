// Insight Detection Logic
// Detects patterns across all 3 phases

import { InsightPattern, InsightState, CheckInEntry, JournalEntry } from "../types";
import { analyzeJournalPatterns, getMostNegativePattern } from "./journalAnalysis";
import { VALUE_CATEGORY_MAP } from "../constants/values";
import { getCurrentTime } from "./helpers";

/**
 * Detect all insight patterns from user data
 * Returns patterns sorted by priority (highest first)
 */
export function detectInsightPatterns(state: InsightState): InsightPattern[] {
  const patterns: InsightPattern[] = [];
  
  // Phase 1: Score Drop Detection
  const scoreDrop = detectScoreDrop(state.categoryScores, state.checkInHistory);
  if (scoreDrop) patterns.push(scoreDrop);
  
  // Phase 2: Neglected Category Detection
  const neglected = detectNeglectedCategory(state.completedCategories, state.checkInHistory);
  if (neglected) patterns.push(neglected);
  
  // Phase 2: Value-Category Disconnect Detection
  const disconnect = detectValueDisconnect(state.categoryScores, state.valueEntries);
  if (disconnect) patterns.push(disconnect);
  
  // Phase 3: Repeated Words Detection (requires journal entries)
  if (state.journalEntries.length > 0) {
    const repeatedWords = detectRepeatedWords(state.journalEntries);
    if (repeatedWords) patterns.push(repeatedWords);
  }
  
  // Sort by priority and return
  return patterns.sort((a, b) => 
    calculateInsightPriority(b) - calculateInsightPriority(a)
  );
}

/**
 * Phase 1: Detect significant score drops
 * Looks at last check-in vs current scores
 */
function detectScoreDrop(
  categoryScores: Record<string, number>,
  checkInHistory: CheckInEntry[]
): InsightPattern | null {
  if (checkInHistory.length === 0) return null;
  
  const lastCheckIn = checkInHistory[checkInHistory.length - 1];
  const lastScores = getScoresFromCheckIn(lastCheckIn);
  
  // Find categories with drops of 2+ points
  for (const [category, currentScore] of Object.entries(categoryScores)) {
    const lastScore = lastScores[category];
    
    if (lastScore !== undefined && lastScore - currentScore >= 2) {
      return {
        type: "scoreDrop",
        category,
        oldScore: lastScore,
        newScore: currentScore
      };
    }
  }
  
  return null;
}

/**
 * Phase 2: Detect neglected categories
 * Finds categories not checked in 14+ days
 */
function detectNeglectedCategory(
  completedCategories: string[],
  checkInHistory: CheckInEntry[]
): InsightPattern | null {
  if (checkInHistory.length === 0) return null;
  if (completedCategories.length === 0) return null;
  
  const lastCheckDates = getLastCheckDatesByCategory(checkInHistory, completedCategories);
  const now = getCurrentTime();
  const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
  
  // Find first category that hasn't been checked in 14+ days
  for (const category of completedCategories) {
    const lastCheckDate = lastCheckDates[category];
    
    // If never checked, or checked more than 14 days ago
    if (!lastCheckDate || lastCheckDate < fourteenDaysAgo) {
      return {
        type: "neglectedCategory",
        category
      };
    }
  }
  
  return null;
}

/**
 * Phase 2: Detect value-category disconnect
 * Finds when top values don't align with life area scores
 */
function detectValueDisconnect(
  categoryScores: Record<string, number>,
  valueEntries: [string, number][]
): InsightPattern | null {
  if (valueEntries.length === 0) return null;
  
  // Get top 3 values
  const topValues = valueEntries.slice(0, 3).map(([value]) => value);
  
  // Check each top value for disconnect
  for (const value of topValues) {
    const relatedCategories = VALUE_CATEGORY_MAP[value] || [];
    
    for (const category of relatedCategories) {
      const score = categoryScores[category];
      
      // If category exists and is low-scoring (≤ 4)
      if (score !== undefined && score <= 4) {
        return {
          type: "valueDisconnect",
          value,
          category
        };
      }
    }
  }
  
  return null;
}

/**
 * Phase 3: Detect repeated words in journals
 * Finds negative patterns in journal text
 */
function detectRepeatedWords(journalEntries: JournalEntry[]): InsightPattern | null {
  const patterns = analyzeJournalPatterns(journalEntries, 7); // Last 7 days
  const negativePattern = getMostNegativePattern(patterns);
  
  if (negativePattern) {
    return {
      type: "repeatedWords",
      word: negativePattern.word
    };
  }
  
  return null;
}

/**
 * Calculate priority score for insights
 * Higher score = shown first
 */
function calculateInsightPriority(pattern: InsightPattern): number {
  switch (pattern.type) {
    case "scoreDrop":
      // Highest priority - immediate, actionable
      return 100 + (pattern.oldScore || 0) - (pattern.newScore || 0); // Bigger drops = higher priority
    
    case "valueDisconnect":
      // High priority - important misalignment
      return 80 + (5 - (pattern.oldScore || 5)); // Lower scores = higher priority
    
    case "repeatedWords":
      // Medium-high priority - emotional pattern
      return 60;
    
    case "neglectedCategory":
      // Medium priority - gentle reminder
      return 40;
    
    default:
      return 0;
  }
}

/**
 * Helper: Get scores from a check-in entry
 */
function getScoresFromCheckIn(checkIn: CheckInEntry): Record<string, number> {
  const scores: Record<string, number> = {};
  
  checkIn.ratings.forEach(rating => {
    scores[rating.category] = rating.newScore;
  });
  
  return scores;
}

/**
 * Helper: Get last check date for each category
 */
function getLastCheckDatesByCategory(
  checkInHistory: CheckInEntry[],
  completedCategories: string[]
): Record<string, number> {
  const lastDates: Record<string, number> = {};
  
  // Initialize all categories
  completedCategories.forEach(cat => {
    lastDates[cat] = 0;
  });
  
  // Find most recent check-in for each category
  checkInHistory.forEach(checkIn => {
    checkIn.ratings.forEach(rating => {
      if (lastDates[rating.category] === undefined || checkIn.timestamp > lastDates[rating.category]) {
        lastDates[rating.category] = checkIn.timestamp;
      }
    });
  });
  
  return lastDates;
}

/**
 * Get human-readable description of pattern
 * (For debugging/testing purposes)
 */
export function getPatternDescription(pattern: InsightPattern): string {
  switch (pattern.type) {
    case "scoreDrop":
      return `${pattern.category} score dropped from ${pattern.oldScore} to ${pattern.newScore}`;
    
    case "neglectedCategory":
      return `${pattern.category} hasn't been checked in 14+ days`;
    
    case "valueDisconnect":
      return `Value "${pattern.value}" disconnects with low ${pattern.category} score`;
    
    case "repeatedWords":
      return `Repeated word "${pattern.word}" in recent journals`;
    
    default:
      return "Unknown pattern";
  }
}

