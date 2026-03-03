export function Landing({
  onSignUp,
  onLogin,
}: {
  onSignUp: () => void;
  onLogin: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, rgba(167,139,250,0.18), rgba(253,186,116,0.18))",
        padding: 16,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>🌿</div>
        <h1
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 64,
            letterSpacing: 0.5,
            color: "#3b3b3b",
            marginBottom: 12,
          }}
        >
          InnerCode
        </h1>
        <p style={{ fontSize: 18, color: "#6b6b6b", marginBottom: 40, lineHeight: 1.6 }}>
          Discover your values through evidence-based psychology. 
          Journal daily and live more authentically.
        </p>
        
        <div style={{ display: "grid", gap: 16 }}>
          <button
            onClick={onSignUp}
            style={{
              padding: "20px 36px",
              borderRadius: 999,
              border: "none",
              background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 22,
              cursor: "pointer",
              boxShadow: "0 14px 30px rgba(124,58,237,0.4)",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
          >
            Get Started
          </button>
          
          <button
            onClick={onLogin}
            style={{
              padding: "20px 36px",
              borderRadius: 999,
              border: "2px solid #8B5CF6",
              background: "#fff",
              color: "#8B5CF6",
              fontWeight: 700,
              fontSize: 22,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(139,92,246,0.1)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#fff";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Log In
          </button>
        </div>

        <p style={{ marginTop: 32, fontSize: 14, color: "#9ca3af" }}>
          Completely private. Your data stays yours.
        </p>
      </div>
    </div>
  );
}


