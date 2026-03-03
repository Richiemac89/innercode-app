// Insight Storage & Caching
// Manages insight generation, caching, and dismissal

import { DailyInsight, InsightState, InsightPattern } from "../types";
import { detectInsightPatterns } from "./insightDetection";
import { aiService } from "./aiService";
import { dayKeyFromTs, getCurrentTime, safeGetItem, safeSetItem } from "./helpers";
import {
  loadDailyInsightsFromSupabase,
  upsertDailyInsightToSupabase,
  updateDailyInsightStatusInSupabase,
} from "../lib/supabaseData";

const STORAGE_KEY = "innercode_daily_insights";
let remoteInsightsLoaded = false;
let remoteInsightsCache: DailyInsight[] = [];

/**
 * Get today's insight (cached for 24 hours)
 * Returns null if no patterns detected or already dismissed
 */
export async function getTodaysInsight(state: InsightState): Promise<DailyInsight | null> {
  const today = dayKeyFromTs(getCurrentTime());
  
  // Check cache first
  const cached = getCachedInsight(today);
  if (cached) {
    return cached;
  }

  // Try remote cache (Supabase)
  const remoteInsight = await getRemoteInsightForDate(today);
  if (remoteInsight) {
    return remoteInsight;
  }
  
  // Detect patterns
  const patterns = detectInsightPatterns(state);
  
  if (patterns.length === 0) {
    return null; // No patterns detected
  }
  
  // Get highest priority pattern
  const pattern = patterns[0];
  
  // Generate AI insight
  const insightText = await generateInsightText(pattern, state);
  
  // Create insight object
  const insight: DailyInsight = {
    id: `insight-${today}-${pattern.type}`,
    date: today,
    pattern,
    text: insightText,
    dismissed: false,
    timestamp: getCurrentTime(),
    interacted: false
  };
  
  // Cache it
  cacheInsight(insight);
  
  return insight;
}

/**
 * Generate AI insight text from pattern
 */
async function generateInsightText(pattern: InsightPattern, state: InsightState): Promise<string> {
  try {
    const context = {
      userName: "", // Can be passed from state if available
      categoryScores: state.categoryScores,
      completedCategories: state.completedCategories,
      valueEntries: state.valueEntries,
      onboardingAnswers: state.onboardingAnswers,
      journalSummary: state.journalSummary,
      recentJournalEntries: state.recentJournalEntries,
    };
    
    const text = await aiService.generateInsight(pattern, context);
    return text;
  } catch (error) {
    console.error("Failed to generate AI insight:", error);
    // Fallback to static insight
    return getStaticInsight(pattern);
  }
}

/**
 * Static fallback insights (if AI fails)
 */
function getStaticInsight(pattern: InsightPattern): string {
  switch (pattern.type) {
    case "scoreDrop":
      return `I noticed your ${pattern.category} score dropped from ${pattern.oldScore} to ${pattern.newScore}. Sometimes life gets busy and areas slip. Want to chat about what changed? 💙`;
    
    case "neglectedCategory":
      return `It's been over 2 weeks since we checked in on ${pattern.category}. Sometimes we neglect what matters when life gets busy. How's that area feeling? 💭`;
    
    case "valueDisconnect":
      return `${pattern.value} is one of your top values, but your ${pattern.category} score is quite low. There might be a disconnect worth exploring. Want to chat about it? 🤔`;
    
    case "repeatedWords":
      return `I noticed you've mentioned "${pattern.word}" several times in your journal this week. Patterns like this often reveal something important. Want to explore this together? 💬`;
    
    default:
      return "I noticed something interesting in your patterns. Want to explore it together? 💡";
  }
}

/**
 * Mark insight as dismissed
 */
export function dismissInsight(insightId: string): void {
  const storage = getInsightStorage();
  const insight = storage.insights.find(i => i.id === insightId);
  
  if (insight) {
    insight.dismissed = true;
    saveInsightStorage(storage);
    updateRemoteCache(insight);
    void updateDailyInsightStatusInSupabase(insightId, { dismissed: true });
  }
}

/**
 * Mark insight as interacted (user clicked "Talk About This")
 */
export function markInsightInteracted(insightId: string): void {
  const storage = getInsightStorage();
  const insight = storage.insights.find(i => i.id === insightId);
  
  if (insight) {
    insight.interacted = true;
    saveInsightStorage(storage);
    updateRemoteCache(insight);
    void updateDailyInsightStatusInSupabase(insightId, { interacted: true });
  }
}

/**
 * Check if user has seen (non-dismissed) insight today
 */
export function hasSeenInsightToday(): boolean {
  const today = dayKeyFromTs(getCurrentTime());
  const cached = getCachedInsight(today);
  
  return cached !== null && !cached.dismissed;
}

/**
 * Get cached insight for a specific date
 */
function getCachedInsight(date: string): DailyInsight | null {
  const storage = getInsightStorage();
  const insight = storage.insights.find(i => i.date === date);
  
  return insight || null;
}

/**
 * Cache an insight
 */
function cacheInsight(insight: DailyInsight, options: { skipRemote?: boolean } = {}): void {
  const storage = getInsightStorage();
  
  // Remove any existing insight for this date
  storage.insights = storage.insights.filter(i => i.date !== insight.date);
  
  // Add new insight
  storage.insights.push(insight);
  
  // Clean up old insights (keep last 30 days)
  cleanupOldInsights(storage);
  
  saveInsightStorage(storage);

  updateRemoteCache(insight);

  if (!options.skipRemote) {
    void upsertDailyInsightToSupabase(insight).catch((error) => {
      console.error("Failed to sync daily insight to Supabase:", error);
    });
  }
}

async function getRemoteInsightForDate(date: string): Promise<DailyInsight | null> {
  const insights = await loadRemoteInsightsOnce();
  const match = insights.find((insight) => insight.date === date);

  if (match) {
    cacheInsight(match, { skipRemote: true });
    return match;
  }

  return null;
}

async function loadRemoteInsightsOnce(): Promise<DailyInsight[]> {
  if (remoteInsightsLoaded) {
    return remoteInsightsCache;
  }

  try {
    const insights = await loadDailyInsightsFromSupabase();
    remoteInsightsLoaded = true;
    remoteInsightsCache = insights.slice();
    mergeRemoteInsights(insights);
    return remoteInsightsCache;
  } catch (error) {
    console.error("Failed to load daily insights from Supabase:", error);
    remoteInsightsLoaded = true;
    remoteInsightsCache = [];
    return remoteInsightsCache;
  }
}

function mergeRemoteInsights(insights: DailyInsight[]): void {
  if (!insights.length) {
    return;
  }

  const storage = getInsightStorage();

  insights.forEach((insight) => {
    storage.insights = storage.insights.filter((i) => i.date !== insight.date);
    storage.insights.push(insight);
  });

  cleanupOldInsights(storage);
  saveInsightStorage(storage);
}

function updateRemoteCache(insight: DailyInsight): void {
  if (!remoteInsightsLoaded) {
    return;
  }

  remoteInsightsCache = remoteInsightsCache.filter((item) => item.id !== insight.id);
  remoteInsightsCache.push(insight);
}

/**
 * Get insight storage from localStorage
 */
function getInsightStorage(): InsightStorage {
  try {
    const saved = safeGetItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Failed to read insight storage:", error);
  }
  
  return { insights: [] };
}

/**
 * Save insight storage to localStorage
 */
function saveInsightStorage(storage: InsightStorage): void {
  try {
    safeSetItem(STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save insight storage:", error);
  }
}

/**
 * Clean up insights older than 30 days
 */
function cleanupOldInsights(storage: InsightStorage): void {
  const thirtyDaysAgo = getCurrentTime() - (30 * 24 * 60 * 60 * 1000);
  storage.insights = storage.insights.filter(i => i.timestamp >= thirtyDaysAgo);
}

/**
 * Get insight engagement stats (for analytics)
 */
export function getInsightStats(): {
  totalGenerated: number;
  totalDismissed: number;
  totalInteracted: number;
  interactionRate: number;
} {
  const storage = getInsightStorage();
  const insights = storage.insights;
  
  const totalGenerated = insights.length;
  const totalDismissed = insights.filter(i => i.dismissed).length;
  const totalInteracted = insights.filter(i => i.interacted).length;
  const interactionRate = totalGenerated > 0 ? totalInteracted / totalGenerated : 0;
  
  return {
    totalGenerated,
    totalDismissed,
    totalInteracted,
    interactionRate
  };
}

// Storage interface
interface InsightStorage {
  insights: DailyInsight[];
}

