// Daily Sparks Component
// Dashboard section with 3 daily micro-actions

import { useState } from "react";
import { MicroAction } from "../constants/microActions";
import { MicroActionCard } from "./MicroActionCard";
import { calculateSparkStreak } from "../utils/sparkSelection";
import { Celebration } from "./Celebration";

interface DailySparksProps {
  sparks: MicroAction[];
  completedSparkIds: string[];
  onSparkComplete: (sparkId: string) => void;
}

export function DailySparks({ sparks, completedSparkIds, onSparkComplete }: DailySparksProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMsg, setCelebrationMsg] = useState("");
  
  const handleComplete = (sparkId: string) => {
    // CRITICAL FIX: Check if already completed BEFORE calling onSparkComplete
    if (completedSparkIds.includes(sparkId)) {
      return; // Already completed, don't do anything
    }
    
    onSparkComplete(sparkId);
    
    const completionCount = completedSparkIds.length + 1;
    const streak = calculateSparkStreak();
    
    // Celebration messages
    if (completionCount === 3) {
      setCelebrationMsg(`🔥 All sparks complete! ${streak}-day streak`);
    } else if (completionCount === 1) {
      setCelebrationMsg("✨ First spark complete! Keep going!");
    } else {
      setCelebrationMsg("✨ Spark complete! Great job!");
    }
    
    setShowCelebration(true);
  };
  
  const allComplete = completedSparkIds.length === 3;
  const streak = calculateSparkStreak();
  
  return (
    <>
      <Celebration
        show={showCelebration}
        message={celebrationMsg}
        emoji="🎉"
        onComplete={() => setShowCelebration(false)}
      />
      
      <div style={{ marginBottom: 24 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#3b3b3b" }}>
              ✨ Today's Sparks
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b6b6b" }}>
              Complete 3 quick actions to build momentum
            </p>
          </div>
          {streak > 0 && (
            <div
              style={{
                background: streak >= 7 ? "linear-gradient(135deg, #fef3c7, #fde68a)" : "rgba(139,92,246,0.1)",
                border: streak >= 7 ? "2px solid #f59e0b" : "1px solid rgba(139,92,246,0.3)",
                padding: "4px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                color: streak >= 7 ? "#92400e" : "#6A3ABF",
                whiteSpace: "nowrap",
              }}
            >
              {streak >= 7 ? "🔥" : "✨"} {streak} day{streak !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        
        {/* Progress */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: "#6b6b6b", marginBottom: 8 }}>
            Progress: {completedSparkIds.length} / 3 complete{allComplete ? " • Keep going! 💪" : ""}
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
                width: `${(completedSparkIds.length / 3) * 100}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
        
        {/* All Complete Message */}
        {allComplete && (
          <div
            style={{
              background: "linear-gradient(135deg, #fef3c7, #fde68a)",
              border: "2px solid #f59e0b",
              padding: "12px 16px",
              borderRadius: 12,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            <strong style={{ color: "#92400e" }}>
              🔥 Amazing! All sparks complete today! {streak}-day streak going strong
            </strong>
          </div>
        )}
        
        {/* Spark Cards */}
        <div style={{ display: "grid", gap: 12 }}>
          {sparks.map((spark) => (
            <MicroActionCard
              key={spark.id}
              action={spark}
              completed={completedSparkIds.includes(spark.id)}
              onComplete={() => handleComplete(spark.id)}
            />
          ))}
        </div>
        
        {/* Info */}
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 12, textAlign: "center" }}>
          New sparks unlock tomorrow at midnight
        </div>
      </div>
    </>
  );
}

