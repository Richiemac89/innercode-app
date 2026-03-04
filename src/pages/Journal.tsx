import { useState, useEffect } from "react";
import { FilterChip } from "../components/FilterChip";
import { Celebration } from "../components/Celebration";
import { JournalEntry } from "../types";
import { has, dayKeyFromTs, getCurrentTime } from "../utils/helpers";
import { useResetZoom } from "../utils/useResetZoom";

function calculateStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  const sortedEntries = [...entries].sort((a, b) => b.createdAt - a.createdAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].createdAt);
    entryDate.setHours(0, 0, 0, 0);
    const dayKey = dayKeyFromTs(currentDate.getTime());
    const entryKey = dayKeyFromTs(entryDate.getTime());
    
    if (entryKey === dayKey) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

interface JournalProps {
  onBack: () => void;
  categories: string[];
  categoryIcons: Record<string, string>;
  valuesPool: string[];
  valueIcons: Record<string, string>;
  entries: JournalEntry[];
  addEntry: (e: Omit<JournalEntry, "id" | "createdAt">) => void;
  userName?: string;
  /** When goals are unlocked and user has goals, show optional goal reflection */
  goals?: Array<{ id: string; title: string }>;
  goalsUnlocked?: boolean;
}

export function Journal({
  onBack,
  categories,
  categoryIcons,
  valuesPool,
  valueIcons,
  entries,
  addEntry,
  userName,
  goals = [],
  goalsUnlocked = false,
}: JournalProps) {
  const [text, setText] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [vals, setVals] = useState<string[]>([]);
  const [grat, setGrat] = useState<string[]>(["", "", ""]);
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");
  const [goalRefGoalId, setGoalRefGoalId] = useState<string>("");
  const [goalReflectionSnippet, setGoalReflectionSnippet] = useState("");
  const [goalReflectionExpanded, setGoalReflectionExpanded] = useState(false);

  const todayKey = dayKeyFromTs(getCurrentTime());
  const hasToday = entries.some((e) => dayKeyFromTs(e.createdAt) === todayKey);
  const locked = hasToday || saved;
  const streak = calculateStreak(entries);

  // Reset zoom and scroll to top when component mounts
  useResetZoom();

  function toggleCat(c: string) {
    setCats((prev) =>
      has(prev, c) ? prev.filter((x) => x !== c) : prev.concat([c])
    );
  }
  function toggleVal(v: string) {
    setVals((prev) =>
      has(prev, v) ? prev.filter((x) => x !== v) : prev.concat([v])
    );
  }
  function save() {
    if (!text.trim() || locked) return;
    addEntry({
      text: text.trim(),
      categories: cats,
      values: vals,
      gratitude: grat.filter(Boolean),
      mood,
      goalRef: goalRefGoalId ? { goalId: goalRefGoalId, snippet: goalReflectionSnippet.trim() || undefined } : undefined,
    });
    setSaved(true);

    // Check for milestones and show celebration
    const newStreak = calculateStreak([
      {
        id: String(getCurrentTime()),
        createdAt: getCurrentTime(),
        text: text.trim(),
        categories: cats,
        values: vals,
        gratitude: grat.filter(Boolean),
        mood,
      },
      ...entries,
    ]);

    // Always celebrate journal entries!
    if (entries.length === 0) {
      // First entry ever!
      setCelebrationMsg("Your first journal entry! 🌱\n\nYour InnerCode has been updated with your insights!");
    } else if (newStreak === 7) {
      // 7-day streak!
      setCelebrationMsg("7-Day Streak! You're on fire! 🔥\n\nInny has fresh suggestions for you!");
    } else if (newStreak === 30) {
      // 30-day streak!
      setCelebrationMsg("30 Days Strong! Incredible! 💪\n\nYour InnerCode keeps evolving!");
    } else if (newStreak % 10 === 0 && newStreak >= 10) {
      // Every 10 days after that
      setCelebrationMsg(`${newStreak} Days! Keep going! ⭐\n\nYour results have been updated!`);
    } else {
      // Regular entry celebration with results update
      const messages = [
        "Entry saved! 📝\n\nYour InnerCode has been updated!",
        "Great reflection! ✨\n\nInny is learning from this!",
        "Keep it up! 🌟\n\nYour insights are shaping your results!",
        "You're doing amazing! 💫\n\nResults updated with your latest entry!",
        "Beautiful thoughts! 🌸\n\nYour InnerCode just got smarter!"
      ];
      setCelebrationMsg(messages[Math.floor(Math.random() * messages.length)]);
    }
    // Always show celebration
    setShowCelebration(true);
  }

  return (
    <>
      <Celebration
        show={showCelebration}
        message={celebrationMsg}
        emoji="🎉"
        onComplete={() => setShowCelebration(false)}
      />
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(16,185,129,0.10))",
        }}
      >
        <div className="page" style={{ paddingTop: "70px" }}>
        {/* Welcome Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📓</div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: "#3b3b3b",
            }}
          >
            {(() => {
              const hour = new Date().getHours();
              const greeting = 
                hour < 12 ? "Good morning" :
                hour < 18 ? "Good afternoon" :
                "Good evening";
              return greeting;
            })()}{userName ? `, ${userName}` : ''}!
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: 16, marginTop: 8 }}>
            Reflect on your journey
          </p>
        </div>

        {/* Streak Badge and Private Label */}
        {streak > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: streak >= 7 ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "rgba(139,92,246,0.1)",
                border: streak >= 7 ? "2px solid #f59e0b" : "1px solid rgba(139,92,246,0.3)",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {streak >= 7 ? "🔥" : "📅"} {streak} day{streak !== 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 12, color: "#6b6b6b" }}>
              Private • Local only
            </div>
          </div>
        )}

        {/* Explainer */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>💡</span>
            <strong style={{ color: "#6A3ABF", fontSize: 14 }}>How Journaling Works</strong>
          </div>
          <p style={{ margin: 0, color: "#4b4b4b", textAlign: "left", fontSize: 14, lineHeight: 1.6 }}>
            Journaling sharpens awareness. Tag <strong>categories</strong> and
            pick related <strong>values</strong> when your note or gratitude fits.
            We use recent tagged entries to give smarter insights and gently nudge
            your Results over time.
          </p>
        </div>

        {/* Save / lock banners */}
        {saved && (
          <div
            className="fadeInUp"
            style={{
              background: "#ecfdf5",
              border: "1px solid #bbf7d0",
              color: "#065f46",
              padding: "10px 12px",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            Saved ✓ — nice work. Please come back <strong>tomorrow</strong> to
            journal again.
          </div>
        )}
        {hasToday && !saved && (
          <div
            className="fadeInUp"
            style={{
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              padding: "10px 12px",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            You've already added an entry today. New entries unlock at midnight
            (your local time).
          </div>
        )}

        {/* Composer */}
        <div
          className={locked ? "locked" : ""}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reflect on your day. Did you do any of the suggested activities? How did you get on?"
            rows={10}
            style={{
              width: "100%",
              minHeight: 220,
              resize: "vertical",
              border: "2px solid rgba(106, 58, 191, 0.2)",
              borderRadius: 12,
              padding: "12px 14px",
              background: "#fafafa",
              transition: "border-color 0.2s, background 0.2s",
              outline: "none",
            }}
            disabled={locked}
            onFocus={(e) => {
              if (!locked) {
                e.currentTarget.style.borderColor = "#6A3ABF";
                e.currentTarget.style.background = "#fff";
              }
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.2)";
              e.currentTarget.style.background = "#fafafa";
            }}
          />

          {/* Today's Mood */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 20 }}>🙂</span>
              <strong>Today's Mood</strong>
            </div>
            <div style={{ color: "#4b4b4b", fontSize: 14, marginBottom: 8 }}>
              Pick the emoji that best matches today.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              {["😭", "☹️", "😐", "🙂", "😄", "😡"].map((face) => (
                <button
                  key={face}
                  onClick={() => setMood(face)}
                  disabled={locked}
                  style={{
                    fontSize: 28,
                    borderRadius: 12,
                    padding: "8px 10px",
                    border:
                      mood === face
                        ? "2px solid #6A3ABF"
                        : "1px solid rgba(106, 58, 191, 0.2)",
                    background:
                      mood === face ? "rgba(106, 58, 191, 0.1)" : "#fff",
                    opacity: locked ? 0.6 : 1,
                    cursor: locked ? "not-allowed" : "pointer",
                    flex: 1,
                    maxWidth: "60px",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!locked && mood !== face) {
                      e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (mood !== face) {
                      e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.2)";
                    }
                  }}
                >
                  {face}
                </button>
              ))}
            </div>
          </div>

          {/* Gratitude */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 20 }}>🌤️</span>
              <strong>Gratitude</strong>
            </div>
            <div style={{ color: "#4b4b4b", fontSize: 14, marginBottom: 8 }}>
              Regular gratitude builds attention for what's working. Name three
              specifics from today.
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  placeholder={`${i + 1}) …`}
                  value={grat[i]}
                  disabled={locked}
                  onChange={(e) => {
                    const n = [...grat];
                    n[i] = e.target.value;
                    setGrat(n);
                  }}
                  style={{
                    border: "2px solid rgba(106, 58, 191, 0.2)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: "#fff",
                    opacity: locked ? 0.6 : 1,
                    transition: "border-color 0.2s",
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    if (!locked) {
                      e.currentTarget.style.borderColor = "#6A3ABF";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.2)";
                  }}
                />
              ))}
            </div>
          </div>

          {/* Life Areas (multi-select) */}
          <div>
            {/* Title */}
            <div style={{ fontSize: 12, color: "#6b6b6b", fontWeight: 600, marginBottom: 8 }}>
              Life Areas:
            </div>
            
            {/* Explainer */}
            <div style={{ 
              fontSize: 12, 
              color: "#6b7280", 
              marginBottom: 10,
              lineHeight: 1.4,
            }}>
              Select the life areas and values relevant to this entry — it helps improve your results and gives Inny better insights
            </div>
            
            {/* Filter Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {categories.map((c) => {
                const active = has(cats, c);
                return (
                  <FilterChip
                    key={c}
                    label={`${categoryIcons[c]} ${c}`}
                    active={active}
                    onClick={() => !locked && toggleCat(c)}
                  />
                );
              })}
            </div>
          </div>

          {/* Values (multi-select) */}
          <div>
            {/* Title */}
            <div style={{ fontSize: 12, color: "#6b6b6b", fontWeight: 600, marginBottom: 8 }}>
              Values:
            </div>
            
            {/* Filter Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {valuesPool.map((v) => {
                const active = has(vals, v);
                return (
                  <FilterChip
                    key={v}
                    label={`${valueIcons[v] ?? "✨"} ${v}`}
                    active={active}
                    onClick={() => !locked && toggleVal(v)}
                  />
                );
              })}
            </div>
          </div>

          {/* Goal reflection (optional) - when user has goals */}
          {goalsUnlocked && goals.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setGoalReflectionExpanded((e) => !e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 6,
                  background: "none",
                  border: "none",
                  cursor: locked ? "default" : "pointer",
                  padding: 0,
                  opacity: locked ? 0.7 : 1,
                }}
              >
                <span style={{ fontSize: 20 }}>🎯</span>
                <strong>Reflect on a goal (optional)</strong>
                <span style={{ marginLeft: "auto", fontSize: 14 }}>{goalReflectionExpanded ? "▼" : "▶"}</span>
              </button>
              {goalReflectionExpanded && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#4b4b4b", fontSize: 14, marginBottom: 8 }}>
                    Link this entry to a goal and note how it went.
                  </div>
                  <select
                    value={goalRefGoalId}
                    onChange={(e) => setGoalRefGoalId(e.target.value)}
                    disabled={locked}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "2px solid rgba(106, 58, 191, 0.2)",
                      marginBottom: 8,
                      background: "#fff",
                      fontSize: 14,
                    }}
                  >
                    <option value="">None</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                  {goalRefGoalId && (
                    <input
                      placeholder="How did it go?"
                      value={goalReflectionSnippet}
                      onChange={(e) => setGoalReflectionSnippet(e.target.value)}
                      disabled={locked}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        border: "2px solid rgba(106, 58, 191, 0.2)",
                        background: "#fff",
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Save */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={save}
              disabled={locked}
              className={locked ? "" : "pulse"}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 800,
                cursor: locked ? "not-allowed" : "pointer",
                boxShadow: "0 10px 24px rgba(124,58,237,0.35)",
                opacity: locked ? 0.6 : 1,
              }}
            >
              Save entry
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

