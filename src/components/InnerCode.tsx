import { VALUE_ICONS } from "../constants/values";

interface InnerCodeProps {
  personalCode: string;
  valueEntries: [string, number][];
  categoryScores: Record<string, number>;
  completedCategories: string[];
}

export function InnerCode({ 
  personalCode, 
  valueEntries, 
  categoryScores, 
  completedCategories 
}: InnerCodeProps) {
  const topValues = valueEntries.slice(0, 3);

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🧬</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#374151" }}>
          Your InnerCode
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>
          Your unique combination of values and insights
        </p>
      </div>

      {/* Personal Code */}
      <div style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
        border: "1px solid rgba(139,92,246,0.2)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16
      }}>
        <div style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 8,
          fontWeight: 600
        }}>
          Your InnerCode
        </div>
        <div style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "#374151"
        }}>
          {personalCode}
        </div>
      </div>

      {/* Benefits of Values Alignment */}
      <div style={{
        background: "rgba(249, 250, 251, 0.5)",
        borderRadius: 12,
        padding: 16,
      }}>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#6A3ABF",
          marginBottom: 12,
          textAlign: "center"
        }}>
          Why This Matters
        </div>
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          fontSize: 13,
          lineHeight: 1.5,
          color: "#4b5563"
        }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, fontSize: 16 }}>🎯</span>
            <span><strong>Clarity & Better Decisions</strong> — Values act as your internal compass for life choices</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, fontSize: 16 }}>😊</span>
            <span><strong>Greater Life Satisfaction</strong> — Living aligned with your values increases wellbeing</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, fontSize: 16 }}>💪</span>
            <span><strong>Increased Resilience</strong> — Values provide stability and purpose during challenges</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, fontSize: 16 }}>🔥</span>
            <span><strong>Natural Motivation</strong> — Goals aligned with values require less willpower</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, fontSize: 16 }}>🧘</span>
            <span><strong>Reduced Stress</strong> — Less internal conflict when actions match values</span>
          </div>
        </div>
        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid rgba(139,92,246,0.1)",
          fontSize: 12,
          color: "#6b7280",
          textAlign: "center",
          fontStyle: "italic"
        }}>
          Understanding your InnerCode helps you live more intentionally
        </div>
      </div>

    </div>
  );
}