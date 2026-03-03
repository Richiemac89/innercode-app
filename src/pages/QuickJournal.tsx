import { useState, useEffect } from "react";
import { Celebration } from "../components/Celebration";
import { JournalEntry } from "../types";
import { dayKeyFromTs, getCurrentTime } from "../utils/helpers";
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

interface QuickJournalProps {
  onBack: () => void;
  entries: JournalEntry[];
  addEntry: (e: Omit<JournalEntry, "id" | "createdAt">) => void;
}

export function QuickJournal({
  onBack,
  entries,
  addEntry,
}: QuickJournalProps) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState<string | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");

  const todayKey = dayKeyFromTs(getCurrentTime());
  const hasToday = entries.some((e) => dayKeyFromTs(e.createdAt) === todayKey);
  const locked = hasToday || saved;
  const streak = calculateStreak(entries);

  // Reset zoom and scroll to top when component mounts
  useResetZoom();

  function save() {
    if (!text.trim() || locked) return;
    addEntry({
      text: text.trim(),
      categories: [],
      values: [],
      gratitude: [],
      mood,
    });
    setSaved(true);

    // Check for milestones and show celebration
    const newStreak = calculateStreak([
      {
        id: String(getCurrentTime()),
        createdAt: getCurrentTime(),
        text: text.trim(),
        categories: [],
        values: [],
        gratitude: [],
        mood,
      },
      ...entries,
    ]);

    // Always celebrate journal entries!
    if (entries.length === 0) {
      setCelebrationMsg("Your first journal entry! 🌱");
    } else if (newStreak === 7) {
      setCelebrationMsg("7-Day Streak! You're on fire! 🔥");
    } else if (newStreak === 30) {
      setCelebrationMsg("30 Days Strong! Incredible! 💪");
    } else if (newStreak % 10 === 0 && newStreak >= 10) {
      setCelebrationMsg(`${newStreak} Days! Keep going! ⭐`);
    } else {
      // Regular entry celebration
      const messages = [
        "Entry saved! 📝",
        "Great reflection! ✨",
        "Keep it up! 🌟",
        "You're doing amazing! 💫",
        "Beautiful thoughts! 🌸"
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
        emoji="⚡"
        onComplete={() => setShowCelebration(false)}
      />
      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(16,185,129,0.10))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div style={{ maxWidth: 600, width: "100%" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <button
              onClick={onBack}
              style={{
                background: "transparent",
                border: "1px solid rgba(0, 0, 0, 0.1)",
                borderRadius: "8px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                opacity: 0.7,
                color: "#6b7280",
                fontSize: "13px",
                fontWeight: 500,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.7";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Back
            </button>
            <h2 style={{ margin: 0, fontSize: 24 }}>⚡ Quick Journal</h2>
            {streak > 0 && (
              <div
                style={{
                  background:
                    streak >= 7
                      ? "linear-gradient(135deg, #fef3c7, #fde68a)"
                      : "rgba(139,92,246,0.1)",
                  border:
                    streak >= 7
                      ? "2px solid #f59e0b"
                      : "1px solid rgba(139,92,246,0.3)",
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginLeft: "auto",
                }}
              >
                {streak >= 7 ? "🔥" : "📅"} {streak}
              </div>
            )}
          </div>

          <p style={{ color: "#6b6b6b", fontSize: 14, marginBottom: 20 }}>
            Quick capture your thoughts. Just text + mood. Takes 30 seconds.
          </p>

          {/* Success/Lock Banner */}
          {saved && (
            <div
              className="fadeInUp"
              style={{
                background: "#ecfdf5",
                border: "1px solid #bbf7d0",
                color: "#065f46",
                padding: "14px 18px",
                borderRadius: 16,
                marginBottom: 20,
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              ✓ Saved! See you tomorrow.
            </div>
          )}
          {hasToday && !saved && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#9a3412",
                padding: "14px 18px",
                borderRadius: 16,
                marginBottom: 20,
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              You've already journaled today! Come back tomorrow.
            </div>
          )}

          {/* Quick Entry Card */}
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
              opacity: locked ? 0.6 : 1,
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How was your day? What's on your mind?"
              rows={6}
              style={{
                width: "100%",
                resize: "vertical",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 16,
                background: "#fafafa",
                outline: "none",
              }}
              disabled={locked}
            />

            {/* Quick Mood Selector */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
                How are you feeling?
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {["😭", "☹️", "😐", "🙂", "😄"].map((face) => (
                  <button
                    key={face}
                    onClick={() => setMood(face)}
                    disabled={locked}
                    style={{
                      fontSize: 32,
                      borderRadius: 12,
                      padding: "10px 14px",
                      border:
                        mood === face
                          ? "3px solid #8B5CF6"
                          : "2px solid #e5e7eb",
                      background: mood === face ? "rgba(139,92,246,0.1)" : "#fff",
                      cursor: locked ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {face}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={save}
              disabled={locked || !text.trim()}
              style={{
                marginTop: 24,
                width: "100%",
                padding: "16px",
                borderRadius: 12,
                border: "none",
                background:
                  locked || !text.trim()
                    ? "#d1d5db"
                    : "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
                cursor: locked || !text.trim() ? "not-allowed" : "pointer",
                boxShadow:
                  locked || !text.trim()
                    ? "none"
                    : "0 10px 24px rgba(124,58,237,0.35)",
                transition: "all 0.2s",
              }}
            >
              ⚡ Quick Save
            </button>
          </div>

          {/* Link to full journal */}
          <div
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 14,
              color: "#6b6b6b",
            }}
          >
            Want to add more details?{" "}
            <button
              onClick={() => onBack()}
              style={{
                background: "transparent",
                border: "none",
                color: "#7C3AED",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Use full journal
            </button>
          </div>
        </div>
      </div>
    </>
  );
}


