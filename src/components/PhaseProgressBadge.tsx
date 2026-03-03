// Phase Progress Badge Component
// Shows phase completion status for life areas

interface PhaseProgressBadgeProps {
  phase: 1 | 2 | 3;
  completed: boolean;
  locked: boolean;
}

export function PhaseProgressBadge({ phase, completed, locked }: PhaseProgressBadgeProps) {
  const getBadgeStyle = () => {
    if (completed) {
      return {
        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
        border: "2px solid #f59e0b",
        color: "#92400e",
      };
    }
    
    if (locked) {
      return {
        background: "rgba(139,92,246,0.1)",
        border: "1px solid rgba(139,92,246,0.3)",
        color: "#6A3ABF",
      };
    }
    
    return {
      background: "#ecfdf5",
      border: "1px solid #bbf7d0",
      color: "#065f46",
    };
  };
  
  const getEmoji = () => {
    if (completed) return "⭐";
    if (locked) return "🔒";
    return "✓";
  };
  
  const getLabel = () => {
    if (phase === 1) return "Foundation";
    if (phase === 2) return "Exploration";
    if (phase === 3) return "Mastery";
    return "";
  };
  
  const style = getBadgeStyle();
  
  return (
    <div
      style={{
        fontSize: 11,
        padding: "4px 8px",
        borderRadius: 12,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...style,
      }}
    >
      <span>{getEmoji()}</span>
      <span>Phase {phase}: {getLabel()}</span>
    </div>
  );
}

