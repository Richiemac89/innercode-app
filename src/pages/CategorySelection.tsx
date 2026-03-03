import { useState } from "react";
import { CATEGORY_ICONS } from "../constants/categories";

interface CategorySelectionProps {
  categories: string[];
  onContinue: (selectedCategories: string[]) => void;
  minSelection?: number;
  maxSelection?: number;
  preselected?: string[];
  isExpanding?: boolean;
  currentProgress?: number;
  onBack?: () => void;
}

export function CategorySelection({
  categories,
  onContinue,
  minSelection = 3,
  maxSelection = 3,
  preselected = [],
  isExpanding = false,
  currentProgress = 0,
  onBack,
}: CategorySelectionProps) {
  const [selected, setSelected] = useState<string[]>(preselected);

  const toggleCategory = (category: string) => {
    if (selected.includes(category)) {
      setSelected(selected.filter((c) => c !== category));
    } else {
      if (selected.length < maxSelection) {
        setSelected([...selected, category]);
      }
    }
  };

  const canContinue = selected.length >= minSelection && selected.length <= maxSelection;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 20px 60px rgba(106, 58, 191, 0.15)",
          borderRadius: 24,
          padding: "32px 24px",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Back Button - Only show during initial onboarding */}
        {!isExpanding && onBack && (
          <button
            onClick={onBack}
            style={{
              marginBottom: "20px",
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Back
          </button>
        )}

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>
            {isExpanding ? "🌟" : "🎯"}
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: "#3b3b3b",
              marginBottom: 8,
            }}
          >
            {isExpanding ? "Add More Life Areas" : "Choose Your Focus Areas"}
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: 16, margin: 0 }}>
            {isExpanding ? (
              <>
                You've completed {currentProgress} areas. Select up to {maxSelection} more to explore.
              </>
            ) : (
              <>
                Select {minSelection} life areas you want to explore first.
                <br />
                You can add more areas later from your dashboard.
              </>
            )}
          </p>
        </div>

        {/* Progress indicator */}
        <div
          style={{
            background: "rgba(106,58,191,0.08)",
            borderRadius: 12,
            padding: "12px 16px",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b6b6b" }}>
            {selected.length} / {maxSelection} selected
            {selected.length >= minSelection && " ✓"}
          </div>
          {selected.length > 0 && (
            <div
              style={{
                marginTop: 8,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {selected.map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: 12,
                    padding: "4px 10px",
                    background: "linear-gradient(135deg,#6A3ABF,#8A4EF0)",
                    color: "#fff",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  {CATEGORY_ICONS[cat]} {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Category Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {categories.map((category) => {
            const isSelected = selected.includes(category);
            const isDisabled = !isSelected && selected.length >= maxSelection;
            return (
              <button
                key={category}
                onClick={() => !isDisabled && toggleCategory(category)}
                disabled={isDisabled}
                style={{
                  padding: "16px 12px",
                  borderRadius: 12,
                  border: isSelected
                    ? "2px solid #6A3ABF"
                    : "1px solid #d1d5db",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(106,58,191,0.12), rgba(138,78,240,0.08))"
                    : "#fff",
                  color: isDisabled ? "#bbb" : "#3b3b3b",
                  cursor: isDisabled ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  textAlign: "center",
                  fontWeight: isSelected ? 700 : 600,
                  fontSize: 14,
                  opacity: isDisabled ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>
                  {CATEGORY_ICONS[category]}
                </div>
                <div>{category}</div>
                {isSelected && (
                  <div style={{ fontSize: 18, marginTop: 4 }}>✓</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <button
          onClick={() => canContinue && onContinue(selected)}
          disabled={!canContinue}
          style={{
            width: "100%",
            padding: "18px 24px",
            borderRadius: 16,
            border: "none",
            background: canContinue
              ? "linear-gradient(135deg,#6A3ABF,#8A4EF0)"
              : "#bbb",
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            cursor: canContinue ? "pointer" : "not-allowed",
            boxShadow: canContinue
              ? "0 10px 24px rgba(106,58,191,0.35)"
              : "none",
          }}
        >
          {selected.length < minSelection
            ? `Select ${minSelection - selected.length} more to continue`
            : isExpanding
            ? `Add ${selected.length} Area${selected.length !== 1 ? 's' : ''} →`
            : "Continue →"}
        </button>

        {/* Skip option - only show for initial selection */}
        {!isExpanding && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => {
                // If they want to skip, select first 3 categories as default
                if (selected.length === 0) {
                  onContinue(categories.slice(0, 3));
                }
              }}
              style={{
                background: "none",
                border: "none",
                color: "#6A3ABF",
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
                padding: "8px 16px",
              }}
            >
              Not sure? We'll pick 3 balanced areas for you
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

