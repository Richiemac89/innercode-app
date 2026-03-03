// Journal Analysis Utility
// NLP-lite functions for pattern detection in journal entries (Phase 3)

import { JournalEntry } from "../types";

// Stop words to exclude from analysis
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
  "be", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "must", "can", "i", "you", "we",
  "they", "my", "your", "our", "their", "this", "that", "these", "those",
  "it", "its", "me", "him", "her", "us", "them", "what", "which", "who",
  "when", "where", "why", "how", "all", "each", "every", "both", "few",
  "more", "most", "some", "such", "no", "not", "only", "own", "same",
  "so", "than", "too", "very", "just", "about", "into", "through", "during",
  "before", "after", "above", "below", "up", "down", "out", "off", "over",
  "under", "again", "further", "then", "once", "here", "there"
]);

// Negative sentiment words for pattern detection
const NEGATIVE_WORDS = new Set([
  "stressed", "overwhelmed", "anxious", "worried", "tired", "exhausted",
  "frustrated", "angry", "sad", "depressed", "lonely", "scared", "afraid",
  "confused", "lost", "stuck", "burnout", "drained", "hopeless", "helpless",
  "miserable", "unhappy", "upset", "disappointed", "struggling", "difficult",
  "hard", "tough", "challenging", "painful", "hurt", "broken", "empty",
  "worthless", "failure", "awful", "terrible", "horrible", "bad", "worst"
]);

// Positive sentiment words
const POSITIVE_WORDS = new Set([
  "happy", "excited", "grateful", "thankful", "blessed", "joy", "joyful",
  "amazing", "wonderful", "great", "good", "excellent", "fantastic", "awesome",
  "love", "loved", "loving", "peaceful", "calm", "relaxed", "content",
  "satisfied", "proud", "confident", "strong", "capable", "accomplished",
  "successful", "growth", "progress", "better", "improved", "hopeful"
]);

interface WordPattern {
  word: string;
  count: number;
  sentiment: "negative" | "neutral" | "positive";
}

/**
 * Analyze journal entries for repeated word patterns
 * Returns words mentioned multiple times with sentiment analysis
 */
export function analyzeJournalPatterns(
  entries: JournalEntry[],
  timeWindowDays: number = 7
): WordPattern[] {
  // Filter entries to time window
  const cutoffTime = Date.now() - (timeWindowDays * 24 * 60 * 60 * 1000);
  const recentEntries = entries.filter(e => e.createdAt >= cutoffTime);
  
  if (recentEntries.length === 0) return [];
  
  // Combine all text
  const allText = recentEntries.map(e => e.text).join(" ");
  
  // Get word frequencies
  const wordFrequencies = getFrequentWords(allText);
  
  // Convert to patterns with sentiment
  const patterns: WordPattern[] = [];
  
  wordFrequencies.forEach((count, word) => {
    // Only include words mentioned 3+ times
    if (count >= 3) {
      patterns.push({
        word,
        count,
        sentiment: detectSentiment(word)
      });
    }
  });
  
  // Sort by count (most frequent first)
  return patterns.sort((a, b) => b.count - a.count);
}

/**
 * Get frequent meaningful words from text (excluding stop words)
 */
export function getFrequentWords(text: string): Map<string, number> {
  // Tokenize: lowercase and extract words
  const tokens = text.toLowerCase().match(/[a-z]+/g) || [];
  
  // Count frequencies, excluding stop words
  const frequencies = new Map<string, number>();
  
  tokens.forEach(token => {
    // Skip stop words and very short words (< 4 chars)
    if (STOP_WORDS.has(token) || token.length < 4) return;
    
    const count = frequencies.get(token) || 0;
    frequencies.set(token, count + 1);
  });
  
  return frequencies;
}

/**
 * Simple sentiment detection based on word lists
 */
export function detectSentiment(word: string): "negative" | "neutral" | "positive" {
  const lowerWord = word.toLowerCase();
  
  if (NEGATIVE_WORDS.has(lowerWord)) return "negative";
  if (POSITIVE_WORDS.has(lowerWord)) return "positive";
  
  return "neutral";
}

/**
 * Get most negative pattern (if any)
 * Used for prioritizing which insight to show
 */
export function getMostNegativePattern(patterns: WordPattern[]): WordPattern | null {
  const negativePatterns = patterns.filter(p => p.sentiment === "negative");
  
  if (negativePatterns.length === 0) return null;
  
  // Return most frequent negative pattern
  return negativePatterns[0];
}







