// AI Service Abstraction Layer
// Enables seamless switch between static AI and OpenAI

import { Suggestion } from "../components/SuggestionCard";
import { StaticAIService } from "./aiProviders/staticAI";
import { OpenAIService } from "./aiProviders/openAI";
import { FEATURES } from "../constants/featureFlags";
import { JournalSnapshotEntry } from "./contextBuilders";

// User context passed to AI service
export interface UserContext {
  userName?: string;
  categoryScores: Record<string, number>;
  completedCategories: string[];
  valueEntries: [string, number][];
  conversationHistory?: Array<{ sender: "you" | "inny"; text: string }>;
  lowestCategory?: string;
  topValue?: string;
  allSuggestions?: Suggestion[];
  weakAreaSuggestions?: Suggestion[];
  valueStrengthSuggestions?: Suggestion[];
  discoveryAreaSuggestions?: Suggestion[];
  onboardingAnswers?: string[];
  journalSummary?: string;
  recentJournalEntries?: JournalSnapshotEntry[];
  goalsSummary?: string;
}

// Check-in changes summary
export interface CheckInChanges {
  improvements: Array<{ category: string; oldScore: number; newScore: number }>;
  stable: Array<{ category: string; score: number }>;
  declines: Array<{ category: string; oldScore: number; newScore: number }>;
}

// AI Service Interface
export interface AIService {
  // Chat functionality
  chat(userInput: string, context: UserContext): Promise<string>;
  chatAboutSuggestion(userInput: string, suggestion: Suggestion, context: UserContext): Promise<string>;
  
  // Check-in summaries
  generateCheckInSummary(changes: CheckInChanges, context: UserContext): Promise<string>;
  
  // Daily insights
  generateInsight(pattern: InsightPattern, context: UserContext): Promise<string>;
  
  // Future: Daily sparks suggestion
  suggestDailySparks?(context: UserContext): Promise<any[]>;
}

// Insight pattern types
export interface InsightPattern {
  type: "scoreDrop" | "neglectedCategory" | "repeatedWords" | "valueDisconnect";
  category?: string;
  oldScore?: number;
  newScore?: number;
  word?: string;
  value?: string;
}

// Factory function to get AI service
export function getAIService(): AIService {
  // Check feature flag and return appropriate service
  if (FEATURES.USE_OPENAI) {
    return new OpenAIService();
  }
  
  // Default to static AI
  return new StaticAIService();
}

// Export singleton instance
export const aiService = getAIService();

