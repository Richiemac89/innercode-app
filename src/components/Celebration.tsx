import { useEffect, useState } from "react";

interface CelebrationProps {
  show: boolean;
  message: string;
  emoji?: string;
  onComplete?: () => void;
}

export function Celebration({
  show,
  message,
  emoji = "🎉",
  onComplete,
}: CelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3500); // 3.5 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!isVisible) return null;

  // Generate random confetti particles - falling from top!
  const confettiCount = 150;
  const confetti = Array.from({ length: confettiCount }, (_, i) => ({
    id: i,
    left: Math.random() * 100, // Random horizontal position
    delay: Math.random() * 0.5, // Stagger the start
    duration: 3 + Math.random() * 2, // 3-5 seconds fall time
    color: [
      // Purple shades
      "#6A3ABF", "#8A4EF0", "#B088F0", "#9D7BE8", "#C4B5FD",
      // Pink/Magenta shades
      "#EC4899", "#F472B6", "#FBCFE8", "#DDA0DD",
      // Gold/Yellow shades
      "#F59E0B", "#FCD34D", "#FEF3C7",
      // Teal/Cyan shades
      "#14B8A6", "#5EEAD4", "#99F6E4",
      // White/Light
      "#ffffff", "#F8F9FA"
    ][Math.floor(Math.random() * 16)],
    size: 8 + Math.random() * 12, // Larger, more varied sizes
    rotation: Math.random() * 360,
    rotationSpeed: 360 + Math.random() * 1080, // Faster rotation
  }));

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Confetti particles */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: "absolute",
            left: `${particle.left}%`,
            top: "-20px",
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: particle.color,
            borderRadius: particle.size < 10 ? "50%" : "3px",
            animation: `fall ${particle.duration}s ease-in forwards`,
            animationDelay: `${particle.delay}s`,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: 0.9,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
          }}
        />
      ))}

      {/* Centered Message Box */}
      {message && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "20px 28px",
            boxShadow: "0 20px 60px rgba(106, 58, 191, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.5)",
            textAlign: "center",
            animation: "popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              fontSize: "48px",
              marginBottom: "16px",
              animation: "bounce 1s ease-in-out infinite",
            }}
          >
            {emoji}
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#6A3ABF",
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
        </div>
      )}

      {/* Add CSS animations */}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(1080deg);
            opacity: 0;
          }
        }
        
        @keyframes popIn {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}


