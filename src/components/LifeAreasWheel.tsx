import { useState } from "react";
import { CATEGORY_ICONS } from "../constants/categories";
import { objEntries } from "../utils/helpers";
import { PhaseProgressBadge } from "./PhaseProgressBadge";
import { getPhaseStatus, canUnlockPhase2 } from "../utils/phaseUnlocking";
import { CategoryPhase } from "../types";
import { FEATURES } from "../constants/featureFlags";

interface LifeAreasWheelProps {
  categoryScores: Record<string, number>;
  completedCategories: string[];
  categoryPhases?: Record<string, CategoryPhase>;
  onDeepenCategory?: (category: string) => void;
  journalEntries?: import("../types").JournalEntry[];
}

export function LifeAreasWheel({ categoryScores, completedCategories, categoryPhases = {}, onDeepenCategory, journalEntries = [] }: LifeAreasWheelProps) {
  const entries = objEntries(categoryScores ?? {});
  
  // Collapsible state
  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [incompleteExpanded, setIncompleteExpanded] = useState(false);
  
  if (!entries.length) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div>Complete your assessment to see your life areas</div>
      </div>
    );
  }

  // Separate completed and incomplete assessments
  const completedEntries = entries.filter(([category]) => completedCategories.includes(category));
  const incompleteEntries = entries.filter(([category]) => !completedCategories.includes(category));
  
  // Sort completed by priority (lowest scores first = highest priority)
  const sortedCompleted = completedEntries.sort((a, b) => a[1] - b[1]);
  const sortedIncomplete = incompleteEntries.sort((a, b) => a[1] - b[1]);

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#374151" }}>
          Your Life Areas
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>
          Priority order: lowest scores need attention first
        </p>
      </div>

      {/* Completed Assessments - Full Size */}
      {sortedCompleted.length > 0 && (
        <>
          <div 
            style={{ 
              marginBottom: 16,
              cursor: "pointer",
              padding: "8px 0",
              borderBottom: "1px solid #e5e7eb"
            }}
            onClick={() => setCompletedExpanded(!completedExpanded)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#374151" }}>
                ✅ Completed Assessments ({sortedCompleted.length})
              </h4>
              <div style={{ fontSize: 18, color: "#6b7280", transform: completedExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                ▼
              </div>
            </div>
          </div>
          {completedExpanded && (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
              gap: 16,
              marginBottom: 24
            }}>
              {sortedCompleted.map(([category, score], index) => {
              const percentage = (score / 10) * 100;
              
              // Color coding based on score
              const getScoreColor = (score: number) => {
                if (score <= 3) return "#ef4444"; // red
                if (score <= 6) return "#f59e0b"; // amber
                return "#10b981"; // green
              };
              
              const getScoreLabel = (score: number) => {
                if (score <= 3) return "Needs Attention";
                if (score <= 6) return "Room to Grow";
                return "Thriving";
              };

              return (
                <div
                  key={category}
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 16,
                    padding: 20,
                    border: "2px solid #e5e7eb",
                    position: "relative",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Priority Badge - Only for completed assessments */}
                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: index === 0 ? "#fee2e2" : index === 1 ? "#fef3c7" : "#f0fdf4",
                      color: index === 0 ? "#dc2626" : index === 1 ? "#d97706" : "#059669",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 12,
                    }}
                  >
                    Priority #{index + 1}
                  </div>

                  {/* Category Icon & Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 24, flexShrink: 0 }}>{CATEGORY_ICONS[category]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: 16, 
                        fontWeight: 600, 
                        color: "#374151",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}>
                        {category}
                      </h4>
                      <div
                        style={{
                          fontSize: 12,
                          color: getScoreColor(score),
                          fontWeight: 500,
                        }}
                      >
                        {getScoreLabel(score)}
                      </div>
                    </div>
                  </div>

                  {/* Score Visualization */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: "#6b7280" }}>Your Score</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
                        {score}/10
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        background: "#f3f4f6",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${percentage}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${getScoreColor(score)} 0%, ${getScoreColor(score)}80 100%)`,
                          borderRadius: 4,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ fontSize: 16 }}>✅</div>
                    <span style={{ fontSize: 14, color: "#059669", fontWeight: 500 }}>
                      Assessment Complete
                    </span>
                  </div>
                  
                  {/* 👇 PROGRESSIVE DEEPENING FEATURE START */}
                  {FEATURES.PROGRESSIVE_DEEPENING && (
                    <>
                      {/* Phase Badges */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        <PhaseProgressBadge 
                          phase={1} 
                          completed={true} 
                          locked={false} 
                        />
                        {categoryPhases[category]?.phase2Complete && (
                          <PhaseProgressBadge 
                            phase={2} 
                            completed={true} 
                            locked={false} 
                          />
                        )}
                        {categoryPhases[category]?.phase3Complete && (
                          <PhaseProgressBadge 
                            phase={3} 
                            completed={true} 
                            locked={false} 
                          />
                        )}
                      </div>
                      
                      {/* Deepen Button */}
                      {onDeepenCategory && canUnlockPhase2({ categoryPhases, journalEntries, category }) && (
                        <button
                          onClick={() => onDeepenCategory(category)}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            borderRadius: 12,
                            border: "2px solid #8B5CF6",
                            background: "rgba(255,255,255,0.9)",
                            color: "#8B5CF6",
                            fontWeight: 600,
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#8B5CF6";
                            e.currentTarget.style.color = "white";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "white";
                            e.currentTarget.style.color = "#8B5CF6";
                          }}
                        >
                          🌱 Deepen This Area
                        </button>
                      )}
                    </>
                  )}
                  {/* 👆 PROGRESSIVE DEEPENING FEATURE END */}
                </div>
              );
              })}
            </div>
          )}
        </>
      )}

      {/* Incomplete Assessments - Smaller, Greyed Out */}
      {sortedIncomplete.length > 0 && (
        <>
          <div 
            style={{ 
              marginBottom: 16,
              cursor: "pointer",
              padding: "8px 0",
              borderBottom: "1px solid #e5e7eb"
            }}
            onClick={() => setIncompleteExpanded(!incompleteExpanded)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#6b7280" }}>
                ⏳ Not Yet Assessed ({sortedIncomplete.length})
              </h4>
              <div style={{ fontSize: 18, color: "#6b7280", transform: incompleteExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
                ▼
              </div>
            </div>
          </div>
          {incompleteExpanded && (
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: 12,
              marginBottom: 24
            }}>
              {sortedIncomplete.map(([category, score]) => (
              <div
                key={category}
                style={{
                  background: "#f9fafb",
                  borderRadius: 12,
                  padding: 16,
                  border: "1px solid #e5e7eb",
                  opacity: 0.7,
                  transform: "scale(0.95)",
                }}
              >
                {/* Category Icon & Name */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontSize: 20, opacity: 0.6, flexShrink: 0 }}>{CATEGORY_ICONS[category]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ 
                      margin: 0, 
                      fontSize: 14, 
                      fontWeight: 500, 
                      color: "#6b7280",
                      wordWrap: "break-word",
                      overflowWrap: "break-word",
                    }}>
                      {category}
                    </h5>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Default Score
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 14, opacity: 0.6 }}>⏳</div>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    Complete assessment to see your score
                  </span>
                </div>
              </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Summary Stats */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(124,58,237,0.25))",
        borderRadius: 12,
        textAlign: "center"
      }}>
        <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 4 }}>
          Assessment Progress
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: "#374151" }}>
          {completedCategories.length} of {entries.length} areas completed
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          {completedCategories.length < entries.length 
            ? "Complete more areas for a fuller picture" 
            : "Great job! You've completed all areas"}
        </div>
        {completedCategories.length > 0 && (
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
            Priority order: Lowest scores need attention first
          </div>
        )}
      </div>
    </div>
  );
}
