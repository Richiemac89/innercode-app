import { useState } from "react";
import { VALUE_ICONS, VALUE_DESCRIPTIONS } from "../constants/values";

export function ValuesLeague({ valueEntries }: { valueEntries: [string, number][] }) {
  const [expanded, setExpanded] = useState(true);
  const [valueForInfo, setValueForInfo] = useState<string | null>(null);
  
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
          Detected from your assessment and journal entries
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
              gridTemplateColumns: "60px minmax(0, 1fr) 36px 72px",
              fontSize: 13,
              background: "#fafafa",
              padding: "8px 10px",
              fontWeight: 700,
            }}
          >
            <div>Rank</div>
            <div>Value</div>
            <div style={{ textAlign: "center" }} />
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
                  gridTemplateColumns: "60px minmax(0, 1fr) 36px 72px",
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{VALUE_ICONS[v] ?? "✨"}</span>
                  <strong style={{ textTransform: "capitalize", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  {VALUE_DESCRIPTIONS[v] ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setValueForInfo(v);
                      }}
                      style={{
                        width: 24,
                        height: 24,
                        padding: 0,
                        border: "none",
                        borderRadius: "50%",
                        background: "rgba(139,92,246,0.1)",
                        cursor: "pointer",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                        e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      aria-label={`Info about ${v}`}
                    >
                      ℹ️
                    </button>
                  ) : null}
                </div>
                <div style={{ textAlign: "right", fontSize: 14, fontWeight: 600 }}>
                  {score}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Value info modal */}
      {valueForInfo && VALUE_DESCRIPTIONS[valueForInfo] && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setValueForInfo(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setValueForInfo(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(0,0,0,0.05)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                color: "#6b6b6b",
              }}
              aria-label="Close"
            >
              ✕
            </button>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>
              {VALUE_ICONS[valueForInfo] ?? "✨"}
            </div>
            <h3 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: "#3b3b3b", textAlign: "center", textTransform: "capitalize" }}>
              {valueForInfo}
            </h3>
            <p style={{ color: "#6b6b6b", fontSize: 15, lineHeight: 1.6, margin: "0 0 12px" }}>
              {VALUE_DESCRIPTIONS[valueForInfo].description}
            </p>
            <div style={{ padding: 12, background: "rgba(139,92,246,0.08)", borderRadius: 12 }}>
              <p style={{ color: "#6d28d9", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                💡 <strong>Example:</strong> {VALUE_DESCRIPTIONS[valueForInfo].example}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}