import { useEffect, useState, useRef } from "react";

interface NameCollectionProps {
  onContinue: (name: string) => void;
  onBack: () => void;
}

export function NameCollection({ onContinue, onBack }: NameCollectionProps) {
  const [name, setName] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Focus input when component mounts
    if (isLoaded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onContinue(name.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && name.trim()) {
      onContinue(name.trim());
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
      {/* Background Gradient */}
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
        {/* Back Button */}
        <button
          type="button"
          onClick={onBack}
          style={{
            position: "absolute",
            top: "40px",
            left: "24px",
            background: "transparent",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            opacity: 0.7,
            color: "#6b7280",
            fontSize: "13px",
            fontWeight: 500,
            zIndex: 10,
            WebkitTapHighlightColor: "transparent",
            touchAction: "manipulation",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.background = "transparent";
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.opacity = "1";
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.opacity = "0.7";
            e.currentTarget.style.background = "transparent";
          }}
        >
          Back
        </button>

        {/* Main Content */}
        <div
          style={{
            textAlign: "center",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          {/* Greeting Icon */}
          <div
            style={{
              fontSize: "80px",
              marginBottom: "24px",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            👋
          </div>

          {/* Question */}
          <h1
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "32px",
              color: "#3b3b3b",
              marginBottom: "16px",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s",
            }}
          >
            What shall we call you?
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "16px",
              color: "#6b6b6b",
              marginBottom: "40px",
              lineHeight: 1.5,
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s",
            }}
          >
            We'll use this to personalize your experience
          </p>

          {/* Name Input Form */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                position: "relative",
                marginBottom: "32px",
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.6s",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter your name"
                className="name-input"
                style={{
                  width: "100%",
                  padding: "20px 24px",
                  borderRadius: "50px",
                  border: "2px solid rgba(106, 58, 191, 0.3)",
                  background: "rgba(167, 139, 250, 0.08)",
                  color: "#3b3b3b",
                  fontSize: "18px",
                  fontWeight: 500,
                  outline: "none",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6A3ABF";
                  e.currentTarget.style.background = "rgba(167, 139, 250, 0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.3)";
                  e.currentTarget.style.background = "rgba(167, 139, 250, 0.08)";
                }}
              />
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={!name.trim()}
            style={{
              width: "100%",
              padding: "20px 24px",
              borderRadius: "50px",
              border: "none",
              background: name.trim()
                ? "#6A3ABF"
                : "rgba(167, 139, 250, 0.2)",
              color: name.trim() ? "#ffffff" : "rgba(107, 107, 107, 0.5)",
              fontWeight: 700,
              fontSize: "18px",
              cursor: name.trim() ? "pointer" : "not-allowed",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transitionDelay: "0.8s",
              boxShadow: name.trim()
                ? "0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)"
                : "none",
            }}
              onMouseEnter={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.2)";
                }
              }}
              onMouseLeave={(e) => {
                if (name.trim()) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)";
                }
              }}
            >
              Continue
            </button>
          </form>

          {/* Skip Option */}
          <button
            onClick={() => onContinue("Friend")}
            style={{
              marginTop: "24px",
              background: "none",
              border: "none",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "underline",
              opacity: isLoaded ? 1 : 0,
              transform: isLoaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1) 1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
            }}
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* CSS for responsive design */}
      <style>{`
        @media (max-width: 768px) {
          h1 { font-size: 28px !important; }
          input { font-size: 16px !important; padding: 18px 20px !important; }
          button[type="submit"], button:not([type="button"]) { font-size: 16px !important; padding: 18px 20px !important; }
        }

        @media (max-width: 480px) {
          h1 { font-size: 24px !important; }
          input { font-size: 15px !important; padding: 16px 18px !important; }
          button[type="submit"], button:not([type="button"]) { font-size: 15px !important; padding: 16px 18px !important; }
        }

        /* Input placeholder styling */
        .name-input::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}
