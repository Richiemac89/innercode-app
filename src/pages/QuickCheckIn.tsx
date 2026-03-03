// Quick Check-In Page
// Weekly re-rating of life areas

import { useState, useEffect } from "react";
import { CATEGORY_ICONS } from "../constants/categories";
import { aiService } from "../utils/aiService";
import { 
  CheckInEntry, 
  calculateCheckInChanges, 
  saveCheckIn, 
  saveCategorySnapshot 
} from "../utils/checkInLogic";
import { FEATURES } from "../constants/featureFlags";
import { getCurrentTime } from "../utils/helpers";
import { JournalSnapshotEntry } from "../utils/contextBuilders";

interface QuickCheckInProps {
  areas: string[];
  currentScores: Record<string, number>;
  onComplete: (updatedScores: Record<string, number>) => void;
  onBack: () => void;
  onboardingAnswers?: string[];
  journalSummary?: string;
  recentJournalEntries?: JournalSnapshotEntry[];
}

export function QuickCheckIn({
  areas,
  currentScores,
  onComplete,
  onBack,
  onboardingAnswers = [],
  journalSummary = "",
  recentJournalEntries = [],
}: QuickCheckInProps) {
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string>("");

  // Initialize ratings with current scores
  useEffect(() => {
    const initialRatings: Record<string, number> = {};
    areas.forEach(area => {
      initialRatings[area] = currentScores[area] || 5;
    });
    setRatings(initialRatings);
  }, [areas, currentScores]);

  const currentArea = areas[currentAreaIndex];
  const isLastArea = currentAreaIndex === areas.length - 1;

  const handleRatingChange = (score: number) => {
    setRatings(prev => ({ ...prev, [currentArea]: score }));
  };

  const handleNoteChange = (note: string) => {
    setNotes(prev => ({ ...prev, [currentArea]: note }));
  };

  const handleNext = async () => {
    if (isLastArea) {
      // Generate summary and save
      await saveCheckInToHistory();
      generateSummary();
      setShowSummary(true);
    } else {
      setCurrentAreaIndex(prev => prev + 1);
    }
  };

  const saveCheckInToHistory = async () => {
    const checkInEntry: CheckInEntry = {
      id: `checkin-${getCurrentTime()}`,
      timestamp: getCurrentTime(),
      ratings: areas.map(area => ({
        category: area,
        oldScore: currentScores[area] || 5,
        newScore: ratings[area] || currentScores[area] || 5,
      })),
      note: Object.values(notes).filter(Boolean).join("; "),
    };

    await saveCheckIn(checkInEntry);
    
    // Save snapshot of new scores
    await saveCategorySnapshot(ratings);
  };

  const generateSummary = async () => {
    const changes = calculateCheckInChanges(currentScores, ratings);
    const summaryText = await aiService.generateCheckInSummary(changes, {
      categoryScores: ratings,
      completedCategories: areas,
      valueEntries: [],
      onboardingAnswers,
      journalSummary,
      recentJournalEntries,
    });
    setSummary(summaryText);
  };

  const handleComplete = () => {
    onComplete(ratings);
  };

  if (showSummary) {
    const changes = calculateCheckInChanges(currentScores, ratings);
    
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
          padding: 20,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: "70px" }}>
          {/* Summary */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#3b3b3b" }}>
              Check-In Complete!
            </h1>
          </div>

          {/* Changes Summary */}
          <div style={{ marginBottom: 24 }}>
            {summary && (
              <div
                style={{
                  background: "white",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 20,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "#4b4b4b" }}>
                  {summary}
                </p>
              </div>
            )}

            {/* Improvements */}
            {changes.improvements.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#10b981", marginBottom: 12 }}>
                  ⬆️ Improving
                </h3>
                {changes.improvements.map(change => (
                  <div
                    key={change.category}
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #bbf7d0",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#065f46" }}>
                      {CATEGORY_ICONS[change.category]} {change.category}
                    </div>
                    <div style={{ fontSize: 14, color: "#047857" }}>
                      {change.oldScore} → {change.newScore} (+{change.newScore - change.oldScore})
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Declines */}
            {changes.declines.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#ef4444", marginBottom: 12 }}>
                  ⬇️ Declining
                </h3>
                {changes.declines.map(change => (
                  <div
                    key={change.category}
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#991b1b" }}>
                      {CATEGORY_ICONS[change.category]} {change.category}
                    </div>
                    <div style={{ fontSize: 14, color: "#dc2626" }}>
                      {change.oldScore} → {change.newScore} ({change.newScore - change.oldScore})
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Stable */}
            {changes.stable.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#6b7280", marginBottom: 12 }}>
                  → Stable
                </h3>
                {changes.stable.map(change => (
                  <div
                    key={change.category}
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#4b5563" }}>
                      {CATEGORY_ICONS[change.category]} {change.category}
                    </div>
                    <div style={{ fontSize: 14, color: "#6b7280" }}>
                      Score: {change.score}/10
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleComplete}
              style={{
                flex: 1,
                padding: "16px 24px",
                borderRadius: 16,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer",
                boxShadow: "0 10px 24px rgba(124,58,237,0.35)",
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: "70px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: "#3b3b3b" }}>
            Quick Check-In
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: 16, marginTop: 8 }}>
            How are these areas this week?
          </p>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: "#6b6b6b", marginBottom: 8 }}>
            {currentAreaIndex + 1} of {areas.length}
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              background: "rgba(139,92,246,0.2)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "linear-gradient(90deg, #8B5CF6, #7C3AED)",
                width: `${((currentAreaIndex + 1) / areas.length) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Current Area */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>
              {CATEGORY_ICONS[currentArea]}
            </div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#3b3b3b" }}>
              {currentArea}
            </h2>
            <p style={{ color: "#6b6b6b", fontSize: 14, marginTop: 4 }}>
              Last check: {currentScores[currentArea] || 5}/10
            </p>
          </div>

          {/* Rating Slider */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#3b3b3b", marginBottom: 16 }}>
              How is it NOW?
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#6b21a8" }}>0</span>
              <span style={{ fontSize: 12, color: "#6b21a8" }}>10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={ratings[currentArea] || currentScores[currentArea] || 5}
              onChange={(e) => handleRatingChange(parseInt(e.target.value))}
              style={{
                width: "100%",
                height: 8,
                borderRadius: 999,
                background: "linear-gradient(to right, #6B21A8, #8B5CF6)",
                outline: "none",
                WebkitAppearance: "none",
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #6B21A8;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(106, 33, 168, 0.35);
              }

              input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #6B21A8;
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 8px rgba(106, 33, 168, 0.35);
              }
            `}</style>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: "#8B5CF6" }}>
                {ratings[currentArea] || currentScores[currentArea] || 5}
              </div>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#3b3b3b", display: "block", marginBottom: 8 }}>
              Optional: What changed?
            </label>
            <textarea
              value={notes[currentArea] || ""}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="E.g., 'Started new bedtime routine' or 'Work pressure increased'"
              rows={3}
              style={{
                width: "100%",
                border: "2px solid rgba(106, 58, 191, 0.2)",
                borderRadius: 12,
                padding: "12px 14px",
                background: "#fafafa",
                resize: "vertical",
                fontSize: 14,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          {currentAreaIndex > 0 && (
            <button
              onClick={() => setCurrentAreaIndex(prev => prev - 1)}
              style={{
                padding: "16px 24px",
                borderRadius: 16,
                border: "2px solid #8B5CF6",
                background: "white",
                color: "#8B5CF6",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              flex: 1,
              padding: "16px 24px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 10px 24px rgba(124,58,237,0.35)",
            }}
          >
            {isLastArea ? "Complete Check-In" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}

