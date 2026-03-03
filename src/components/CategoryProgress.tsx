export function CategoryProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div style={{ width: "100%", padding: "8px 0 0" }}>
      <div
        style={{
          width: "100%",
          height: 6,
          background: "#eee",
          borderRadius: 999,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: 6,
            borderRadius: 999,
            background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
            transition: "width 400ms ease",
          }}
        />
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
        Category {current + 1} / {total}
      </div>
    </div>
  );
}

