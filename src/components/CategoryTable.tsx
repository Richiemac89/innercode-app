import { CATEGORY_ICONS, CATEGORY_SHORTHAND } from "../constants/categories";
import { objEntries } from "../utils/helpers";

export function CategoryTable({
  categoryScores,
  completedCategories = [],
}: {
  categoryScores: Record<string, number>;
  completedCategories?: string[];
}) {
  const entries = objEntries(categoryScores ?? {});
  if (!entries.length) {
    return <div style={{ padding: 12, color: "#666" }}>No ratings yet.</div>;
  }
  const rows = entries
    .sort((a, b) => a[1] - b[1]) // weakest first
    .map(([cat, score]) => ({
      cat,
      score,
      priority: score <= 3 ? "High" : score <= 6 ? "Medium" : "Lower",
      isCompleted: completedCategories.includes(cat),
    }));
  return (
    <div
      style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}
    >
      <div
        className="cat-table-head"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 80px 90px",
          fontSize: 13,
          background: "#fafafa",
          padding: "8px 10px",
          fontWeight: 700,
        }}
      >
        <div>Category</div>
        <div style={{ textAlign: "right" }}>Score</div>
        <div style={{ textAlign: "right" }}>Priority</div>
      </div>
      {rows.map((r) => (
        <div
          key={r.cat}
          className="cat-table-row"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 80px 90px",
            padding: "10px 10px",
            borderTop: "1px solid #f0f0f0",
            alignItems: "center",
            opacity: r.isCompleted ? 1 : 0.5,
            background: r.isCompleted ? "transparent" : "rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span>{CATEGORY_ICONS[r.cat]}</span>
            <strong
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {CATEGORY_SHORTHAND[r.cat] || r.cat}
            </strong>
            {!r.isCompleted && (
              <span
                style={{
                  fontSize: 10,
                  background: "#ddd",
                  color: "#666",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                }}
              >
                DEFAULT
              </span>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            {r.score}/10
            {!r.isCompleted && (
              <span style={{ fontSize: 10, color: "#999", marginLeft: 4 }}>
                ⓘ
              </span>
            )}
          </div>
          <div style={{ textAlign: "right" }}>{r.priority}</div>
        </div>
      ))}
    </div>
  );
}

