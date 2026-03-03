export function CategoryHeader({ label, emoji }: { label: string; emoji: string }) {
  return (
    <div
      style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}
    >
      <div
        style={{
          padding: "12px 20px",
          borderRadius: 50,
          background: "rgba(106, 58, 191, 0.1)",
          border: "2px solid rgba(106, 58, 191, 0.2)",
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color: "#6A3ABF",
          boxShadow: "0 4px 20px rgba(106, 58, 191, 0.15)",
          backdropFilter: "blur(10px)",
          fontSize: 16,
        }}
      >
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

