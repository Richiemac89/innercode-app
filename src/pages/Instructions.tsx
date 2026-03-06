import { useEffect, useState, useRef } from "react";

interface InstructionsProps {
  onContinue: () => void;
  hideStartButton?: boolean;
  onBack?: () => void;
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
    title: "Inspired by Evidence-Based Psychology",
    description: "Inspired by PERMA, Self-Determination Theory, Ikigai & ACT, and developed with therapists. Research shows values-aligned living can increase life satisfaction and support wellbeing.",
    animationClass: "brain-pulse"
  },
  {
    emoji: "🌟",
    title: "More Than Just Personality",
    description: "Explore 12 life areas at your own pace—career, relationships, health, purpose, and more. Start with 3 areas, expand as you grow. Get the complete picture.",
    animationClass: "star-sparkle"
  },
  {
    emoji: "🔍",
    title: "AI That Knows YOUR Story",
    description: "Inny analyzes your responses and journals using NLP to detect 10 core values (Growth, Connection, Discovery, etc.). Every entry strengthens her understanding of what energizes you.",
    animationClass: "magnify-pulse"
  },
  {
    emoji: "☀️🌙",
    title: "Morning & Evening Journals",
    description: "Journal twice a day for richer reflection: a morning journal (intentions, gratitude, how you'll structure your day) and an evening journal (reflection, what went well). Research links morning intention-setting and evening reflection to better mood and clarity. Both sync to Inny so she can support you with full context.",
    animationClass: "brain-pulse"
  },
  {
    emoji: "🧩",
    title: "Your InnerCode Evolves",
    description: "The only app that ties values, life areas, journaling, goals, and weekly check-ins to one AI coach. Results update with every journal entry; Daily Sparks suggest micro-actions aligned with your values, and value-aligned goals keep your progress and next steps in one place.",
    animationClass: "puzzle-rotate"
  },
  {
    emoji: "🔄",
    title: "Values Change—You Change",
    description: "Core values shift every 2-3 years with life transitions. InnerCode adapts with you, helping you stay aligned with who you're becoming, not who you were.",
    animationClass: "cycle-spin"
  },
  {
    emoji: "🔒",
    title: "Your Data, Your Control",
    description: "Your data syncs via Supabase so you can use InnerCode on any device. We can't read your journal or answers—it's stored so your reflections stay private. Inny uses YOUR insights to coach you.",
    animationClass: "lock-bounce"
  },
  {
    emoji: "📄",
    title: "Share With Your Therapist or Coach",
    description: "Export a session summary (PDF) from Settings with your life areas, values, mood trend, sparks and goals. Share it with a therapist or coach to give context and support better, more informed conversations.",
    animationClass: "brain-pulse"
  }
];

export function Instructions({ onContinue, hideStartButton = false, onBack }: InstructionsProps) {
  const [currentStory, setCurrentStory] = useState(0);
  const [progress, setProgress] = useState(0);
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
      goToPreviousStory();
    } else {
      // Only go forward if not on last story
      if (currentStory < stories.length - 1) {
        goToNextStory();
      }
    }
  };

  // Auto-advance timer and progress animation
  useEffect(() => {
    // On last story - special handling
    if (currentStory === stories.length - 1) {
      // If user is existing (hideStartButton=true) and has onBack, auto-redirect
      if (hideStartButton && onBack && !isPaused) {
        let currentProgress = 0;
        setProgress(0);

        // Animate progress bar
        progressIntervalRef.current = window.setInterval(() => {
          currentProgress += (PROGRESS_INTERVAL / STORY_DURATION) * 100;
          if (currentProgress >= 100) {
            currentProgress = 100;
          }
          setProgress(currentProgress);
        }, PROGRESS_INTERVAL);

        // Auto-redirect to dashboard after duration
        timerRef.current = window.setTimeout(() => {
          onBack(); // Redirect to dashboard
        }, STORY_DURATION);

        return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
      } else {
        // New users or no onBack - just stop at 100%
        setProgress(100);
        return;
      }
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
  }, [currentStory, isPaused, hideStartButton, onBack]);

  // Handle pause/resume
  const handlePause = () => {
    // Allow pause on last story if auto-redirecting (existing users)
    const isAutoRedirecting = currentStory === stories.length - 1 && hideStartButton && onBack;
    if (currentStory === stories.length - 1 && !isAutoRedirecting) return;
    
    setIsPaused(true);
    // Save current progress
    pausedProgressRef.current = progress;
    pausedTimeRef.current = (progress / 100) * STORY_DURATION;
  };

  const handleResume = () => {
    // Allow resume on last story if auto-redirecting (existing users)
    const isAutoRedirecting = currentStory === stories.length - 1 && hideStartButton && onBack;
    if (currentStory === stories.length - 1 && !isAutoRedirecting) return;
    
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
      {/* Close Button - Only show if onBack is provided */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(0, 0, 0, 0.3)",
            border: "none",
            color: "white",
            fontSize: "18px",
            cursor: "pointer",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 0, 0.3)";
          }}
        >
          ✕
        </button>
      )}

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
            maxWidth: "600px",
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
            maxWidth: "600px",
          }}
        >
          {stories[currentStory].description}
        </p>

        {/* Button - Only on last story and if not hidden */}
        {currentStory === stories.length - 1 && !hideStartButton && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "20px",
              animation: "fadeInUp 0.5s ease-out 0.5s both",
            }}
          >
            {/* Continue Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent tap navigation only on button
                onContinue();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation(); // Prevent touch navigation on button
              }}
              style={{
                padding: "18px 48px",
                borderRadius: "50px",
                border: "none",
                background: "#6A3ABF",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "18px",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(106, 58, 191, 0.6)",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.8)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.6)";
              }}
            >
              I'm ready — start questions
            </button>
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>{`
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

        @keyframes starSparkle {
          0%, 100% {
            transform: rotate(0deg) scale(1);
          }
          50% {
            transform: rotate(180deg) scale(1.1);
          }
        }

        @keyframes magnifyPulse {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(-5deg);
          }
          75% {
            transform: scale(1.1) rotate(5deg);
          }
        }

        @keyframes puzzleRotate {
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

        @keyframes cycleSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes lockBounce {
          0%, 100% {
            transform: translateY(0);
          }
          25% {
            transform: translateY(-10px);
          }
          50% {
            transform: translateY(0);
          }
          75% {
            transform: translateY(-5px);
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

        .star-sparkle {
          animation: starSparkle 3s ease-in-out infinite;
        }

        .magnify-pulse {
          animation: magnifyPulse 2s ease-in-out infinite;
        }

        .puzzle-rotate {
          animation: puzzleRotate 2s ease-in-out infinite;
        }

        .cycle-spin {
          animation: cycleSpin 4s linear infinite;
        }

        .lock-bounce {
          animation: lockBounce 2s ease-in-out infinite;
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
