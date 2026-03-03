import { ReactNode } from "react";

export function Callout({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        margin: "12px 0",
        padding: "12px 14px",
        background: "#F7F5FF",
        border: "1px solid #ECE9FF",
        borderRadius: 14,
        boxShadow: "0 6px 18px rgba(124,58,237,0.08)",
        color: "#2D2A26",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 6 }}>
        {emoji} {title}
      </div>
      <div style={{ color: "#4b4b4b", lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

