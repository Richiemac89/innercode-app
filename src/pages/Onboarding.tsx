import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryHeader } from "../components/CategoryHeader";
import { CategoryProgress } from "../components/CategoryProgress";
import { ChatInput } from "../components/ChatInput";
import { CATEGORY_ICONS } from "../constants/categories";
import { Msg, Prompt } from "../types";
import { useResetZoom } from "../utils/useResetZoom";

interface OnboardingProps {
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
  const [isDragging, setIsDragging] = useState(false);

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
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
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
          fontSize: 32,
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

export function Onboarding({
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
}: OnboardingProps) {
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get the current category - use ratingCategory if we're rating, otherwise use the current prompt's category
  const currentCategory = ratingCategory 
    ? ratingCategory 
    : activePrompts[Math.min(step, activePrompts.length - 1)]?.category ?? selectedCategories[0];
  const currentCategoryIndex = selectedCategories.indexOf(currentCategory);

  // Reset zoom when component mounts
  useResetZoom();

  useEffect(() => {
    chatRef.current?.scrollTo({ top: 1e9, behavior: "smooth" });
  }, [messages, ratingCategory]);

  // Removed auto-focus to prevent mobile zoom-in on page load
  // Users can tap the input field when ready to type

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(253,186,116,0.08))",
        padding: 16,
        width: "100%",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 16px 40px rgba(0,0,0,0.08)",
          borderRadius: 16,
          display: "grid",
          gridTemplateRows: "auto auto 1fr auto",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #eee",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(255,255,255,0.9)",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          <span style={{ fontSize: 20 }}>🌞</span>
          <strong>InnerCode — Onboarding</strong>
          <div style={{ marginLeft: "auto", fontSize: 12, color: "#666" }}>
            {Math.min(step + 1, activePrompts.length)} / {activePrompts.length}
          </div>
        </div>

        {/* Category progress */}
        <div
          style={{
            padding: "0 16px 12px",
            borderBottom: "1px solid #eee",
            background: "rgba(255,255,255,0.9)",
          }}
        >
          <CategoryProgress
            current={currentCategoryIndex}
            total={selectedCategories.length}
          />
        </div>

        {/* Chat */}
        <div
          ref={chatRef}
          aria-live="polite"
          className="chat-height"
          style={{
            padding: 16,
            background: "#fafafa",
            overflowY: "auto",
            height: "calc(100vh - 260px)",
          }}
        >
          {messages.map((m) =>
            m.kind === "section" ? (
              <CategoryHeader
                key={m.id}
                label={m.text.split("  ")[1]}
                emoji={m.text.split("  ")[0]}
              />
            ) : (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent:
                    m.sender === "ai" ? "flex-start" : "flex-end",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    whiteSpace: "pre-wrap",
                    padding: "10px 14px",
                    borderRadius: 16,
                    lineHeight: 1.45,
                    background:
                      m.sender === "ai"
                        ? "#ffffff"
                        : "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                    color: m.sender === "ai" ? "#222" : "#fff",
                    border: m.sender === "ai" ? "1px solid #eee" : "none",
                    boxShadow:
                      m.sender === "ai"
                        ? "0 2px 8px rgba(0,0,0,0.05)"
                        : "0 2px 8px rgba(124,58,237,0.25)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            )
          )}

          {/* Rating slider when needed */}
          {ratingCategory && (
            <div style={{ marginTop: 20, marginBottom: 10 }}>
              <div style={{ color: "#4b4b4b", marginBottom: 16, fontSize: 15, fontWeight: 500 }}>
                Rate <strong>{ratingCategory}</strong>
              </div>
              <RatingSlider onSelectRating={onSelectRating} />
            </div>
          )}

          {/* Chips for multiple-choice prompts */}
          {!ratingCategory && activePrompts[step]?.chips?.length ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 6,
              }}
            >
              {activePrompts[step].chips!.map((c) => (
                <button
                  key={c}
                  onClick={() => onSubmit(c, { fromChip: true })}
                  style={{
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#fff",
                    padding: "8px 12px",
                    borderRadius: 999,
                    cursor: "pointer",
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(124,58,237,0.35)")
                  }
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  {c}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Sticky Question Header - shows the last AI question from messages */}
        {!ratingCategory && (() => {
          const lastAIMessage = [...messages].reverse().find(m => m.sender === 'ai');
          return lastAIMessage && (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                borderBottom: "1px solid #e2e8f0",
                padding: "12px 16px",
                fontSize: 14,
                color: "#374151",
                fontWeight: 500,
                zIndex: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 16 }}>
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
              : "Type your answer here…"
          }
          disabled={!!ratingCategory}
          maxLines={3}
        />
      </div>
    </div>
  );
}

