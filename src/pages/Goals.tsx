import { useState, useCallback, useEffect } from "react";
import { Goal, GoalHorizon, GoalActionStep } from "../types";
import { VALUE_ICONS } from "../constants/values";
import { CATEGORY_ICONS } from "../constants/categories";
import { getGoalsUnlockProgress } from "../utils/goalUnlock";
import { setGoalsInLocalStorage, saveGoalsToSupabase } from "../lib/supabaseData";
import { useResetZoom } from "../utils/useResetZoom";
import { safeGetItem, safeSetItem } from "../utils/helpers";
import { Celebration } from "../components/Celebration";

const GOALS_UNLOCK_CELEBRATION_KEY = "innercode_hasSeenGoalsUnlockCelebration";

const HORIZON_LABELS: Record<GoalHorizon, string> = {
  short: "Short-term",
  mid: "Mid-term",
  long: "Long-term",
};

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
}

function goalProgressPct(goal: Goal): number {
  if (goal.completedAt) return 100;
  const steps = goal.actionSteps || [];
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

interface GoalsProps {
  onBack: () => void;
  goals: Goal[];
  onSaveGoals: (goals: Goal[]) => void;
  onAfterSave?: () => void;
  unlockProgress: ReturnType<typeof getGoalsUnlockProgress>;
  valueEntries: [string, number][];
  completedCategories: string[];
  categoryScores?: Record<string, number>;
}

type ViewMode = "list" | "add" | "edit" | "view";

export function Goals({
  onBack,
  goals,
  onSaveGoals,
  onAfterSave,
  unlockProgress,
  valueEntries,
  completedCategories,
  categoryScores = {},
}: GoalsProps) {
  useResetZoom();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Goal>>({});
  const [showGoalCompleteCelebration, setShowGoalCompleteCelebration] = useState(false);
  const [showGoalsUnlockCelebration, setShowGoalsUnlockCelebration] = useState(false);

  useEffect(() => {
    if (!unlockProgress.unlocked) return;
    if (safeGetItem(GOALS_UNLOCK_CELEBRATION_KEY) === "true") return;
    setShowGoalsUnlockCelebration(true);
  }, [unlockProgress.unlocked]);

  const valuesPool = valueEntries.length > 0 ? valueEntries.map(([v]) => v) : Object.keys(VALUE_ICONS);
  const lifeAreas = completedCategories.length > 0 ? completedCategories : Object.keys(CATEGORY_ICONS);

  const saveGoals = useCallback(
    (next: Goal[]) => {
      setGoalsInLocalStorage(next);
      void saveGoalsToSupabase(next);
      onSaveGoals(next);
    },
    [onSaveGoals]
  );

  const addGoal = useCallback(() => {
    const now = Date.now();
    setDraft({
      id: generateId(),
      title: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevantValue: valuesPool[0] || "",
      lifeArea: lifeAreas[0] || undefined,
      dueDate: now + 90 * 24 * 60 * 60 * 1000,
      horizon: "short",
      actionSteps: [],
      createdAt: now,
      updatedAt: now,
    });
    setSelectedGoalId(null);
    setViewMode("add");
  }, [valuesPool, lifeAreas]);

  const startEdit = useCallback((goal: Goal) => {
    setDraft({ ...goal });
    setSelectedGoalId(goal.id);
    setViewMode("edit");
  }, []);

  const startView = useCallback((goal: Goal) => {
    setDraft(goal);
    setSelectedGoalId(goal.id);
    setViewMode("view");
  }, []);

  const saveDraftAsGoal = useCallback(() => {
    if (!draft.id || !draft.title || !draft.specific || !draft.measurable || !draft.relevantValue || draft.dueDate == null || !draft.horizon) return;
    const now = Date.now();
    const goal: Goal = {
      id: draft.id,
      title: draft.title,
      specific: draft.specific,
      measurable: draft.measurable,
      achievable: draft.achievable,
      relevantValue: draft.relevantValue,
      lifeArea: draft.lifeArea,
      dueDate: draft.dueDate,
      horizon: draft.horizon,
      actionSteps: draft.actionSteps ?? [],
      createdAt: draft.createdAt ?? now,
      updatedAt: now,
      completedAt: draft.completedAt,
    };
    const existing = goals.find((g) => g.id === goal.id);
    const next = existing
      ? goals.map((g) => (g.id === goal.id ? goal : g))
      : [...goals, goal];
    saveGoals(next);
    onAfterSave?.();
    if (goal.completedAt) setShowGoalCompleteCelebration(true);
    setViewMode("list");
    setDraft({});
    setSelectedGoalId(null);
  }, [draft, goals, saveGoals, onAfterSave]);

  const deleteGoal = useCallback(
    (id: string) => {
      if (!window.confirm("Delete this goal? This can't be undone.")) return;
      saveGoals(goals.filter((g) => g.id !== id));
      onAfterSave?.();
      setViewMode("list");
      setSelectedGoalId(null);
      setDraft({});
    },
    [goals, saveGoals, onAfterSave]
  );

  const markGoalComplete = useCallback(
    (goal: Goal) => {
      const steps = goal.actionSteps || [];
      const allStepsDone = steps.length === 0 || steps.every((s) => s.done);
      if (!allStepsDone && !window.confirm("Some steps aren't done yet. Mark this goal as complete anyway?")) return;
      const now = Date.now();
      const updated: Goal = { ...goal, completedAt: now, updatedAt: now };
      const next = goals.map((g) => (g.id === goal.id ? updated : g));
      saveGoals(next);
      onAfterSave?.();
      setDraft(updated);
      setShowGoalCompleteCelebration(true);
    },
    [goals, saveGoals, onAfterSave]
  );

  const toggleStep = useCallback(
    (stepId: string) => {
      const steps = (draft.actionSteps ?? []).map((s) =>
        s.id === stepId ? { ...s, done: !s.done } : s
      );
      setDraft((p) => ({ ...p, actionSteps: steps }));
    },
    [draft.actionSteps]
  );

  const addStep = useCallback(() => {
    const steps = [...(draft.actionSteps ?? []), { id: generateId(), label: "", done: false }];
    setDraft((p) => ({ ...p, actionSteps: steps }));
  }, [draft.actionSteps]);

  const updateStepLabel = useCallback((stepId: string, label: string) => {
    setDraft((p) => ({
      ...p,
      actionSteps: (p.actionSteps ?? []).map((s) => (s.id === stepId ? { ...s, label } : s)),
    }));
  }, []);

  const removeStep = useCallback((stepId: string) => {
    setDraft((p) => ({
      ...p,
      actionSteps: (p.actionSteps ?? []).filter((s) => s.id !== stepId),
    }));
  }, []);

  const background = "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))";

  // —— Locked state ——
  if (!unlockProgress.unlocked) {
    const p = unlockProgress;
    return (
      <div style={{ minHeight: "100vh", background, padding: 20, paddingTop: 70 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
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
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎯</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>
              Goals unlock when you're ready
            </h1>
            <p style={{ color: "#6b6b6b", marginTop: 12, lineHeight: 1.6 }}>
              Complete all 12 life areas, 5 journal entries, and 3 sparks so you understand your values before setting goals.
            </p>
          </div>
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{p.areasComplete ? "✅" : "📋"}</span>
              <span>
                Life areas: {p.areasCount} / {p.areasRequired}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{p.journalCount >= p.journalRequired ? "✅" : "📓"}</span>
              <span>
                Journal entries: {p.journalCount} / {p.journalRequired}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>{p.sparksCount >= p.sparksRequired ? "✅" : "✨"}</span>
              <span>
                Sparks completed: {p.sparksCount} / {p.sparksRequired}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // —— Add / Edit form ——
  if (viewMode === "add" || viewMode === "edit") {
    const isEdit = viewMode === "edit";
    return (
      <div style={{ minHeight: "100vh", background, padding: 20, paddingTop: 70 }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <button
            onClick={() => { setViewMode("list"); setDraft({}); setSelectedGoalId(null); }}
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
          <h1 style={{ margin: "0 0 24px", fontSize: 24, fontWeight: 800, color: "#3b3b3b" }}>
            {isEdit ? "Edit goal" : "New goal"}
          </h1>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            <label style={{ fontWeight: 600, color: "#374151" }}>Title</label>
            <input
              value={draft.title ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Run my first 5K"
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
              }}
            />

            <label style={{ fontWeight: 600, color: "#374151" }}>Specific – What exactly do you want to achieve?</label>
            <textarea
              value={draft.specific ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, specific: e.target.value }))}
              placeholder="One clear sentence."
              rows={2}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                resize: "vertical",
              }}
            />

            <label style={{ fontWeight: 600, color: "#374151" }}>Measurable – How will you know you've achieved it?</label>
            <input
              value={draft.measurable ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, measurable: e.target.value }))}
              placeholder="e.g. Complete 5K in under 35 minutes"
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
              }}
            />

            <label style={{ fontWeight: 600, color: "#374151" }}>Relevant – Which value does this align with?</label>
            <select
              value={draft.relevantValue ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, relevantValue: e.target.value }))}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                width: "100%",
              }}
            >
              {valuesPool.map((v) => (
                <option key={v} value={v}>
                  {VALUE_ICONS[v] ?? "✨"} {v}
                </option>
              ))}
            </select>

            <label style={{ fontWeight: 600, color: "#374151" }}>Life area (optional)</label>
            <select
              value={draft.lifeArea ?? ""}
              onChange={(e) => setDraft((p) => ({ ...p, lifeArea: e.target.value || undefined }))}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                width: "100%",
              }}
            >
              <option value="">None</option>
              {lifeAreas.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICONS[c] ?? "📌"} {c}
                </option>
              ))}
            </select>

            <label style={{ fontWeight: 600, color: "#374151" }}>Time horizon</label>
            <select
              value={draft.horizon ?? "short"}
              onChange={(e) => setDraft((p) => ({ ...p, horizon: e.target.value as GoalHorizon }))}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                width: "100%",
              }}
            >
              {(Object.keys(HORIZON_LABELS) as GoalHorizon[]).map((h) => (
                <option key={h} value={h}>
                  {HORIZON_LABELS[h]}
                </option>
              ))}
            </select>

            <label style={{ fontWeight: 600, color: "#374151" }}>Due date</label>
            <input
              type="date"
              value={draft.dueDate ? new Date(draft.dueDate).toISOString().slice(0, 10) : ""}
              onChange={(e) => setDraft((p) => ({ ...p, dueDate: new Date(e.target.value).getTime() }))}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                width: "100%",
              }}
            />

            {!isEdit && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={!!draft.completedAt}
                  onChange={(e) => setDraft((p) => ({ ...p, completedAt: e.target.checked ? Date.now() : undefined }))}
                  style={{ width: 20, height: 20 }}
                />
                <span style={{ fontWeight: 500, color: "#374151" }}>Mark as complete when saving</span>
              </label>
            )}

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontWeight: 600, color: "#374151" }}>Action steps</label>
                <button
                  type="button"
                  onClick={addStep}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: "#6A3ABF",
                    color: "white",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  + Add step
                </button>
              </div>
              {(draft.actionSteps ?? []).map((step) => (
                <div
                  key={step.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={step.done}
                    onChange={() => toggleStep(step.id)}
                    style={{ width: 20, height: 20 }}
                  />
                  <input
                    value={step.label}
                    onChange={(e) => updateStepLabel(step.id, e.target.value)}
                    placeholder="Step description"
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      fontSize: 14,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      background: "#f3f4f6",
                      color: "#6b7280",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={saveDraftAsGoal}
              disabled={!draft.title?.trim() || !draft.specific?.trim() || !draft.measurable?.trim()}
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                border: "none",
                background: "#6A3ABF",
                color: "white",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                flex: 1,
              }}
            >
              {isEdit ? "Save changes" : "Add goal"}
            </button>
            {isEdit && (
              <button
                onClick={() => selectedGoalId && deleteGoal(selectedGoalId)}
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "2px solid #ef4444",
                  background: "transparent",
                  color: "#ef4444",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // —— View single goal ——
  if (viewMode === "view" && draft.id) {
    const g = draft as Goal;
    const pct = goalProgressPct(g);
    const isCompleted = !!g.completedAt;
    return (
      <div style={{ minHeight: "100vh", background, padding: 20, paddingTop: 70 }}>
        <Celebration
          show={showGoalCompleteCelebration}
          message="Great work!"
          emoji="🎉"
          onComplete={() => setShowGoalCompleteCelebration(false)}
        />
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <button
            onClick={() => { setViewMode("list"); setDraft({}); setSelectedGoalId(null); }}
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
          <div style={{ background: "white", borderRadius: 16, padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#3b3b3b" }}>{g.title}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isCompleted && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#059669",
                      background: "rgba(5,150,105,0.12)",
                      padding: "6px 12px",
                      borderRadius: 8,
                    }}
                  >
                    Completed
                  </span>
                )}
                <span style={{ fontSize: 14, color: "#6b6b6b" }}>{HORIZON_LABELS[g.horizon]}</span>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#6b6b6b", marginBottom: 4 }}>Progress</div>
              <div style={{ height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: isCompleted ? "linear-gradient(90deg, #059669, #10b981)" : "linear-gradient(90deg, #6A3ABF, #8A4EF0)",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: isCompleted ? "#059669" : "#6A3ABF", marginTop: 4 }}>{pct}%</div>
            </div>
            <div style={{ fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
              <strong>Specific:</strong> {g.specific}
            </div>
            <div style={{ fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
              <strong>Measurable:</strong> {g.measurable}
            </div>
            <div style={{ fontSize: 14, color: "#4b5563", marginBottom: 8 }}>
              <strong>Value:</strong> {VALUE_ICONS[g.relevantValue]} {g.relevantValue}
              {g.lifeArea && ` · ${CATEGORY_ICONS[g.lifeArea]} ${g.lifeArea}`}
            </div>
            <div style={{ fontSize: 14, color: "#4b5563", marginBottom: 16 }}>
              <strong>Due:</strong> {new Date(g.dueDate).toLocaleDateString()}
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ fontSize: 14 }}>Action steps</strong>
              {(g.actionSteps ?? []).map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <input type="checkbox" checked={s.done} readOnly style={{ width: 18, height: 18 }} />
                  <span style={{ textDecoration: s.done ? "line-through" : "none", color: "#6b7280" }}>{s.label || "(no description)"}</span>
                </div>
              ))}
            </div>
            {!isCompleted && (
              <button
                type="button"
                onClick={() => markGoalComplete(g)}
                aria-label="Mark this goal as complete"
                style={{
                  padding: "12px 20px",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: 12,
                }}
              >
                Mark as complete
              </button>
            )}
            <button
              onClick={() => startEdit(g)}
              style={{
                padding: "12px 20px",
                borderRadius: 12,
                border: "2px solid #6A3ABF",
                background: "transparent",
                color: "#6A3ABF",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Edit goal
            </button>
          </div>
        </div>
      </div>
    );
  }

  // —— List view ——
  const activeGoals = goals.filter((g) => !g.completedAt);
  const completedGoals = goals.filter((g) => g.completedAt);
  const byHorizon = (h: GoalHorizon, list: Goal[]) => list.filter((g) => g.horizon === h);
  const overallPct =
    goals.length === 0
      ? 0
      : Math.round(
          goals.reduce((sum, g) => sum + goalProgressPct(g), 0) / goals.length
        );

  // Infographic: goals by value, by life area (with priority/rank), overall % complete
  const goalsByValue: Record<string, number> = {};
  const goalsByLifeArea: Record<string, number> = {};
  goals.forEach((g) => {
    goalsByValue[g.relevantValue] = (goalsByValue[g.relevantValue] || 0) + 1;
    if (g.lifeArea) goalsByLifeArea[g.lifeArea] = (goalsByLifeArea[g.lifeArea] || 0) + 1;
  });
  const valueRank = valueEntries.length > 0 ? Object.fromEntries(valueEntries.map(([v], i) => [v, i + 1])) : {};
  const lifeAreaOrder = completedCategories.length > 0
    ? [...completedCategories].sort((a, b) => (categoryScores[b] ?? 0) - (categoryScores[a] ?? 0))
    : Object.keys(goalsByLifeArea);

  return (
    <div style={{ minHeight: "100vh", background, padding: 20, paddingTop: 70 }}>
      <Celebration
        show={showGoalsUnlockCelebration}
        message="You're ready. Goal setting unlocked—set meaningful goals."
        emoji="🎯"
        onComplete={() => {
          safeSetItem(GOALS_UNLOCK_CELEBRATION_KEY, "true");
          setShowGoalsUnlockCelebration(false);
        }}
      />
      <Celebration
        show={showGoalCompleteCelebration}
        message="Great work!"
        emoji="🎉"
        onComplete={() => setShowGoalCompleteCelebration(false)}
      />
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#3b3b3b" }}>🎯 Goals</h1>
          <button
            type="button"
            onClick={addGoal}
            aria-label="Add a new goal"
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
              color: "white",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(106,58,191,0.4)",
            }}
          >
            + Add goal
          </button>
        </div>
        <p style={{ color: "#6b6b6b", marginBottom: 24, lineHeight: 1.5 }}>
          Set SMART goals linked to your values. Track progress by completing steps. Inny and your weekly check-in will help you stay on track.
        </p>

        {goals.length > 0 && (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Your goals at a glance</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
              <div style={{ flex: "1 1 140px" }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Overall complete</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#6A3ABF" }}>{overallPct}%</div>
              </div>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>By value</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}>
                  {Object.entries(goalsByValue)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 6)
                    .map(([value, count]) => (
                      <span key={value} style={{ fontSize: 12, color: "#4b5563" }}>
                        {VALUE_ICONS[value] ?? "✨"} {value} ({count}){valueRank[value] ? ` #${valueRank[value]}` : ""}
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>By life area</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 10px" }}>
                {lifeAreaOrder
                  .filter((area) => goalsByLifeArea[area])
                  .slice(0, 8)
                  .map((area) => (
                    <span key={area} style={{ fontSize: 12, color: "#4b5563" }}>
                      {CATEGORY_ICONS[area] ?? "📌"} {area} ({goalsByLifeArea[area]})
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 48,
              textAlign: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <p style={{ color: "#6b6b6b", marginBottom: 24 }}>No goals yet. Add one to get started.</p>
            <button
              onClick={addGoal}
              style={{
                padding: "14px 28px",
                borderRadius: 12,
                border: "none",
                background: "#6A3ABF",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Add your first goal
            </button>
          </div>
        ) : (
          <>
            {(["short", "mid", "long"] as GoalHorizon[]).map((horizon) => {
              const list = byHorizon(horizon, activeGoals);
              if (list.length === 0) return null;
              return (
                <div key={horizon} style={{ marginBottom: 24 }}>
                  <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#4b5563" }}>
                    {HORIZON_LABELS[horizon]}
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {list.map((goal) => {
                      const pct = goalProgressPct(goal);
                      return (
                        <button
                          key={goal.id}
                          onClick={() => startView(goal)}
                          style={{
                            display: "block",
                            width: "100%",
                            textAlign: "left",
                            background: "white",
                            border: "1px solid #e5e7eb",
                            borderRadius: 16,
                            padding: 16,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            transition: "box-shadow 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: "#3b3b3b" }}>{goal.title}</span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#6A3ABF" }}>{pct}%</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            <span>{VALUE_ICONS[goal.relevantValue] ?? "✨"}</span>
                            <span style={{ fontSize: 14, color: "#6b6b6b" }}>{goal.relevantValue}</span>
                            {goal.lifeArea && (
                              <>
                                <span style={{ color: "#d1d5db" }}>·</span>
                                <span style={{ fontSize: 14, color: "#6b6b6b" }}>{CATEGORY_ICONS[goal.lifeArea]} {goal.lifeArea}</span>
                              </>
                            )}
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Due {new Date(goal.dueDate).toLocaleDateString()}</div>
                          <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: "linear-gradient(90deg, #6A3ABF, #8A4EF0)",
                                borderRadius: 3,
                              }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {completedGoals.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 700, color: "#059669" }}>Completed</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {completedGoals.map((goal) => {
                    const pct = goalProgressPct(goal);
                    return (
                      <button
                        key={goal.id}
                        onClick={() => startView(goal)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "rgba(5,150,105,0.06)",
                          border: "1px solid rgba(5,150,105,0.2)",
                          borderRadius: 16,
                          padding: 16,
                          cursor: "pointer",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                          transition: "box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 16px rgba(5,150,105,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 16, color: "#3b3b3b" }}>{goal.title}</span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#059669",
                              background: "rgba(5,150,105,0.12)",
                              padding: "4px 10px",
                              borderRadius: 8,
                            }}
                          >
                            Completed
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                          <span>{VALUE_ICONS[goal.relevantValue] ?? "✨"}</span>
                          <span style={{ fontSize: 14, color: "#6b6b6b" }}>{goal.relevantValue}</span>
                          {goal.lifeArea && (
                            <>
                              <span style={{ color: "#d1d5db" }}>·</span>
                              <span style={{ fontSize: 14, color: "#6b6b6b" }}>{CATEGORY_ICONS[goal.lifeArea]} {goal.lifeArea}</span>
                            </>
                          )}
                        </div>
                        <div style={{ height: 6, background: "#d1fae5", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #059669, #10b981)", borderRadius: 3 }} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
