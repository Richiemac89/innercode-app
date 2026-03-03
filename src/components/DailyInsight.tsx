// Daily Insight Component
// Displays AI-generated pattern insights on the dashboard

import { DailyInsight as DailyInsightType } from "../types";

interface DailyInsightProps {
  insight: DailyInsightType;
  onTalkAboutIt: (context: any) => void;
  onDismiss: () => void;
}

export function DailyInsight({ insight, onTalkAboutIt, onDismiss }: DailyInsightProps) {
  // Get emoji based on insight type
  const getInsightEmoji = () => {
    switch (insight.pattern.type) {
      case "scoreDrop":
        return "📉";
      case "neglectedCategory":
        return "⏰";
      case "valueDisconnect":
        return "🤔";
      case "repeatedWords":
        return "💭";
      default:
        return "💡";
    }
  };

  return (
    <div
      style={{
        marginBottom: 24,
        padding: "20px",
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
        border: "2px solid #8B5CF6",
        borderRadius: 16,
        boxShadow: "0 4px 16px rgba(106, 58, 191, 0.15)",
        animation: "slideUpFade 0.6s ease-out",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            fontSize: 28,
            animation: "float 3s ease-in-out infinite",
          }}
        >
          {getInsightEmoji()}
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#5b21b6", flex: 1 }}>
          Daily Insight
        </h3>
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 20,
            color: "#9ca3af",
            cursor: "pointer",
            padding: 4,
            transition: "all 0.2s",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#6b7280";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#9ca3af";
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      {/* Inny noticed something */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          color: "#6d28d9",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{ fontSize: 18 }}>🧠</span>
          Inny noticed something...
        </div>
      </div>

      {/* Insight Text */}
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "#4b4b4b",
          marginBottom: 16,
          whiteSpace: "pre-wrap",
        }}
      >
        "{insight.text}"
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => onTalkAboutIt(insight.pattern)}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(124,58,237,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(124,58,237,0.3)";
          }}
        >
          💬 Talk About This
        </button>
        
        <button
          onClick={onDismiss}
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            border: "2px solid #8B5CF6",
            background: "white",
            color: "#8B5CF6",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f3f4f6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "white";
          }}
        >
          👍 Got It
        </button>
      </div>

      {/* Animations */}
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
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}







