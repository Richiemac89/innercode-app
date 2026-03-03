// Micro Action Card Component
// Individual spark card for Daily Sparks

import { MicroAction } from "../constants/microActions";
import { CATEGORY_ICONS } from "../constants/categories";

interface MicroActionCardProps {
  action: MicroAction;
  completed: boolean;
  onComplete: () => void;
}

export function MicroActionCard({ action, completed, onComplete }: MicroActionCardProps) {
  return (
    <div
      style={{
        background: completed ? "#f9fafb" : "white",
        border: completed ? "1px solid #e5e7eb" : "2px solid rgba(106, 58, 191, 0.2)",
        borderRadius: 16,
        padding: 16,
        opacity: completed ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Checkbox */}
        <button
          onClick={onComplete}
          disabled={completed}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: completed ? "2px solid #10b981" : "2px solid #d1d5db",
            background: completed ? "#10b981" : "white",
            cursor: completed ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: 2,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!completed) {
              e.currentTarget.style.borderColor = "#8B5CF6";
            }
          }}
          onMouseLeave={(e) => {
            if (!completed) {
              e.currentTarget.style.borderColor = "#d1d5db";
            }
          }}
        >
          {completed && (
            <span style={{ color: "white", fontSize: 14 }}>✓</span>
          )}
        </button>
        
        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: completed ? "#6b7280" : "#3b3b3b", marginBottom: 4 }}>
            {CATEGORY_ICONS[action.category]} {action.category}
          </div>
          <div style={{ fontSize: 14, color: completed ? "#9ca3af" : "#4b4b4b", lineHeight: 1.5 }}>
            {action.text}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <span
              style={{
                fontSize: 11,
                padding: "4px 8px",
                borderRadius: 12,
                background: completed ? "#e5e7eb" : "rgba(106, 58, 191, 0.1)",
                color: completed ? "#6b7280" : "#6A3ABF",
                fontWeight: 600,
              }}
            >
              {action.time}
            </span>
            {action.difficulty && (
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 8px",
                  borderRadius: 12,
                  background: completed ? "#e5e7eb" : "rgba(156, 163, 175, 0.1)",
                  color: completed ? "#6b7280" : "#6b7280",
                  fontWeight: 600,
                }}
              >
                {action.difficulty}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

