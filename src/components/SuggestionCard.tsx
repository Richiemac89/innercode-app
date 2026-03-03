import { CATEGORY_ICONS } from "../constants/categories";
import { VALUE_ICONS } from "../constants/values";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: string;
  category: string;
  value?: string;
  priority: 'high' | 'medium' | 'low';
  type: 'weakness' | 'strength' | 'value-aligned';
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onComplete?: (id: string) => void;
  isCompleted?: boolean;
}

export function SuggestionCard({ suggestion, onComplete, isCompleted = false }: SuggestionCardProps) {
  const categoryIcon = CATEGORY_ICONS[suggestion.category] || "🎯";
  const valueIcon = suggestion.value ? VALUE_ICONS[suggestion.value] : null;
  
  const priorityColors = {
    high: "#ef4444", // red
    medium: "#f59e0b", // amber
    low: "#10b981" // emerald
  };

  const typeColors = {
    weakness: "#8B5CF6", // purple - for weak life areas
    strength: "#f59e0b", // amber - for discovery/new values
    'value-aligned': "#0ea5e9" // cyan - for value strengths
  };

  const typeBackgrounds = {
    weakness: "rgba(139, 92, 246, 0.08)", // light purple
    strength: "rgba(245, 158, 11, 0.08)", // light amber
    'value-aligned': "rgba(14, 165, 233, 0.08)" // light cyan
  };

  const difficultyColors = {
    easy: "#10b981", // green
    medium: "#f59e0b", // amber
    hard: "#ef4444" // red
  };

  return (
    <div
      style={{
        background: typeBackgrounds[suggestion.type],
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        border: `2px solid ${typeColors[suggestion.type]}`,
        opacity: isCompleted ? 0.6 : 1,
        position: "relative",
        transition: "all 0.2s ease",
        cursor: isCompleted ? "default" : "pointer",
      }}
      onClick={!isCompleted ? () => onComplete?.(suggestion.id) : undefined}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 24 }}>{categoryIcon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: "#374151",
            marginBottom: 2 
          }}>
            {suggestion.title}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: "#6b7280" 
          }}>
            {suggestion.category}
          </div>
        </div>
        
        {/* Priority Badge */}
        <div
          style={{
            background: priorityColors[suggestion.priority],
            color: "white",
            fontSize: 10,
            fontWeight: 600,
            padding: "4px 8px",
            borderRadius: 12,
            textTransform: "uppercase",
          }}
        >
          {suggestion.priority}
        </div>
      </div>

      {/* Description */}
      <div style={{ 
        fontSize: 13, 
        color: "#4b5563", 
        lineHeight: 1.4,
        marginBottom: 12 
      }}>
        {suggestion.description}
      </div>

      {/* Action */}
      <div style={{
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      }}>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          color: "#374151",
          marginBottom: 4 
        }}>
          📋 Your Action:
        </div>
        <div style={{ 
          fontSize: 13, 
          color: "#4b5563",
          lineHeight: 1.4 
        }}>
          {suggestion.action}
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        gap: 8 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Value Badge */}
          {valueIcon && suggestion.value && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 4,
              background: "#f0f9ff",
              border: "1px solid #0ea5e9",
              borderRadius: 6,
              padding: "2px 6px",
              fontSize: 11,
            }}>
              <span>{valueIcon}</span>
              <span style={{ color: "#0369a1" }}>{suggestion.value}</span>
            </div>
          )}

          {/* Estimated Time */}
          {suggestion.estimatedTime && (
            <div style={{ 
              fontSize: 11, 
              color: "#6b7280",
              background: "#f3f4f6",
              padding: "2px 6px",
              borderRadius: 4,
            }}>
              ⏱️ {suggestion.estimatedTime}
            </div>
          )}
        </div>

        {/* Difficulty */}
        {suggestion.difficulty && (
          <div style={{ 
            fontSize: 11, 
            color: difficultyColors[suggestion.difficulty],
            fontWeight: 500,
          }}>
            {suggestion.difficulty === 'easy' && '🟢 Easy'}
            {suggestion.difficulty === 'medium' && '🟡 Medium'}
            {suggestion.difficulty === 'hard' && '🔴 Hard'}
          </div>
        )}
      </div>

      {/* Completion Checkbox */}
      {isCompleted && (
        <div style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "#22c55e",
          color: "white",
          borderRadius: "50%",
          width: 24,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: "bold",
        }}>
          ✓
        </div>
      )}
    </div>
  );
}
