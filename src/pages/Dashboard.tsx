import { useEffect, useState, useCallback, useMemo } from "react";
import { JournalEntry, DailyInsight as DailyInsightType, Goal } from "../types";
import { dayKeyFromTs, getCurrentTime } from "../utils/helpers";
import { safeGetItem, safeSetItem, safeRemoveItem } from "../utils/helpers";
import { useResetZoom } from "../utils/useResetZoom";
import { WeeklyCheckInBanner } from "../components/WeeklyCheckInBanner";
import { DailySparks } from "../components/DailySparks";
import { DailyInsight } from "../components/DailyInsight";
import { FEATURES } from "../constants/featureFlags";
import { getCheckInHistorySync, shouldShowCheckIn } from "../utils/checkInLogic";
import { getTodaysSparks } from "../utils/sparkSelection";
import { getTodaysInsight, dismissInsight, markInsightInteracted } from "../utils/insightStorage";
import { MicroAction } from "../constants/microActions";
import { isDebugMode, getDebugInfo } from "../utils/timeDebug";
import { JournalSnapshotEntry } from "../utils/contextBuilders";
import { devLog } from "../utils/devLog";

interface DashboardProps {
  onViewResults: () => void;
  onJournal: (slot?: 'morning' | 'evening') => void;
  onAICoach?: () => void;
  onHowItWorks?: () => void;
  onHowToUseInny?: () => void;
  onContinueOnboarding?: () => void;
  onExpandCategories?: () => void;
  onStartCheckIn?: () => void;
  journalEntries: JournalEntry[];
  categoryScores: Record<string, number>;
  completedCategories: string[];
  totalCategories: number;
  valueEntries?: [string, number][];
  hasPartialOnboarding?: boolean;
  hasCompletedOnboarding?: boolean;
  hasIncompleteCategories?: boolean;
  userName?: string;
  userId?: string;
  onboardingAnswers?: string[];
  journalSummary?: string;
  recentJournalEntries?: JournalSnapshotEntry[];
  sparkCompletions?: Record<string, string[]>;
  onSparkCompletionsPersist?: (completions: Record<string, string[]>) => void | Promise<void>;
  goals?: Goal[];
  goalsUnlocked?: boolean;
  onViewGoals?: () => void;
}

function calculateStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const daysWithEntries = new Set(
    entries.map((e) => dayKeyFromTs(e.createdAt))
  );
  const now = getCurrentTime();
  const todayKey = dayKeyFromTs(now);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);

  // If user has journaled today: count including today. If not: show yesterday's streak so they never see 0 until they've missed a full day.
  const startFrom = daysWithEntries.has(todayKey) ? new Date(todayStart) : new Date(yesterdayStart);
  let streak = 0;
  let currentDate = new Date(startFrom);

  while (daysWithEntries.has(dayKeyFromTs(currentDate.getTime()))) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  return streak;
}

function getLastJournalDate(entries: JournalEntry[]): string {
  if (entries.length === 0) return "Never";
  const latest = entries[0];
  const date = new Date(latest.createdAt);
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

/** Calendar icon showing today's date (day of month). Uses getCurrentTime() so debug time is respected. */
function CalendarIconWithToday() {
  const day = new Date(getCurrentTime()).getDate();
  const size = 32;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Calendar, today is the ${day}`}
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {/* Calendar page */}
      <rect x="5" y="10" width="22" height="18" rx="2" fill="#fff" stroke="#d1d5db" strokeWidth="1.2" />
      {/* Top binding */}
      <rect x="5" y="6" width="22" height="6" rx="1.5" fill="#9ca3af" />
      <rect x="7" y="8" width="18" height="2.5" rx="0.5" fill="#6b7280" />
      {/* Day number */}
      <text
        x="16"
        y="24"
        textAnchor="middle"
        fill="#374151"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {day}
      </text>
    </svg>
  );
}

function calculateAverageMood(entries: JournalEntry[]): { score: number; emoji: string } {
  const moodScores: Record<string, number> = {
    "😭": 1,
    "☹️": 2,
    "😐": 3,
    "🙂": 4,
    "😄": 5,
    "😡": 2,
  };

  function getMoodScore(mood: string | undefined): number {
    if (!mood) return 3;
    return moodScores[mood] || 3;
  }

  // Same as MoodTrends: last 7 calendar days, one score per day (average of that day's entries)
  const today = new Date();
  const dayScores: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const dayKey = dayKeyFromTs(date.getTime());
    const dayEntries = entries.filter((e) => dayKeyFromTs(e.createdAt) === dayKey);
    const morningEntry = dayEntries.find((e) => e.slot === "morning");
    const eveningEntry = dayEntries.find((e) => e.slot === "evening" || e.slot == null);

    const scores: number[] = [];
    if (morningEntry?.mood) scores.push(getMoodScore(morningEntry.mood));
    if (eveningEntry?.mood) scores.push(getMoodScore(eveningEntry.mood));
    const dayScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    if (dayScore > 0) dayScores.push(dayScore);
  }

  if (dayScores.length === 0) return { score: 0, emoji: "😐" };
  const avgScore = dayScores.reduce((a, b) => a + b, 0) / dayScores.length;

  let emoji = "😐";
  if (avgScore >= 4.5) emoji = "😄";
  else if (avgScore >= 3.5) emoji = "🙂";
  else if (avgScore >= 2.5) emoji = "😐";
  else if (avgScore >= 1.5) emoji = "☹️";
  else emoji = "😭";

  return { score: avgScore, emoji };
}

export function Dashboard({
  onViewResults,
  onJournal,
  onAICoach,
  onHowItWorks,
  onHowToUseInny,
  onContinueOnboarding,
  onExpandCategories,
  onStartCheckIn,
  journalEntries,
  categoryScores,
  completedCategories,
  totalCategories,
  valueEntries = [],
  hasPartialOnboarding = false,
  hasCompletedOnboarding = true,
  hasIncompleteCategories = false,
  userName,
  userId,
  onboardingAnswers = [],
  journalSummary = "",
  recentJournalEntries = [],
  sparkCompletions,
  onSparkCompletionsPersist,
  goals = [],
  goalsUnlocked = false,
  onViewGoals,
}: DashboardProps) {
  // Reset zoom and scroll to top when component mounts
  useResetZoom();
  
  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState<'lifeAreas' | 'mood' | 'streak' | null>(null);
  
  // Daily Sparks state
  const readSparkCompletionsFromLocal = useCallback((): Record<string, string[]> => {
    try {
      const saved = safeGetItem("innercode_daily_actions");
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.error("Failed to read spark completions:", error);
      return {};
    }
  }, []);

  // CRITICAL FIX: Initialize sparkCompletionMap from localStorage immediately
  // This ensures sparks are available even if prop is temporarily empty during navigation
  const [sparkCompletionMap, setSparkCompletionMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = safeGetItem("innercode_daily_actions");
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.error("Failed to read spark completions on init:", error);
      return {};
    }
  });

  // CRITICAL FIX: Initialize completedSparkIds from localStorage immediately
  const [completedSparkIds, setCompletedSparkIds] = useState<string[]>(() => {
    try {
      const saved = safeGetItem("innercode_daily_actions");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        const today = dayKeyFromTs(getCurrentTime());
        return parsed[today] ?? [];
      }
      return [];
    } catch (error) {
      return [];
    }
  });

  // CRITICAL FIX: sparkMapLoading must be declared BEFORE useEffect hooks to maintain hook order
  const [sparkMapLoading, setSparkMapLoading] = useState(true);

  // Daily Insight state - moved here to ensure all useState hooks come before useEffect/useMemo
  const [todaysInsight, setTodaysInsight] = useState<DailyInsightType | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  // Quote rotation state - moved here to ensure all useState hooks come before useEffect/useMemo
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [journalExpanded, setJournalExpanded] = useState(false);

  useEffect(() => {
    // ALWAYS load from localStorage first (source of truth)
    const localMap = readSparkCompletionsFromLocal();
    
    // If localStorage has data, use it (even if prop is empty)
    if (Object.keys(localMap).length > 0) {
      setSparkCompletionMap(localMap);
      const today = dayKeyFromTs(getCurrentTime());
      setCompletedSparkIds(localMap[today] ?? []);
      setSparkMapLoading(false);
      
      // If prop also has data, merge them (prop takes precedence for conflicts)
      if (sparkCompletions && Object.keys(sparkCompletions).length > 0) {
        const merged = { ...localMap, ...sparkCompletions };
        setSparkCompletionMap(merged);
        const todayCompletions = merged[today] ?? [];
        setCompletedSparkIds(todayCompletions);
        safeSetItem("innercode_daily_actions", JSON.stringify(merged));
      }
      return;
    }
    
    // If localStorage is empty but prop has data, use prop
    if (sparkCompletions && Object.keys(sparkCompletions).length > 0) {
      setSparkCompletionMap(sparkCompletions);
      const today = dayKeyFromTs(getCurrentTime());
      setCompletedSparkIds(sparkCompletions[today] ?? []);
      safeSetItem("innercode_daily_actions", JSON.stringify(sparkCompletions));
      setSparkMapLoading(false);
      return;
    }
    
    // Both are empty - preserve existing state, don't clear it
    // This prevents clearing sparks when navigating back if they were already loaded
    if (Object.keys(sparkCompletionMap).length > 0) {
      // State already has data (from initialization), keep it
      setSparkMapLoading(false);
      return;
    }
    
    // Both are empty and state is empty - mark loading as complete
    // getTodaysSparks will generate sparks even with empty completion map
    if (sparkMapLoading) {
      setSparkMapLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparkCompletions]); // readSparkCompletionsFromLocal is stable (useCallback with empty deps), safe to omit

  // CRITICAL FIX: Sync completedSparkIds when sparkCompletionMap changes
  // Ensure completed sparks show correctly until the day passes
  useEffect(() => {
    const today = dayKeyFromTs(getCurrentTime());
    const todayCompletions = sparkCompletionMap[today] ?? [];
    // Only update if different to avoid unnecessary re-renders, but ensure it's always in sync
    if (JSON.stringify(todayCompletions.sort()) !== JSON.stringify(completedSparkIds.sort())) {
      setCompletedSparkIds(todayCompletions);
    }
  }, [sparkCompletionMap, completedSparkIds]);

  const todayKey = dayKeyFromTs(getCurrentTime());
  const hasSparkMapHydrated = useMemo(
    () => !sparkMapLoading,
    [sparkMapLoading]
  );

  const todaysSparks = useMemo(() => {
    // Check if user has any onboarding progress
    const hasAnyProgress = hasCompletedOnboarding || 
                           completedCategories.length > 0 || 
                           Object.keys(sparkCompletionMap).length > 0;
    
    if (
      !hasAnyProgress ||
      !hasSparkMapHydrated
    ) {
      return [];
    }

    const completedIdsForToday = sparkCompletionMap[todayKey] ?? [];

    return getTodaysSparks(
      {
        categoryScores,
        completedCategories,
        valueEntries,
      },
      {
        seed: userId ?? "default",
        completedSparkIds: completedIdsForToday,
      }
    );
  }, [
    hasCompletedOnboarding,
    completedCategories,
    valueEntries,
    categoryScores,
    sparkCompletionMap,
    todayKey,
    userId,
    hasSparkMapHydrated,  // CRITICAL: Add this dependency so it recalculates when loading completes
  ]);
  
  // Debug logging to track spark loading state
  useEffect(() => {
    devLog.log('Spark loading state:', {
      hasCompletedOnboarding,
      completedCategoriesCount: completedCategories.length,
      sparkMapKeys: Object.keys(sparkCompletionMap).length,
      sparkMapLoading,
      hasSparkMapHydrated,
      todaysSparksCount: todaysSparks.length,
      todayKey,
      completedIdsForToday: sparkCompletionMap[todayKey]?.length || 0,
    });
  }, [hasCompletedOnboarding, completedCategories, sparkCompletionMap, sparkMapLoading, hasSparkMapHydrated, todaysSparks, todayKey]);
  
  // Load today's insight on mount
  useEffect(() => {
    if (!hasCompletedOnboarding || !FEATURES.DAILY_INSIGHTS || completedCategories.length === 0) {
      return;
    }
    
    setInsightLoading(true);
    getTodaysInsight({
      categoryScores,
      completedCategories,
      valueEntries,
      checkInHistory: getCheckInHistorySync(),
      journalEntries,
      onboardingAnswers,
      journalSummary,
      recentJournalEntries,
    }).then(insight => {
      setTodaysInsight(insight);
      setInsightLoading(false);
    }).catch(error => {
      console.error("Failed to load insight:", error);
      setInsightLoading(false);
    });
  }, [hasCompletedOnboarding, completedCategories.length, categoryScores, valueEntries, journalEntries, onboardingAnswers, journalSummary, recentJournalEntries]);

  const quotes = [
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
    { text: "He who knows others is wise; he who knows himself is enlightened.", author: "Lao Tzu" },
    { text: "The privilege of a lifetime is to become who you truly are.", author: "Carl Jung" },
    { text: "You have power over your mind - not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
    { text: "The only journey is the one within.", author: "Rainer Maria Rilke" },
    { text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu" },
    { text: "The curious paradox is that when I accept myself just as I am, then I can change.", author: "Carl Rogers" },
  ];

  // Auto-rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 8000);
    
    return () => clearInterval(interval);
  }, [quotes.length]);

  const streak = calculateStreak(journalEntries);
  const lastJournal = getLastJournalDate(journalEntries);
  const totalEntries = journalEntries.length;
  const { score: avgMoodScore, emoji: moodEmoji } = calculateAverageMood(journalEntries);
  
  // Calculate average category score
  const scores = Object.values(categoryScores);
  const avgScore = scores.length > 0 
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : "0";

  // Get current greeting
  const hour = new Date().getHours();
  const greeting = 
    hour < 12 ? "Good morning" :
    hour < 18 ? "Good afternoon" :
    "Good evening";

  // Streak card tier for 10/20/30+ consecutive days (illuminating colors)
  const streakTier = streak >= 30 ? "fire" : streak >= 20 ? "hot" : streak >= 10 ? "warm" : "normal";
  const streakCardStyle: Record<string, { background: string; border: string; boxShadow: string }> = {
    normal: { background: "rgba(255,255,255,0.9)", border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
    warm: { background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "2px solid #f59e0b", boxShadow: "0 4px 12px rgba(245,158,11,0.25)" },
    hot: { background: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)", border: "2px solid #ea580c", boxShadow: "0 4px 16px rgba(234,88,12,0.3)" },
    fire: { background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)", border: "2px solid #c2410c", boxShadow: "0 6px 20px rgba(194,65,12,0.35)" },
  };
  const streakCardTierStyles = streakCardStyle[streakTier];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
        padding: 20,
      }}
    >
      {/* Debug Mode Indicator */}
      {isDebugMode() && (
        <div
          style={{
            position: "fixed",
            top: 70,
            right: 16,
            background: "rgba(251, 146, 60, 0.95)",
            color: "white",
            padding: "6px 12px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          🧪 Debug Mode: {getDebugInfo().offsetDays}d ahead
        </div>
      )}
      
      <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: "70px" }}>
        {/* Welcome Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>👋</div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: "#3b3b3b",
            }}
          >
            {greeting}{userName ? `, ${userName}` : ''}!
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: 16, marginTop: 8 }}>
            Welcome back to your journey
          </p>
        </div>

        {/* Motivational Quote Carousel */}
        <div
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            background: "rgba(255,255,255,0.9)",
            border: "2px solid rgba(106, 58, 191, 0.2)",
            borderRadius: 16,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            minHeight: "110px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            key={currentQuoteIndex}
            style={{
              animation: "slideUpFade 0.6s ease-out",
            }}
          >
            <div style={{ fontSize: 14, color: "#4b4b4b", fontStyle: "italic", lineHeight: 1.5 }}>
              "{quotes[currentQuoteIndex].text}"
            </div>
            <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 8 }}>
              — {quotes[currentQuoteIndex].author}
            </div>
          </div>
        </div>

        {/* CSS Animation */}
        <style>{`
          @keyframes slideUpFade {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Category Progress Card */}
        {hasCompletedOnboarding && completedCategories.length < totalCategories && onExpandCategories && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.25))",
              border: "2px solid #8B5CF6",
              padding: "14px 20px",
              borderRadius: 16,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            {/* Header with emoji and title on same line */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>🌟</span>
              <strong style={{ color: "#5b21b6", fontSize: 16, whiteSpace: "nowrap" }}>
                Explore More Life Areas
              </strong>
            </div>
            
            {/* Centered Button */}
            <button
              onClick={onExpandCategories}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 15,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                marginBottom: 10,
              }}
            >
              ➕ Add More Areas
            </button>
            
            {/* Description text and progress bar */}
            <div style={{ color: "#6d28d9", fontSize: 13, marginBottom: 10 }}>
              You've explored {completedCategories.length} of {totalCategories} areas. Add more for deeper insights!
            </div>
            <div
              style={{
                width: "100%",
                maxWidth: "300px",
                margin: "0 auto",
                height: 6,
                background: "rgba(139,92,246,0.2)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #8B5CF6, #7C3AED)",
                  width: `${(completedCategories.length / totalCategories) * 100}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* 👇 WEEKLY CHECK-IN FEATURE START */}
        {FEATURES.WEEKLY_CHECKIN && hasCompletedOnboarding && onStartCheckIn && completedCategories.length > 0 && shouldShowCheckIn(getCheckInHistorySync()) && (
          <WeeklyCheckInBanner
            onStartCheckIn={onStartCheckIn}
            areaCount={completedCategories.length}
          />
        )}
        {/* 👆 WEEKLY CHECK-IN FEATURE END */}

        {/* 👇 DAILY SPARKS FEATURE START */}
        {FEATURES.DAILY_SPARKS && hasCompletedOnboarding && todaysSparks.length > 0 && (
          <DailySparks
            sparks={todaysSparks}
            completedSparkIds={completedSparkIds}
            onSparkComplete={(sparkId) => {
              const todayKey = dayKeyFromTs(getCurrentTime());
              
              // CRITICAL FIX: Check if already completed BEFORE processing
              setSparkCompletionMap((prev) => {
                const existing = new Set(prev[todayKey] ?? []);
                
                // If already completed, don't do anything
                if (existing.has(sparkId)) {
                  return prev;
                }
                
                // Add to completions
                existing.add(sparkId);
                const next = { ...prev, [todayKey]: Array.from(existing) };

                safeSetItem("innercode_daily_actions", JSON.stringify(next));
                
                // Update completedSparkIds immediately
                setCompletedSparkIds(Array.from(existing));
                
                void onSparkCompletionsPersist?.(next);
                return next;
              });
            }}
          />
        )}
        {/* 👆 DAILY SPARKS FEATURE END */}

        {/* 👇 DAILY INSIGHTS FEATURE START */}
        {FEATURES.DAILY_INSIGHTS && hasCompletedOnboarding && todaysInsight && !todaysInsight.dismissed && (
          <DailyInsight
            insight={todaysInsight}
            onTalkAboutIt={(context) => {
              // Mark as interacted
              markInsightInteracted(todaysInsight.id);
              setTodaysInsight({ ...todaysInsight, interacted: true });
              // Navigate to AI Coach
              if (onAICoach) {
                onAICoach();
              }
            }}
            onDismiss={() => {
              dismissInsight(todaysInsight.id);
              setTodaysInsight(null);
            }}
          />
        )}
        {/* 👆 DAILY INSIGHTS FEATURE END */}

        {/* Partial Onboarding Banner - shows for incomplete initial onboarding OR incomplete category expansion */}
        {(hasPartialOnboarding || hasIncompleteCategories) && onContinueOnboarding && (
          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "2px solid #f59e0b",
              padding: "16px 20px",
              borderRadius: 16,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ color: "#92400e", display: "block", marginBottom: 4 }}>
                ⏸️ You have an incomplete assessment
              </strong>
              <div style={{ color: "#78350f", fontSize: 14 }}>
                Pick up where you left off to get your personalized results!
              </div>
            </div>
            <button
              onClick={onContinueOnboarding}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "none",
                background: "#92400e",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 16,
                whiteSpace: "nowrap",
              }}
            >
              ▶️ Continue
            </button>
          </div>
        )}

        {/* Empty State for Non-Onboarded Users */}
        {!hasCompletedOnboarding && !hasPartialOnboarding && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
              border: "2px dashed #8B5CF6",
              borderRadius: 20,
              padding: "40px 24px",
              textAlign: "center",
              marginBottom: 28,
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌟</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 24, color: "#3b3b3b" }}>
              Ready to unlock your full InnerCode?
            </h2>
            <p style={{ color: "#6b6b6b", marginBottom: 24, fontSize: 16 }}>
              Complete the assessment to tie your values, life areas, journaling, and check-ins to your AI coach Inny.
            </p>
            <button
              onClick={() => onHowItWorks?.()}
              style={{
                padding: "16px 32px",
                borderRadius: 16,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(124,58,237,0.35)",
              }}
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Streak Card */}
          <div
            style={{
              position: "relative",
              ...streakCardTierStyles,
              borderRadius: 16,
              padding: "20px 16px",
              textAlign: "center",
              opacity: !hasCompletedOnboarding ? 0.6 : 1,
            }}
          >
            {/* Fire emoji in corner when streak is 5+ (top-left so info button stays top-right) */}
            {hasCompletedOnboarding && streak >= 5 && (
              <span
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  fontSize: 20,
                  lineHeight: 1,
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
                }}
                aria-hidden
              >
                🔥
              </span>
            )}
            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoModal('streak');
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(139,92,246,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ℹ️
            </button>
            <div style={{ fontSize: 32, marginBottom: 4 }}>
              <CalendarIconWithToday />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>
              {hasCompletedOnboarding ? streak : "-"}
            </div>
            <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
              Day Streak
            </div>
          </div>

          {/* Total Entries Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: "20px 16px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              opacity: !hasCompletedOnboarding ? 0.6 : 1,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 4 }}>📓</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>
              {hasCompletedOnboarding ? totalEntries : "-"}
            </div>
            <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
              Entries
            </div>
          </div>

          {/* Average Life Areas Score Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: "20px 16px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              opacity: !hasCompletedOnboarding ? 0.6 : 1,
              position: "relative",
            }}
          >
            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoModal('lifeAreas');
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(139,92,246,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ℹ️
            </button>
            
            <div style={{ fontSize: 32, marginBottom: 4 }}>⭐</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>
              {hasCompletedOnboarding ? avgScore : "-"}
            </div>
            <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
              Life Areas Avg
            </div>
          </div>

          {/* Average Mood Card */}
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: "20px 16px",
              textAlign: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: hasCompletedOnboarding && avgMoodScore > 0 
                ? avgMoodScore >= 4 
                  ? "2px solid #10b981" 
                  : avgMoodScore >= 3 
                  ? "1px solid #f59e0b" 
                  : "1px solid #ef4444"
                : "1px solid #e5e7eb",
              opacity: !hasCompletedOnboarding ? 0.6 : 1,
              position: "relative",
            }}
          >
            {/* Info Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInfoModal('mood');
              }}
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                background: "rgba(139,92,246,0.1)",
                border: "none",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 12,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ℹ️
            </button>
            
            <div style={{ fontSize: 32, marginBottom: 4 }}>
              {hasCompletedOnboarding ? moodEmoji : "😐"}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>
              {hasCompletedOnboarding && avgMoodScore > 0 
                ? avgMoodScore.toFixed(1) 
                : "-"}
            </div>
            <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
              Mood (7 days)
            </div>
          </div>
        </div>

        {/* Streak Message */}
        {streak >= 3 && (
          <div
            className="fadeInUp"
            style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "2px solid #f59e0b",
              padding: "14px 18px",
              borderRadius: 16,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <strong style={{ color: "#92400e" }}>
              🔥 Amazing! You're on a {streak}-day streak! Keep it going!
            </strong>
          </div>
        )}

        {/* 👇 GOALS WIDGET - when unlocked and user has goals (above Last journal entry) */}
        {goalsUnlocked && goals.length > 0 && onViewGoals && (
          <button
            type="button"
            onClick={onViewGoals}
            style={{
              width: "100%",
              textAlign: "left",
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
              border: "2px solid rgba(139,92,246,0.25)",
              padding: "16px 20px",
              borderRadius: 16,
              marginTop: 24,
              marginBottom: 24,
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(124,58,237,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "#5b21b6" }}>🎯 Goals</span>
              <span style={{ fontSize: 14, color: "#6b7280" }}>{goals.length} goal{goals.length !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>
              {(() => {
                const n = goals.length;
                if (n === 0) return "Overall progress: 0%";
                const sumPct = goals.reduce((sum, g) => {
                  if (g.completedAt) return sum + 100;
                  const steps = g.actionSteps || [];
                  if (steps.length === 0) return sum;
                  const done = steps.filter((s) => s.done).length;
                  return sum + Math.round((done / steps.length) * 100);
                }, 0);
                const pct = Math.round(sumPct / n);
                return `Overall progress: ${pct}%`;
              })()}
            </div>
          </button>
        )}
        {/* 👆 GOALS WIDGET END */}

        {/* Last Journal Info */}
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b6b6b" }}>
            Last journal entry: <strong>{lastJournal}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "grid", gap: 12 }}>
          {hasCompletedOnboarding && onAICoach && (
            <button
              onClick={onAICoach}
              style={{
                height: 60,
                boxSizing: "border-box",
                padding: "0 24px",
                borderRadius: 16,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(124,58,237,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              🤖 Chat with Inny
            </button>
          )}

          {hasCompletedOnboarding && (
            <div
              style={{
                minHeight: 60,
                boxSizing: "border-box",
                border: "2px solid #8B5CF6",
                borderRadius: 16,
                background: "rgba(255,255,255,0.9)",
                overflow: "hidden",
              }}
            >
              <button
                type="button"
                onClick={() => setJournalExpanded((e) => !e)}
                style={{
                  width: "100%",
                  height: 56,
                  padding: "0 24px",
                  border: "none",
                  background: "transparent",
                  color: "#8B5CF6",
                  fontWeight: 700,
                  fontSize: 18,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  position: "relative",
                  boxSizing: "border-box",
                  whiteSpace: "nowrap",
                }}
              >
                <span>📓 Journal</span>
                <span style={{ position: "absolute", right: 16, fontSize: 14 }}>{journalExpanded ? "▲" : "▼"}</span>
              </button>
              {journalExpanded && (
                <div style={{ display: "grid", gap: 8, padding: "0 16px 16px 16px" }}>
                  <button
                    type="button"
                    onClick={() => onJournal("morning")}
                    style={{
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: "1px solid rgba(139,92,246,0.3)",
                      background: "rgba(255,243,205,0.5)",
                      color: "#92400e",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    ☀️ Morning journal
                  </button>
                  <button
                    type="button"
                    onClick={() => onJournal("evening")}
                    style={{
                      padding: "14px 20px",
                      borderRadius: 12,
                      border: "1px solid rgba(139,92,246,0.3)",
                      background: "rgba(224,231,255,0.5)",
                      color: "#3730a3",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    🌙 Evening journal
                  </button>
                </div>
              )}
            </div>
          )}

          {hasCompletedOnboarding && (
            <button
              onClick={onViewResults}
              style={{
                height: 60,
                boxSizing: "border-box",
                padding: "0 24px",
                borderRadius: 16,
                border: "2px solid #8B5CF6",
                background: "rgba(255,255,255,0.9)",
                color: "#8B5CF6",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
              }}
            >
              📊 View My Results
            </button>
          )}

          {(onHowItWorks || onHowToUseInny) && (
            <div style={{ display: "flex", gap: 12 }}>
              {onHowItWorks && (
                <button
                  onClick={onHowItWorks}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 72,
                    boxSizing: "border-box",
                    padding: "18px 16px",
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    background: "rgba(255,255,255,0.9)",
                    color: "#6b6b6b",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 10,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ lineHeight: 1 }}>ℹ️</span>
                    <span>How InnerCode Works</span>
                  </span>
                </button>
              )}
              {onHowToUseInny && (
                <button
                  onClick={onHowToUseInny}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 72,
                    boxSizing: "border-box",
                    padding: "18px 16px",
                    borderRadius: 16,
                    border: "1px solid #d1d5db",
                    background: "rgba(255,255,255,0.9)",
                    color: "#6b6b6b",
                    fontWeight: 600,
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: 10,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ lineHeight: 1 }}>🤖</span>
                    <span>How to use Inny</span>
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowInfoModal(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: "24px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowInfoModal(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(0,0,0,0.05)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                color: "#6b6b6b",
              }}
            >
              ✕
            </button>

            {/* Content */}
            {showInfoModal === 'lifeAreas' ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>⭐</div>
                <h3 style={{ 
                  margin: "0 0 12px", 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: "#3b3b3b",
                  textAlign: "center",
                }}>
                  Life Areas Average
                </h3>
                <p style={{ 
                  color: "#6b6b6b", 
                  fontSize: 15, 
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  This score represents the <strong>average</strong> of all your completed life area assessments (e.g., Career, Relationships, Health).
                </p>
                <div style={{ 
                  marginTop: 16, 
                  padding: 12, 
                  background: "rgba(139,92,246,0.08)", 
                  borderRadius: 12,
                }}>
                  <p style={{ 
                    color: "#6d28d9", 
                    fontSize: 14, 
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    💡 <strong>Tip:</strong> Each life area is scored from 0-10 based on your assessment responses. Track this over time to see your overall progress!
                  </p>
                </div>
              </>
            ) : showInfoModal === 'mood' ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>
                  {moodEmoji}
                </div>
                <h3 style={{ 
                  margin: "0 0 12px", 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: "#3b3b3b",
                  textAlign: "center",
                }}>
                  7-Day Mood Average
                </h3>
                <p style={{ 
                  color: "#6b6b6b", 
                  fontSize: 15, 
                  lineHeight: 1.6,
                  margin: "0 0 12px",
                }}>
                  This shows your <strong>average mood</strong> from journal entries over the past 7 days.
                </p>
                <div style={{
                  background: "rgba(139,92,246,0.05)",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 12,
                }}>
                  <div style={{ fontSize: 13, color: "#4b4b4b", marginBottom: 4 }}>
                    <strong>Mood Scale:</strong>
                  </div>
                  <div style={{ fontSize: 13, color: "#6b6b6b", lineHeight: 1.7 }}>
                    😄 Very Happy (5.0)<br/>
                    🙂 Happy (4.0)<br/>
                    😐 Neutral (3.0)<br/>
                    ☹️ Sad (2.0)<br/>
                    😭 Very Sad (1.0)
                  </div>
                </div>
                <div style={{ 
                  padding: 12, 
                  background: "rgba(139,92,246,0.08)", 
                  borderRadius: 12,
                }}>
                  <p style={{ 
                    color: "#6d28d9", 
                    fontSize: 14, 
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    💡 <strong>Tip:</strong> The emoji and number are calculated by averaging your mood selections across all journal entries from the last week.
                  </p>
                </div>
              </>
            ) : showInfoModal === 'streak' ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>
                  <CalendarIconWithToday />
                </div>
                <h3 style={{ 
                  margin: "0 0 12px", 
                  fontSize: 20, 
                  fontWeight: 800, 
                  color: "#3b3b3b",
                  textAlign: "center",
                }}>
                  Day Streak
                </h3>
                <p style={{ 
                  color: "#6b6b6b", 
                  fontSize: 15, 
                  lineHeight: 1.5,
                  margin: "0 0 12px",
                }}>
                  <strong>Consecutive days</strong> you’ve journaled. The number updates when you journal again the next day (first day = 0, then 1, 2…). Morning or evening—one per day counts. Skip a day and it resets to 0.
                </p>
                <div style={{
                  background: "rgba(245,158,11,0.08)",
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 10,
                }}>
                  <p style={{ fontSize: 13, color: "#6b6b6b", lineHeight: 1.45, margin: 0 }}>
                    <strong>🔥</strong> At <strong>5+</strong> days a fire appears; at 10, 20, 30+ the card lights up.
                  </p>
                </div>
                <p style={{ fontSize: 13, color: "#6d28d9", lineHeight: 1.45, margin: 0 }}>
                  💡 <strong>Tip:</strong> Even a short entry each day keeps your streak going.
                </p>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

