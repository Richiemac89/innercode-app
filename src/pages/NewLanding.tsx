import { useEffect, useState } from "react";
import { safeGetItem, getSafeLocalStorage } from "../utils/helpers";

interface NewLandingProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export function NewLanding({ onGetStarted, onLogin }: NewLandingProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger entrance animation after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100);
    console.log('NewLanding mounted - checking localStorage:', {
      hasResults: !!safeGetItem('innercode_results'),
      hasSeenResults: !!safeGetItem('innercode_hasSeenResults'),
      hasUserName: !!safeGetItem('innercode_userName'),
    });
    return () => clearTimeout(timer);
  }, []);

  const handleTestReset = async () => {
    if (window.confirm('This will clear all your data and log you out. Are you sure?')) {
      // Import supabase to sign out
      const { getSupabaseClient } = await import('../lib/supabase');
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
      
      // Clear all localStorage
      const storage = getSafeLocalStorage();
      storage?.clear();
      sessionStorage.clear();
      
      // Reload the page
      window.location.href = '/';
    }
  };

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
          zIndex: 3,
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

        {/* App Title */}
        <h1
          style={{
            margin: 0,
            fontWeight: 800,
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
          InnerCode
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
          Discover your values through evidence-based psychology. Journal daily and live more authentically.
        </p>

        {/* Get Started Button */}
        <button
          onClick={onGetStarted}
          style={{
            width: "100%",
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
          Get Started
        </button>

        {/* Login Button */}
        <button
          onClick={onLogin}
          style={{
            width: "100%",
            padding: "18px 24px",
            borderRadius: "50px",
            border: "2px solid #6A3ABF",
            background: "transparent",
            color: "#6A3ABF",
            fontWeight: 700,
            fontSize: "16px",
            cursor: "pointer",
            marginTop: "16px",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.7s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#6A3ABF";
            e.currentTarget.style.color = "#ffffff";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#6A3ABF";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Already have an account? Log In
        </button>

        {/* Test Reset Button - Only visible in development */}
        <button
          onClick={handleTestReset}
          style={{
            marginTop: "16px",
            padding: "12px 24px",
            borderRadius: "50px",
            border: "2px solid rgba(106, 58, 191, 0.3)",
            background: "rgba(167, 139, 250, 0.15)",
            color: "#6A3ABF",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "0.7s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(167, 139, 250, 0.25)";
            e.currentTarget.style.borderColor = "#6A3ABF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(167, 139, 250, 0.15)";
            e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.3)";
          }}
        >
          🔄 Reset for Testing
        </button>

        {/* Privacy Note */}
        <p
          style={{
            marginTop: "32px",
            fontSize: "14px",
            color: "#6b6b6b",
            textAlign: "center",
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.8s",
          }}
        >
          Completely private. Your data stays yours.
        </p>
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
          button { font-size: 18px !important; padding: 18px 40px !important; }
        }

        @media (max-width: 480px) {
          h1 { font-size: 36px !important; }
          p { font-size: 15px !important; max-width: 280px !important; }
          button { font-size: 16px !important; padding: 16px 36px !important; }
        }
      `}</style>
    </div>
  );
}
