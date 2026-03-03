import { useState } from "react";
import { VALUE_ICONS } from "../constants/values";

export function ValuesLeague({ valueEntries }: { valueEntries: [string, number][] }) {
  const [expanded, setExpanded] = useState(true);
  
  const medal = (i: number) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "🏷️";
  const top = valueEntries.slice(0, 10);

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#374151" }}>
          Your Core Values
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6b7280" }}>
          Detected from your assessment answers
        </p>
      </div>

      {/* Collapsible Section */}
      <div 
        style={{ 
          marginBottom: 16,
          cursor: "pointer",
          padding: "8px 0",
          borderBottom: "1px solid #e5e7eb"
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#374151" }}>
            🏆 Values League ({top.length} detected)
          </h4>
          <div style={{ fontSize: 18, color: "#6b7280", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
            ▼
          </div>
        </div>
      </div>

      {expanded && (
        <div
          style={{ 
            border: "1px solid #eee", 
            borderRadius: 12, 
            overflow: "hidden",
            marginBottom: 24
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 100px",
              fontSize: 13,
              background: "#fafafa",
              padding: "8px 10px",
              fontWeight: 700,
            }}
          >
            <div>Rank</div>
            <div>Value</div>
            <div style={{ textAlign: "right" }}>Signal</div>
          </div>
          {top.length === 0 ? (
            <div style={{ padding: 20, color: "#666", textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
                No values detected yet
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                Complete more assessments to see your core values emerge
              </div>
            </div>
          ) : (
            top.map(([v, score], i) => (
              <div
                key={v}
                style={{
                  display: "grid",
                  gridTemplateColumns: "60px 1fr 100px",
                  padding: "12px 10px",
                  borderTop: "1px solid #f0f0f0",
                  alignItems: "center",
                  background: i < 3 ? (i === 0 ? "#fef3c7" : i === 1 ? "#f3f4f6" : "#f0fdf4") : "transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 16 }}>{medal(i)}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{VALUE_ICONS[v] ?? "✨"}</span>
                  <strong style={{ textTransform: "capitalize", fontSize: 14 }}>{v}</strong>
                </div>
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600 }}>
                  {score}
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}