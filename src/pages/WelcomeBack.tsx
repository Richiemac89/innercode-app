import { useEffect, useState } from "react";
import { safeGetItem, safeSetItem } from "../utils/helpers";

export function WelcomeBack({ 
  userName, 
  onRevealResults 
}: { 
  userName: string; 
  onRevealResults: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Clear saved onboarding route to prevent flash on refresh
  useEffect(() => {
    try {
      const savedState = safeGetItem("innercode_state_v1");
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.route === "onboarding" || state.route === "verifyEmail") {
          console.log('WelcomeBack: Updating saved route to welcomeBack to prevent flash');
          state.route = "welcomeBack";
          safeSetItem("innercode_state_v1", JSON.stringify(state));
        }
      }
    } catch (e) {
      console.error('Failed to update saved route:', e);
    }
  }, []); // Run once on mount

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
        {/* Success Icon */}
        <div
          style={{
            fontSize: "120px",
            marginBottom: "24px",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "scale(1)" : "scale(0.8)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            animation: "float 3s ease-in-out infinite",
          }}
        >
          🎉
        </div>

        {/* Welcome Message */}
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "42px",
            letterSpacing: "-0.02em",
            color: "#3b3b3b",
            marginBottom: "12px",
            textAlign: "center",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
          }}
        >
          Welcome, {userName}!
        </h1>

        {/* Success Message */}
        <p
          style={{
            fontSize: "18px",
            color: "#3b3b3b",
            marginBottom: "16px",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "360px",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
          }}
        >
          Your account has been created and verified! 🌟
        </p>

        <p
          style={{
            fontSize: "16px",
            color: "#6b6b6b",
            marginBottom: "48px",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: "340px",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.5s",
          }}
        >
          We've analyzed your answers and created your personalized InnerCode profile.
        </p>

        {/* Reveal Results Button */}
        <button
          onClick={onRevealResults}
          style={{
            width: "100%",
            maxWidth: "320px",
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
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)";
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(0px) scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
          }}
        >
          ✨ Reveal My Results
        </button>

        {/* Optional subtitle */}
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.7)",
            marginTop: "24px",
            textAlign: "center",
            lineHeight: 1.5,
            maxWidth: "300px",
            opacity: isLoaded ? 1 : 0,
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.7s",
          }}
        >
          Get ready to discover your values, strengths, and personalized insights!
        </p>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(-5deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          h1 { font-size: 38px !important; }
          p { font-size: 16px !important; }
        }

        @media (max-width: 480px) {
          h1 { font-size: 34px !important; }
          p { font-size: 15px !important; }
        }
      `}</style>
    </div>
  );
}


