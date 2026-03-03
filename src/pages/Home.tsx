import { useEffect, useState } from "react";

export function Home({ onStart }: { onStart: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Full Screen Background Gradient */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
          zIndex: 1,
        }}
      />

      {/* Content Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Animated Leaf Emoji */}
        <div
          style={{
            fontSize: "120px",
            marginBottom: "24px",
            animation: "sway 2s ease-in-out infinite",
            transformOrigin: "bottom center",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          🌿
        </div>

        {/* Welcome Message */}
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "48px",
            letterSpacing: "-0.02em",
            color: "#3b3b3b",
            marginBottom: "16px",
            textAlign: "center",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
          }}
        >
          Welcome back!
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "18px",
            color: "#6b6b6b",
            marginBottom: "48px",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: "320px",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
          }}
        >
          Ready to continue your journey of self-discovery?
        </p>

        {/* Start Button */}
        <button
          onClick={onStart}
          style={{
            width: "100%",
            maxWidth: "300px",
            padding: "20px 24px",
            borderRadius: "50px",
            border: "none",
            background: "#6A3ABF",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "18px",
            cursor: "pointer",
            boxShadow: "0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.6s",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1)";
          }}
        >
          Continue Your Journey
        </button>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        /* Button ripple effect */
        button::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transform: translate(-50%, -50%);
          transition: width 0.6s, height 0.6s;
        }

        button:active::before {
          width: 300px;
          height: 300px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          h1 { font-size: 40px !important; }
          p { font-size: 16px !important; }
          button { font-size: 16px !important; padding: 18px 20px !important; }
        }

        @media (max-width: 480px) {
          h1 { font-size: 36px !important; }
          p { font-size: 15px !important; max-width: 280px !important; }
          button { font-size: 15px !important; padding: 16px 18px !important; }
        }
      `}</style>
    </div>
  );
}

