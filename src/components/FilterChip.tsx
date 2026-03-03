export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="filter-chip"
      style={{
        border: active ? "2px solid #8B5CF6" : "1px solid rgba(0,0,0,0.12)",
        background: active ? "rgba(139,92,246,0.08)" : "#fff",
        padding: "4px 8px",
        borderRadius: 999,
        cursor: "pointer",
        fontSize: "13px",
        lineHeight: "1.3",
        fontWeight: "500",
        whiteSpace: "nowrap",
        minHeight: "auto",
        minWidth: "auto",
      }}
    >
      {label}
    </button>
  );
}

