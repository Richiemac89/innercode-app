// Weekly Reflection Banner Component
// Shows on Dashboard when weekly reflection is due (Option A: same timing as previous check-in)

interface WeeklyCheckInBannerProps {
  onStartCheckIn: () => void;
}

export function WeeklyCheckInBanner({ onStartCheckIn }: WeeklyCheckInBannerProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(124,58,237,0.12))",
        border: "2px solid #8B5CF6",
        padding: "18px 20px",
        borderRadius: 16,
        marginBottom: 24,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }}>✨</span>
        <strong style={{ color: "#5b21b6", fontSize: 16 }}>
          Your weekly reflection is ready
        </strong>
      </div>

      <div style={{ color: "#6d28d9", fontSize: 13, marginBottom: 12 }}>
        Inny has reflected on your journals, sparks, mood, and goals. Review your week and goals.
      </div>

      <button
        onClick={onStartCheckIn}
        style={{
          padding: "10px 20px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
          color: "#fff",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 15,
          whiteSpace: "nowrap",
          boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
          transition: "all 0.2s",
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
        See your reflection
      </button>
    </div>
  );
}

