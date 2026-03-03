export function Toast({ text, show }: { text: string; show: boolean }) {
  if (!show) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        background: "rgba(27,27,27,0.96)",
        color: "white",
        padding: "10px 14px",
        borderRadius: 12,
        fontSize: 14,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
      }}
    >
      {text}
    </div>
  );
}

