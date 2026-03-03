import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryHeader } from "../components/CategoryHeader";
import { CategoryProgress } from "../components/CategoryProgress";
import { ChatInput } from "../components/ChatInput";
import { CATEGORY_ICONS } from "../constants/categories";
import { Msg, Prompt } from "../types";
import { useResetZoom } from "../utils/useResetZoom";

interface EnhancedOnboardingProps {
  messages: Msg[];
  step: number;
  input: string;
  setInput: (val: string) => void;
  ratingCategory: string | null;
  onSubmit: (text: string, opts?: { fromChip?: boolean }) => void;
  onSelectRating: (score: number) => void;
  categories: string[];
  activePrompts: Prompt[];
  selectedCategories: string[];
}

function RatingSlider({ onSelectRating }: { onSelectRating: (score: number) => void }) {
  const [sliderValue, setSliderValue] = useState(5);

  return (
    <div style={{ padding: "0 8px" }}>
      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
          fontSize: 13,
          color: "#6b6b6b",
          fontWeight: 500,
        }}
      >
        <span>0 - Struggling</span>
        <span>10 - Thriving</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min="0"
        max="10"
        value={sliderValue}
        onChange={(e) => setSliderValue(Number(e.target.value))}
        style={{
          width: "100%",
          height: "6px",
          borderRadius: "3px",
          outline: "none",
          appearance: "none",
          WebkitAppearance: "none",
          background: `linear-gradient(to right, #6A3ABF 0%, #6A3ABF ${(sliderValue / 10) * 100}%, #e5e7eb ${(sliderValue / 10) * 100}%, #e5e7eb 100%)`,
          cursor: "pointer",
        }}
      />

      {/* Current Value Display */}
      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 40,
          fontWeight: 700,
          color: "#6A3ABF",
        }}
      >
        {sliderValue}
      </div>

      {/* Submit Button */}
      <button
        onClick={() => onSelectRating(sliderValue)}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "14px 24px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 6px 16px rgba(106,58,191,0.35)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(106,58,191,0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(106,58,191,0.35)";
        }}
      >
        Continue
      </button>

      {/* Custom slider thumb styling */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6A3ABF;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(106,58,191,0.4);
          transition: all 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(106,58,191,0.6);
        }

        input[type="range"]::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6A3ABF;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 8px rgba(106,58,191,0.4);
          transition: all 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(106,58,191,0.6);
        }
      `}</style>
    </div>
  );
}

export function EnhancedOnboarding({
  messages,
  step,
  input,
  setInput,
  ratingCategory,
  onSubmit,
  onSelectRating,
  categories,
  activePrompts,
  selectedCategories,
}: EnhancedOnboardingProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [messageAnimations, setMessageAnimations] = useState<Record<string, boolean>>({});

  // Get the current category - use ratingCategory if we're rating, otherwise use the current prompt's category
  const currentCategory = ratingCategory 
    ? ratingCategory 
    : activePrompts[Math.min(step, activePrompts.length - 1)]?.category ?? selectedCategories[0];
  const currentCategoryIndex = selectedCategories.indexOf(currentCategory);

  // Reset zoom when component mounts
  useResetZoom();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [messages, ratingCategory]);

  // Removed auto-focus to prevent mobile zoom-in on page load
  // Users can tap the input field when ready to type

  // Animate all messages when they change
  useEffect(() => {
    messages.forEach((message, index) => {
      setTimeout(() => {
        setMessageAnimations(prev => ({ ...prev, [message.id]: true }));
      }, index * 100 + 200); // Stagger animations
    });
  }, [messages]);

  const handleRatingClick = (score: number) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    onSelectRating(score);
  };

  const handleChipClick = (chip: string) => {
    // Add haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
    onSubmit(chip, { fromChip: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        paddingBottom: "100px",
      }}
    >
      {/* Purple Header - iMessage style */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
          <div
            style={{
              fontSize: 20,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            🌿
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px" }}>InnerCode</div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              Discovering your values
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            background: "rgba(255, 255, 255, 0.2)",
            padding: "4px 10px",
            borderRadius: "12px",
          }}
        >
          {Math.min(step + 1, activePrompts.length)} / {activePrompts.length}
        </div>
      </div>

      {/* Category Progress */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <CategoryProgress
          current={currentCategoryIndex}
          total={selectedCategories.length}
        />
      </div>

      {/* Chat Messages */}
      <div
        ref={chatRef}
        aria-live="polite"
        style={{
          padding: "20px",
          background: "white",
          overflowY: "auto",
          minHeight: "calc(100vh - 250px)",
        }}
      >
          {messages.map((m, index) =>
            m.kind === "section" ? (
              <div
                key={m.id}
                style={{
                  opacity: messageAnimations[m.id] ? 1 : 0,
                  transform: messageAnimations[m.id] ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <CategoryHeader
                  label={m.text.split("  ")[1]}
                  emoji={m.text.split("  ")[0]}
                />
              </div>
            ) : (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.sender === "ai" ? "flex-start" : "flex-end",
                  marginBottom: 16,
                  opacity: messageAnimations[m.id] ? 1 : 0,
                  transform: messageAnimations[m.id] ? "translateY(0)" : "translateY(20px)",
                  transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    whiteSpace: "pre-wrap",
                    padding: "14px 18px",
                    borderRadius: m.sender === "ai" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                    lineHeight: 1.6,
                    background: m.sender === "ai"
                      ? "rgba(106, 58, 191, 0.08)"
                      : "#6A3ABF",
                    color: m.sender === "ai" ? "#1f2937" : "white",
                    boxShadow: m.sender === "you"
                      ? "0 4px 12px rgba(106, 58, 191, 0.3)"
                      : "none",
                    fontSize: 15,
                  }}
                >
                  {m.sender === "ai" && (
                    <div style={{ fontWeight: 700, marginBottom: "6px", color: "#6A3ABF", fontSize: "13px" }}>
                      Inny
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            )
          )}

          {/* Rating Slider */}
          {ratingCategory && (
            <div
              style={{
                marginTop: 20,
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                transitionDelay: "0.3s",
              }}
            >
              <div
                style={{
                  color: "#6A3ABF",
                  marginBottom: 16,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Rate <strong>{ratingCategory}</strong>
              </div>
              <RatingSlider onSelectRating={handleRatingClick} />
            </div>
          )}

          {/* Enhanced Chips for multiple-choice prompts */}
          {!ratingCategory && activePrompts[step]?.chips?.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 16,
                opacity: isLoaded ? 1 : 0,
                transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                transition: "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                transitionDelay: "0.3s",
              }}
            >
              {activePrompts[step].chips!.map((c, index) => (
                <button
                  key={c}
                  onClick={() => handleChipClick(c)}
                  style={{
                    border: "2px solid rgba(106, 58, 191, 0.2)",
                    background: "rgba(255, 255, 255, 0.9)",
                    padding: "12px 20px",
                    borderRadius: 50,
                    cursor: "pointer",
                    outline: "none",
                    fontSize: 15,
                    fontWeight: 500,
                    color: "#6A3ABF",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    backdropFilter: "blur(10px)",
                    opacity: isLoaded ? 1 : 0,
                    transform: isLoaded ? "translateY(0)" : "translateY(20px)",
                    transitionDelay: `${0.4 + index * 0.1}s`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.background = "rgba(106, 58, 191, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                    e.currentTarget.style.borderColor = "rgba(106, 58, 191, 0.2)";
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(0.95)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1)";
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
      </div>

      {/* Enhanced Question Header - shows the last AI question from messages */}
        {!ratingCategory && (() => {
          const lastAIMessage = [...messages].reverse().find(m => m.sender === 'ai');
          return lastAIMessage && (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                background: "rgba(255, 255, 255, 0.95)",
                borderTop: "1px solid rgba(106, 58, 191, 0.1)",
                padding: "16px 24px",
                fontSize: 15,
                color: "#6A3ABF",
                fontWeight: 600,
                zIndex: 10,
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 20 }}>
                  {CATEGORY_ICONS[currentCategory]}
                </div>
                <div style={{ flex: 1 }}>
                  {lastAIMessage.text}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ChatGPT-style Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={() => onSubmit(input)}
          placeholder={
            ratingCategory
              ? "Select a score above to continue…"
              : "Share your thoughts..."
          }
          disabled={!!ratingCategory}
          maxLines={3}
        />
    </div>
  );
}
