// Weekly Reflection Page
// Inny reflects on journals, sparks, mood, and goals; user can complete/keep/dismiss goals and add suggested steps

import { useState, useEffect, useCallback } from "react";
import type { Goal, GoalActionStep } from "../types";
import { buildWeeklyReflectionPayload } from "../utils/contextBuilders";
import { buildGoalsSummary } from "../utils/contextBuilders";
import { aiService } from "../utils/aiService";
import type { WeeklyReflectionResult } from "../utils/aiService";
import { saveWeeklyReflectionCompletion } from "../utils/weeklyReflectionLogic";
import { setGoalsInLocalStorage, saveGoalsToSupabase } from "../lib/supabaseData";
import { useResetZoom } from "../utils/useResetZoom";

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

interface WeeklyReflectionProps {
  goals: Goal[];
  onSaveGoals: (goals: Goal[]) => void;
  onBack: () => void;
  onComplete: () => void;
  journalEntries: import("../types").JournalEntry[];
  sparkCompletions: Record<string, string[]>;
  valueEntries: [string, number][];
  onboardingAnswers: string[];
  journalSummary?: string;
  recentJournalEntries?: import("../utils/contextBuilders").JournalSnapshotEntry[];
  categoryScores: Record<string, number>;
  completedCategories: string[];
  userName?: string;
}

export function WeeklyReflection({
  goals,
  onSaveGoals,
  onBack,
  onComplete,
  journalEntries,
  sparkCompletions,
  valueEntries,
  onboardingAnswers,
  journalSummary = "",
  recentJournalEntries = [],
  categoryScores,
  completedCategories,
  userName,
}: WeeklyReflectionProps) {
  useResetZoom();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeeklyReflectionResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const payload = buildWeeklyReflectionPayload(
        journalEntries,
        sparkCompletions,
        goals,
        valueEntries,
        onboardingAnswers
      );
      const context = {
        userName,
        categoryScores,
        completedCategories,
        valueEntries,
        onboardingAnswers,
        journalSummary,
        recentJournalEntries,
        goalsSummary: buildGoalsSummary(goals),
      };
      try {
        const data = await aiService.generateWeeklyReflection(payload, context);
        if (!cancelled) {
          setResult(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Something went wrong");
          setResult({
            reflectionText: "I couldn’t generate a reflection right now. You can still review your goals below. 💚",
            moodPositiveFactors: [],
            moodNegativeFactors: [],
            goalSuggestions: [],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    journalEntries,
    sparkCompletions,
    goals,
    valueEntries,
    onboardingAnswers,
    journalSummary,
    recentJournalEntries,
    categoryScores,
    completedCategories,
    userName,
  ]);

  const persistAndNotify = useCallback(
    (next: Goal[]) => {
      setGoalsInLocalStorage(next);
      void saveGoalsToSupabase(next);
      onSaveGoals(next);
    },
    [onSaveGoals]
  );

  const markGoalComplete = useCallback(
    (goal: Goal) => {
      const steps = goal.actionSteps || [];
      const allDone = steps.length === 0 || steps.every((s) => s.done);
      if (!allDone && !window.confirm("Some steps aren’t done yet. Mark this goal as complete anyway?")) return;
      const now = Date.now();
      const updated: Goal = { ...goal, completedAt: now, updatedAt: now };
      persistAndNotify(goals.map((g) => (g.id === goal.id ? updated : g)));
    },
    [goals, persistAndNotify]
  );

  const dismissGoal = useCallback(
    (goal: Goal) => {
      if (!window.confirm(`Remove "${goal.title}" from your goals?`)) return;
      persistAndNotify(goals.filter((g) => g.id !== goal.id));
    },
    [goals, persistAndNotify]
  );

  const addSuggestedSteps = useCallback(
    (goal: Goal, suggestedSteps: string[]) => {
      if (suggestedSteps.length === 0) return;
      const newSteps: GoalActionStep[] = suggestedSteps.map((label) => ({
        id: generateId(),
        label,
        done: false,
      }));
      const updated: Goal = {
        ...goal,
        actionSteps: [...(goal.actionSteps || []), ...newSteps],
        updatedAt: Date.now(),
      };
      persistAndNotify(goals.map((g) => (g.id === goal.id ? updated : g)));
    },
    [goals, persistAndNotify]
  );

  const handleDone = useCallback(() => {
    if (result) {
      saveWeeklyReflectionCompletion({
        reflectionText: result.reflectionText,
        moodPositiveFactors: result.moodPositiveFactors,
        moodNegativeFactors: result.moodNegativeFactors,
        goalSuggestions: result.goalSuggestions,
      });
    } else {
      saveWeeklyReflectionCompletion(undefined);
    }
    onComplete();
  }, [result, onComplete]);

  const background = "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background, padding: 20, paddingTop: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <p style={{ color: "#6b6b6b", fontSize: 16 }}>Inny is reflecting on your week…</p>
        </div>
      </div>
    );
  }

  const openGoalsNoSteps = result?.goalSuggestions ?? [];
  const goalSuggestionsByGoalId = new Map(openGoalsNoSteps.map((g) => [g.goalId, g.suggestedSteps]));

  return (
    <div style={{ minHeight: "100vh", background, padding: 20, paddingBottom: 40 }}>
      <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: 60 }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            marginBottom: 24,
            color: "#6b6b6b",
          }}
        >
          ← Back
        </button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>
            Your weekly reflection
          </h1>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", borderRadius: 12, padding: 12, marginBottom: 20, color: "#b91c1c", fontSize: 14 }}>
            {error}
          </div>
        )}

        {result && (
          <>
            <div
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRadius: 16,
                padding: 24,
                marginBottom: 24,
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "#374151" }}>
                {result.reflectionText}
              </p>
            </div>

            {(result.moodPositiveFactors.length > 0 || result.moodNegativeFactors.length > 0) && (
              <div
                style={{
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "#6d28d9", marginBottom: 12 }}>
                  What may have shaped your mood this week
                </div>
                {result.moodPositiveFactors.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "#6b6b6b", marginBottom: 6 }}>Positive</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                      {result.moodPositiveFactors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.moodNegativeFactors.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, color: "#6b6b6b", marginBottom: 6 }}>Challenging</div>
                    <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                      {result.moodNegativeFactors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {goals.length > 0 && (
              <div
                style={{
                  background: "rgba(255,255,255,0.95)",
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 24,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: "#3b3b3b", marginBottom: 16 }}>
                  Goals review
                </div>
                <p style={{ fontSize: 14, color: "#6b6b6b", marginBottom: 16 }}>
                  Complete if done, keep if you’re still progressing, or dismiss if it’s no longer right for you.
                </p>
                {goals.map((goal) => {
                  const isCompleted = !!goal.completedAt;
                  const steps = goal.actionSteps || [];
                  const hasSteps = steps.length > 0;
                  const suggestedSteps = goalSuggestionsByGoalId.get(goal.id) ?? [];
                  const showSuggestions = !isCompleted && !hasSteps && suggestedSteps.length > 0;

                  return (
                    <div
                      key={goal.id}
                      style={{
                        border: "1px solid rgba(139,92,246,0.25)",
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 12,
                        background: isCompleted ? "rgba(34,197,94,0.06)" : "transparent",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#3b3b3b", marginBottom: 4 }}>{goal.title}</div>
                      <div style={{ fontSize: 13, color: "#6b6b6b", marginBottom: 8 }}>
                        {goal.relevantValue} · {goal.horizon}
                        {!isCompleted && hasSteps && (
                          <> · {steps.filter((s) => s.done).length}/{steps.length} steps</>
                        )}
                      </div>
                      {showSuggestions && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, color: "#6d28d9", fontWeight: 600, marginBottom: 6 }}>
                            Suggested steps from Inny
                          </div>
                          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                            {suggestedSteps.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                          <button
                            type="button"
                            onClick={() => addSuggestedSteps(goal, suggestedSteps)}
                            style={{
                              marginTop: 8,
                              padding: "8px 14px",
                              borderRadius: 10,
                              border: "none",
                              background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            Add as steps
                          </button>
                        </div>
                      )}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {!isCompleted && (
                          <>
                            <button
                              type="button"
                              onClick={() => markGoalComplete(goal)}
                              style={{
                                padding: "8px 14px",
                                borderRadius: 10,
                                border: "none",
                                background: "#22c55e",
                                color: "#fff",
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Complete
                            </button>
                            <button
                              type="button"
                              onClick={() => dismissGoal(goal)}
                              style={{
                                padding: "8px 14px",
                                borderRadius: 10,
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                color: "#6b6b6b",
                                fontWeight: 600,
                                fontSize: 13,
                                cursor: "pointer",
                              }}
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                        {isCompleted && (
                          <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Completed</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={handleDone}
          style={{
            width: "100%",
            padding: "16px 24px",
            borderRadius: 16,
            border: "none",
            background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 18,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
