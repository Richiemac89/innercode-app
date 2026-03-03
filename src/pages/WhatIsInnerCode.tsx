import { useEffect, useState, useRef } from "react";

interface WhatIsInnerCodeProps {
  onContinue: () => void;
  onBack: () => void;
}

interface Story {
  emoji: string;
  title: string;
  description: string;
  animationClass: string;
}

const stories: Story[] = [
  {
    emoji: "🧠",
    title: "Welcome to InnerCode",
    description: "Your personalized journey to authentic living. Here's how it works...",
    animationClass: "brain-pulse"
  },
  {
    emoji: "⚖️",
    title: "Balance Your Life",
    description: "Balance key life areas to improve your overall wellbeing through thoughtful questions",
    animationClass: "scale-tilt"
  },
  {
    emoji: "☯️",
    title: "Discover Your Values",
    description: "Understanding your values and how they evolve is key to living authentically. Using evidence-based psychology, we'll identify your core values and suggest activities to help you align with them.",
    animationClass: "yin-yang-spin"
  },
  {
    emoji: "🤖",
    title: "AI-Powered Insights",
    description: "Meet Inny, the app's AI companion. Inny understands your unique patterns and tracks your progress. The more detailed your answers and journal entries, the deeper and more personalized your insights become.",
    animationClass: "robot-bounce"
  },
  {
    emoji: "🎯",
    title: "Personalized Activities",
    description: "Receive personalized activities and suggestions tailored to you",
    animationClass: "target-pulse"
  },
  {
    emoji: "📔",
    title: "Continuous Growth",
    description: "Track your progress with daily journaling and gratitude practices to reinforce positive patterns and continuous improvement",
    animationClass: "journal-flip"
  },
  {
    emoji: "🤝",
    title: "Our Partnership Together",
    description: "We've partnered with professional occupational therapists and psychotherapists to develop InnerCode. Now let's partner together to discover the real you and help you feel more aligned.",
    animationClass: "handshake-wave"
  }
];

export function WhatIsInnerCode({ onContinue, onBack }: WhatIsInnerCodeProps) {
  const [currentStory, setCurrentStory] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isCommitted, setIsCommitted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const pausedProgressRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const STORY_DURATION = 5000; // 5 seconds
  const PROGRESS_INTERVAL = 50; // Update progress every 50ms

  // Scroll to top on mount to ensure progress bars are visible
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, []);

  // Handle story navigation
  const goToNextStory = () => {
    if (currentStory < stories.length - 1) {
      // Clear existing timers immediately to prevent double-advance
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Reset pause state and progress
      pausedProgressRef.current = 0;
      pausedTimeRef.current = 0;
      setIsPaused(false);
      setProgress(0);
      setCurrentStory(currentStory + 1);
    }
  };

  const goToPreviousStory = () => {
    if (currentStory > 0) {
      // Clear existing timers immediately to prevent double-advance
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      // Reset pause state and progress
      pausedProgressRef.current = 0;
      pausedTimeRef.current = 0;
      setIsPaused(false);
      setProgress(0);
      setCurrentStory(currentStory - 1);
    }
  };

  // Handle tap navigation (works for both mouse and touch)
  const handleScreenTap = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const screenWidth = window.innerWidth;
    let tapX: number;
    
    // Get tap position from either mouse or touch event
    if ('clientX' in e) {
      tapX = e.clientX;
    } else if (e.touches && e.touches.length > 0) {
      tapX = e.touches[0].clientX;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      tapX = e.changedTouches[0].clientX;
    } else {
      return; // No valid position, exit
    }
    
    // Left 40% goes back, right 60% goes forward
    if (tapX < screenWidth * 0.4) {
      if (currentStory === 0) {
        onBack(); // Exit to NewLanding on first story
      } else {
        goToPreviousStory();
      }
    } else {
      // Only go forward if not on last story
      if (currentStory < stories.length - 1) {
        goToNextStory();
      }
    }
  };

  // Auto-advance timer and progress animation
  useEffect(() => {
    // Don't auto-advance on the last story
    if (currentStory === stories.length - 1) {
      setProgress(100);
      return;
    }

    // If paused, don't start timers
    if (isPaused) {
      return;
    }

    // Start from beginning or resume from paused progress
    let currentProgress = pausedProgressRef.current;
    const remainingTime = STORY_DURATION - pausedTimeRef.current;

    setProgress(currentProgress);

    // Progress bar animation
    progressIntervalRef.current = window.setInterval(() => {
      currentProgress += (PROGRESS_INTERVAL / STORY_DURATION) * 100;
      if (currentProgress >= 100) {
        currentProgress = 100;
      }
      setProgress(currentProgress);
    }, PROGRESS_INTERVAL);

    // Auto-advance timer
    timerRef.current = window.setTimeout(() => {
      goToNextStory();
      pausedProgressRef.current = 0;
      pausedTimeRef.current = 0;
    }, remainingTime);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [currentStory, isPaused]);

  // Handle pause/resume
  const handlePause = () => {
    // Don't pause on last story (no auto-advance anyway)
    if (currentStory === stories.length - 1) return;
    
    setIsPaused(true);
    // Save current progress
    pausedProgressRef.current = progress;
    pausedTimeRef.current = (progress / 100) * STORY_DURATION;
  };

  const handleResume = () => {
    // Don't resume on last story
    if (currentStory === stories.length - 1) return;
    
    setIsPaused(false);
  };

  // Reset pause state when changing stories
  useEffect(() => {
    pausedProgressRef.current = 0;
    pausedTimeRef.current = 0;
    setIsPaused(false);
  }, [currentStory]);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
      }}
    >
      {/* Progress Bars */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "16px 16px 8px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {stories.map((_, index) => (
          <div
            key={index}
            style={{
              flex: 1,
              height: "3px",
              background: "rgba(106, 58, 191, 0.25)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#6A3ABF",
                borderRadius: "2px",
                width: index < currentStory 
                  ? "100%" 
                  : index === currentStory 
                    ? `${progress}%` 
                    : "0%",
                transition: index === currentStory ? "none" : "width 0.3s ease",
              }}
            />
          </div>
        ))}
      </div>

      {/* Story Content - Tap zones */}
      <div
        onClick={(e) => {
          // Prevent click if it was triggered by touch (to avoid double-firing)
          if (e.type === 'click' && 'ontouchstart' in window) {
            return;
          }
          handleScreenTap(e);
        }}
        onTouchEnd={(e) => {
          // On touch devices, handle tap on touch end and prevent subsequent click
          e.preventDefault();
          handleResume();
          handleScreenTap(e);
        }}
        onMouseDown={handlePause}
        onMouseUp={handleResume}
        onMouseLeave={handleResume}
        onTouchStart={handlePause}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px 24px",
          cursor: "pointer",
          userSelect: "none",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Emoji */}
        <div
          className={stories[currentStory].animationClass}
          style={{
            fontSize: "120px",
            marginBottom: "32px",
          }}
        >
          {stories[currentStory].emoji}
        </div>

        {/* Title */}
        <h2
          style={{
            margin: "0 0 20px 0",
            fontSize: "32px",
            fontWeight: 700,
            color: "#3b3b3b",
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          {stories[currentStory].title}
        </h2>

        {/* Description */}
        <p
          style={{
            margin: "0 0 32px 0",
            fontSize: "18px",
            color: "#6b6b6b",
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: "500px",
          }}
        >
          {stories[currentStory].description}
        </p>

        {/* Checkbox and Button - Only on last story */}
        {currentStory === stories.length - 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              animation: "fadeInUp 0.5s ease-out 0.5s both",
            }}
          >
            {/* Checkbox */}
            <label
              onClick={(e) => e.stopPropagation()} // Prevent tap navigation only on checkbox
              onTouchEnd={(e) => e.stopPropagation()} // Prevent touch navigation on checkbox
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                fontSize: "15px",
                color: "#3b3b3b",
                maxWidth: "400px",
                textAlign: "left",
                padding: "12px 20px",
                background: "rgba(255, 255, 255, 0.8)",
                borderRadius: "12px",
                border: "2px solid rgba(106, 58, 191, 0.2)",
                transition: "all 0.2s",
                userSelect: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.4)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.95)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.2)";
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
              }}
            >
              <input
                type="checkbox"
                checked={isCommitted}
                onChange={(e) => setIsCommitted(e.target.checked)}
                style={{
                  width: "20px",
                  height: "20px",
                  cursor: "pointer",
                  accentColor: "#6A3ABF",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500 }}>
                I want to feel aligned
              </span>
            </label>

            {/* Let's Begin Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent tap navigation only on button
                onContinue();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation(); // Prevent touch navigation on button
              }}
              disabled={!isCommitted}
              style={{
                padding: "18px 48px",
                borderRadius: "50px",
                border: "none",
                background: isCommitted ? "#6A3ABF" : "#cccccc",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "18px",
                cursor: isCommitted ? "pointer" : "not-allowed",
                boxShadow: isCommitted ? "0 8px 32px rgba(106, 58, 191, 0.6)" : "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
                opacity: isCommitted ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (isCommitted) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (isCommitted) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.6)";
                }
              }}
            >
              Let's Begin
            </button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes scaleTilt {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes brainPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.9;
          }
        }

        @keyframes yinYangSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes journalFlip {
          0%, 100% {
            transform: rotateY(0deg);
          }
          50% {
            transform: rotateY(10deg);
          }
        }

        @keyframes robotBounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(-3deg);
          }
          50% {
            transform: translateY(0) rotate(3deg);
          }
          75% {
            transform: translateY(-5px) rotate(-2deg);
          }
        }

        @keyframes targetPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        @keyframes handshakeWave {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(10deg);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .brain-pulse {
          animation: brainPulse 2s ease-in-out infinite;
        }

        .scale-tilt {
          animation: scaleTilt 2s ease-in-out infinite;
        }

        .yin-yang-spin {
          animation: yinYangSpin 4s linear infinite;
        }

        .journal-flip {
          animation: journalFlip 2s ease-in-out infinite;
        }

        .robot-bounce {
          animation: robotBounce 2s ease-in-out infinite;
        }

        .target-pulse {
          animation: targetPulse 1.5s ease-in-out infinite;
        }

        .handshake-wave {
          animation: handshakeWave 1.8s ease-in-out infinite;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          h2 { font-size: 28px !important; }
          p { font-size: 17px !important; }
        }

        @media (max-width: 480px) {
          h2 { font-size: 26px !important; }
          p { font-size: 16px !important; }
        }
      `}</style>
    </div>
  );
}
