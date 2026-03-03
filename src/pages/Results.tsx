import { useEffect, useState } from "react";
import { Callout } from "../components/Callout";
import { SpiderGraph } from "../components/SpiderGraph";
import { LifeAreasWheel } from "../components/LifeAreasWheel";
import { ValuesLeague } from "../components/ValuesLeague";
import { InnerCode } from "../components/InnerCode";
import { MoodTrends } from "../components/MoodTrends";
import { Celebration } from "../components/Celebration";
import { JournalEntry } from "../types";
import { dayKeyFromTs, getCurrentTime } from "../utils/helpers";
import { useResetZoom } from "../utils/useResetZoom";

export function Results({
  personalCode,
  aligned,
  improvement,
  valueEntries,
  categoryScores,
  completedCategories,
  totalCategories,
  journalEntries,
  suggestions,
  weakAreaSuggestions,
  valueStrengthSuggestions,
  discoveryAreaSuggestions,
  onOpenJournal,
  onRecompute,
  showExpansionSuccess,
  onExpansionSuccessComplete,
  userName,
  categoryPhases,
  onDeepenCategory,
  pendingReveal,
  onCelebrationComplete,
}: {
  personalCode: string;
  aligned: string[];
  improvement: string[];
  valueEntries: [string, number][];
  categoryScores: Record<string, number>;
  completedCategories: string[];
  totalCategories: number;
  journalEntries?: JournalEntry[];
  suggestions?: import("../components/SuggestionCard").Suggestion[];
  weakAreaSuggestions?: import("../components/SuggestionCard").Suggestion[];
  valueStrengthSuggestions?: import("../components/SuggestionCard").Suggestion[];
  discoveryAreaSuggestions?: import("../components/SuggestionCard").Suggestion[];
  onOpenJournal?: () => void;
  onRecompute?: () => void;
  showExpansionSuccess?: boolean;
  onExpansionSuccessComplete?: () => void;
  userName?: string;
  categoryPhases?: Record<string, import("../types").CategoryPhase>;
  onDeepenCategory?: (category: string) => void;
  pendingReveal?: boolean;
  onCelebrationComplete?: () => void;
}) {
  // Reset zoom and scroll to top when component mounts
  useResetZoom();

  // Collapsible state for suggestion sections
  const [weakAreasExpanded, setWeakAreasExpanded] = useState(true);
  const [valuesExpanded, setValuesExpanded] = useState(true);
  const [discoveryExpanded, setDiscoveryExpanded] = useState(true);

  // Celebration animation on first view
  const [showCelebration, setShowCelebration] = useState(() => !!pendingReveal);
  useEffect(() => {
    setShowCelebration(!!pendingReveal);
  }, [pendingReveal]);

  // Auto-recompute if missing new suggestion fields
  useEffect(() => {
    if ((!suggestions || suggestions.length === 0 || !weakAreaSuggestions || !valueStrengthSuggestions || !discoveryAreaSuggestions) && 
        completedCategories.length > 0 && 
        onRecompute) {
      console.log("Auto-recomputing results with new suggestion system (including discovery)...");
      onRecompute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <>
      {/* Celebration Animation - First Time */}
      <Celebration
        show={showCelebration}
        message="Your InnerCode is Ready!"
        emoji="🎉"
        onComplete={() => {
          setShowCelebration(false);
          onCelebrationComplete?.();
        }}
      />

      {/* Celebration Animation - Expansion Success */}
      <Celebration
        show={!!showExpansionSuccess}
        message="Your Results Have Been Updated!"
        emoji="✨"
        onComplete={() => {
          onExpansionSuccessComplete?.();
        }}
      />

      <div
        style={{
          minHeight: "100vh",
          background:
            "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
        }}
      >
      <div style={{ maxWidth: 980, margin: "0 auto", padding: 18, paddingTop: "70px" }}>
        {/* Welcome Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
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
            Your InnerCode Results
          </p>
        </div>

        {/* Category Progress Banner */}
        {completedCategories.length < totalCategories && (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
              border: "2px solid #8B5CF6",
              padding: "16px 20px",
              borderRadius: 16,
              marginBottom: 24,
              textAlign: "center",
            }}
          >
            <strong style={{ color: "#5b21b6", display: "block", marginBottom: 4 }}>
              📊 Exploring {completedCategories.length} of {totalCategories} Life Areas
            </strong>
            <div style={{ color: "#6d28d9", fontSize: 14 }}>
              Complete more areas from your dashboard for deeper insights!
            </div>
          </div>
        )}

        {/* YOUR INNERCODE */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <InnerCode 
            personalCode={personalCode}
            valueEntries={valueEntries}
            categoryScores={categoryScores}
            completedCategories={completedCategories}
          />
        </div>

        {/* SECTION 0 — Mood Trends */}
        {journalEntries && journalEntries.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <MoodTrends entries={journalEntries} />
          </section>
        )}

        {/* SECTION 1 — Category Focus */}
        <section style={{ marginBottom: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 24 }}>📊</span>
            <h2 style={{ margin: 0 }}>Category Focus — weakest first</h2>
          </div>
          {/* Quick Insight */}
          <div style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            textAlign: "center"
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#374151", marginBottom: 4 }}>
              Focus on your lowest scores first
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Improving weak areas creates the biggest impact on overall wellbeing
            </div>
          </div>
          {(() => {
            const adj = Object.assign({}, categoryScores);
            if (journalEntries && journalEntries.length) {
              const cutoff = getCurrentTime() - 14 * 24 * 60 * 60 * 1000;
              const counts = {} as Record<string, number>;
              journalEntries.forEach((e) => {
                if (e.category && e.createdAt >= cutoff) {
                  counts[e.category] = (counts[e.category] || 0) + 1;
                }
              });
              Object.keys(counts).forEach((cat) => {
                const boost = counts[cat] >= 7 ? 2 : counts[cat] >= 3 ? 1 : 0;
                if (boost > 0) {
                  adj[cat] = Math.min(10, (adj[cat] || 0) + boost);
                }
              });
            }
            return (
              <>
                {/* Spider Graph - Visual Overview */}
                <SpiderGraph 
                  categoryScores={adj}
                  completedCategories={completedCategories}
                />
                
                {/* Detailed Card Priority View */}
                <LifeAreasWheel 
                  categoryScores={adj} 
                  completedCategories={completedCategories}
                  categoryPhases={categoryPhases}
                  onDeepenCategory={onDeepenCategory}
                  journalEntries={journalEntries}
                />
              </>
            );
          })()}
        </section>

        {/* SECTION 2 — Values League (Collapsible) */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            overflow: "hidden",
          }}
        >
          <ValuesLeague valueEntries={valueEntries} />
        </div>

        {/* Journal CTA */}
        <section>
          {onOpenJournal && (
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={onOpenJournal}
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  borderRadius: "50px",
                  border: "none",
                  background: "#6A3ABF",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "18px",
                  cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: "translateY(0)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "translateY(0px) scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px) scale(1)";
                }}
              >
                📓 Journal now
              </button>
            </div>
          )}

        </section>
      </div>
    </div>
    </>
  );
}

