import { useState, useEffect, useRef, useMemo } from "react";
import { FilterChip } from "../components/FilterChip";
import { Celebration } from "../components/Celebration";
import { JournalEntry, type JournalSlot } from "../types";
import { has, dayKeyFromTs, getCurrentTime } from "../utils/helpers";
import { useResetZoom } from "../utils/useResetZoom";
import { getAffirmationsForUser, getEveningAffirmations } from "../constants/affirmations";

function getDefaultSlot(): JournalSlot {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : "evening";
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
  /** Open on morning or evening tab (default: by time of day) */
  initialSlot?: JournalSlot;
  /** User's completed life areas — used to filter morning affirmations */
  completedCategories?: string[];
  /** User's value keys from results — used to filter morning affirmations */
  userValueKeys?: string[];
  /** Called when the thank-you overlay visibility changes (e.g. to hide floating menu) */
  onThankYouOverlayChange?: (visible: boolean) => void;
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
  initialSlot,
  completedCategories = [],
  userValueKeys = [],
  onThankYouOverlayChange,
}: JournalProps) {
  /** Fixed for this screen: morning or evening, no in-page toggle */
  const slot: JournalSlot = initialSlot ?? getDefaultSlot();
  const [text, setText] = useState("");
  const [cats, setCats] = useState<string[]>([]);
  const [vals, setVals] = useState<string[]>([]);
  const [grat, setGrat] = useState<string[]>(["", "", ""]);
  const [wentWell, setWentWell] = useState<string[]>(["", "", ""]);
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");
  const [goalRefGoalId, setGoalRefGoalId] = useState<string>("");
  const [goalReflectionSnippet, setGoalReflectionSnippet] = useState("");
  const [goalReflectionExpanded, setGoalReflectionExpanded] = useState(false);
  /** Slot we just saved this session — locks immediately before entries prop updates */
  const [savedSlot, setSavedSlot] = useState<JournalSlot | null>(null);
  /** Prevents double-submit (e.g. double-click or Strict Mode) from creating duplicate entries */
  const savingRef = useRef(false);

  const morningAffirmations = useMemo(
    () => getAffirmationsForUser(completedCategories, userValueKeys),
    [completedCategories, userValueKeys]
  );
  const eveningAffirmations = useMemo(
    () => (slot === "evening" ? getEveningAffirmations() : []),
    [slot]
  );
  const carouselItems = slot === "morning" ? morningAffirmations : eveningAffirmations;
  const [currentAffirmationIndex, setCurrentAffirmationIndex] = useState(0);

  const todayKey = dayKeyFromTs(getCurrentTime());
  const hasMorningToday = entries.some(
    (e) => dayKeyFromTs(e.createdAt) === todayKey && e.slot === "morning"
  );
  const hasEveningToday = entries.some(
    (e) => dayKeyFromTs(e.createdAt) === todayKey && (e.slot === "evening" || e.slot == null)
  );
  const locked =
    (slot === "morning" ? hasMorningToday : hasEveningToday) || savedSlot === slot;
  const streak = calculateStreak(entries);

  // Notify parent when thank-you overlay is shown/hidden (e.g. to hide floating menu)
  useEffect(() => {
    onThankYouOverlayChange?.(locked);
  }, [locked, onThankYouOverlayChange]);

  // Clear savedSlot once entries prop includes the saved entry (avoids redundant state)
  useEffect(() => {
    if (!savedSlot) return;
    if (savedSlot === "morning" && hasMorningToday) setSavedSlot(null);
    if (savedSlot === "evening" && hasEveningToday) setSavedSlot(null);
  }, [savedSlot, hasMorningToday, hasEveningToday]);

  // Auto-rotate affirmations every 8 seconds (morning and evening)
  useEffect(() => {
    if (carouselItems.length === 0) return;
    const interval = setInterval(() => {
      setCurrentAffirmationIndex((prev) => (prev + 1) % carouselItems.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  // Reset form when switching between morning and evening journal
  useEffect(() => {
    setText("");
    setCats([]);
    setVals([]);
    setGrat(["", "", ""]);
    setWentWell(["", "", ""]);
    setMood(undefined);
    setSaved(false);
    setShowCelebration(false);
    setCelebrationMsg("");
    setGoalRefGoalId("");
    setGoalReflectionSnippet("");
    setGoalReflectionExpanded(false);
    setSavedSlot(null);
    setCurrentAffirmationIndex(0);

    // Scroll to top when opening this journal slot (same component, so useResetZoom doesn't run again)
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, [slot]);

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
    if (savingRef.current) return;
    savingRef.current = true;
    // #region agent log
    try {
      fetch('http://127.0.0.1:7364/ingest/30a0ac4f-5fce-458c-b200-f87651f3e5d6',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a90958'},body:JSON.stringify({sessionId:'a90958',runId:'journal-save',hypothesisId:'A_C_E',location:'Journal.tsx:save()',message:'save() invoked',data:{slot,textLen:text.trim().length,ts:Date.now()},timestamp:Date.now()})}).catch(()=>{});
    } catch (_) {}
    // #endregion
    const isMorning = slot === "morning";
    addEntry({
      text: text.trim(),
      categories: cats,
      values: vals,
      gratitude: isMorning ? grat.filter(Boolean) : [],
      wentWell: !isMorning ? wentWell.filter(Boolean) : undefined,
      mood,
      slot: slot,
      goalRef: goalRefGoalId ? { goalId: goalRefGoalId, snippet: goalReflectionSnippet.trim() || undefined } : undefined,
    });
    setSaved(true);
    setSavedSlot(slot);

    // Check for milestones and show celebration
    const newStreak = calculateStreak([
      {
        id: String(getCurrentTime()),
        createdAt: getCurrentTime(),
        text: text.trim(),
        categories: cats,
        values: vals,
        gratitude: isMorning ? grat.filter(Boolean) : [],
        wentWell: !isMorning ? wentWell.filter(Boolean) : undefined,
        mood,
        slot,
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
    setTimeout(() => {
      savingRef.current = false;
    }, 500);
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
            "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
        }}
      >
        {/* Thank-you modal when user has already journaled for this slot today */}
        {locked && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: 20,
                padding: 24,
                maxWidth: 400,
                width: "100%",
                boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>📓</div>
              <p
                style={{
                  margin: "0 0 24px",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#3b3b3b",
                  lineHeight: 1.5,
                  maxWidth: 360,
                }}
              >
                Journal submitted, thanks — journaling helps you reflect and grow your Inner Code. Come back tomorrow to journal again.
              </p>
              <button
                type="button"
                onClick={onBack}
                style={{
                  padding: "16px 32px",
                  borderRadius: 999,
                  border: "none",
                  background: "linear-gradient(135deg, #6A3ABF, #8B5CF6)",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(106, 58, 191, 0.35)",
                }}
              >
                Back to dashboard
              </button>
            </div>
          </div>
        )}

        <div className="page" style={{ paddingTop: "70px" }}>
        {!locked && (
        <>
        {/* Header: emoji + title centered, streak badge on right */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }} />
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {slot === "morning" ? "☀️" : "🌙"}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: "#3b3b3b",
              }}
            >
              {slot === "morning" ? "Morning journal" : "Evening journal"}
            </p>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", minWidth: 0 }}>
            {streak > 0 && (
              <div
                style={{
                  background: streak >= 7 ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "rgba(139,92,246,0.1)",
                  border: streak >= 7 ? "2px solid #f59e0b" : "1px solid rgba(139,92,246,0.3)",
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: 10, lineHeight: 1 }}>{streak >= 7 ? "🔥" : "📅"}</span> {streak} day streak
              </div>
            )}
          </div>
        </div>

        {/* Affirmations carousel: between title and How Journaling Works (morning and evening) */}
        {carouselItems.length > 0 && (
          <>
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
                key={currentAffirmationIndex}
                style={{
                  animation: "slideUpFade 0.6s ease-out",
                }}
              >
                <div style={{ fontSize: 14, color: "#4b4b4b", fontStyle: "italic", lineHeight: 1.5 }}>
                  {carouselItems[currentAffirmationIndex % carouselItems.length].text}
                </div>
              </div>
            </div>
            <style>{`
              @keyframes slideUpFade {
                0% { opacity: 0; transform: translateY(20px); }
                100% { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </>
        )}

        {/* Explainer */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.25))",
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
        {(hasMorningToday && slot === "morning") || (hasEveningToday && slot === "evening") ? (
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
            You've already added an {slot} entry today. You can add the other slot or come back tomorrow.
          </div>
        ) : null}

        {/* Composer */}
        <div
          className={locked ? "locked" : ""}
          style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              slot === "morning"
                ? "Write what comes to mind. How are you structuring your day? Anything you're looking forward to?"
                : "Reflect on your day. Did you do any of the suggested activities? How did you get on?"
            }
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

          {/* Morning: Gratitude. Evening: 3 things that went well */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 20 }}>{slot === "morning" ? "🌤️" : "✨"}</span>
              <strong>{slot === "morning" ? "3 things you're grateful for" : "3 things that went well today"}</strong>
            </div>
            <div style={{ color: "#4b4b4b", fontSize: 14, marginBottom: 8 }}>
              {slot === "morning"
                ? "Start the day with gratitude. Name three specifics."
                : "End the day by noting what went well."}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <input
                  key={i}
                  placeholder={`${i + 1}) …`}
                  value={slot === "morning" ? grat[i] : wentWell[i]}
                  disabled={locked}
                  onChange={(e) => {
                    if (slot === "morning") {
                      const n = [...grat];
                      n[i] = e.target.value;
                      setGrat(n);
                    } else {
                      const n = [...wentWell];
                      n[i] = e.target.value;
                      setWentWell(n);
                    }
                  }}
                  style={{
                    border: "2px solid rgba(106, 58, 191, 0.2)",
                    borderRadius: 12,
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.9)",
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
                      background: "rgba(255,255,255,0.9)",
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
                        background: "rgba(255,255,255,0.9)",
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
        </>
        )}
        </div>
      </div>
    </>
  );
}

