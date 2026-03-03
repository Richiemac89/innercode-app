import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  maxLines?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  maxLines = 3,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = 24; // Approximate line height
      const maxHeight = lineHeight * maxLines;
      
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px';
    }
  }, [value, maxLines]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!disabled && value.trim()) {
      onSubmit();
    }
  };

  return (
    <div 
      style={{ 
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        background: "white",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div 
        style={{ 
          display: "flex", 
          alignItems: "flex-end",
          gap: "8px",
          background: "#f7f7f8",
          borderRadius: "24px",
          border: isFocused ? "1px solid #6A3ABF" : "1px solid #e5e7eb",
          padding: "8px 12px",
          transition: "border-color 0.2s, background-color 0.2s",
          minHeight: "48px",
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            fontSize: "16px",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            lineHeight: "24px",
            color: "#1f2937",
            padding: "8px 0",
            minHeight: "24px",
            maxHeight: `${24 * maxLines}px`,
            overflowY: "auto",
            WebkitAppearance: "none",
            appearance: "none",
          }}
        />
        
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="chat-send-button"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "none",
            background: value.trim() && !disabled ? "#6A3ABF" : "#d1d5db",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: value.trim() && !disabled ? "pointer" : "not-allowed",
            transition: "background-color 0.2s, transform 0.1s",
            flexShrink: 0,
            marginBottom: "2px",
            padding: "0",
            minWidth: "40px",
            minHeight: "40px",
          }}
          onMouseDown={(e) => {
            if (value.trim() && !disabled) {
              e.currentTarget.style.transform = "scale(0.95)";
            }
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseEnter={(e) => {
            if (value.trim() && !disabled) {
              e.currentTarget.style.background = "#5a2fa8";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = value.trim() && !disabled ? "#6A3ABF" : "#d1d5db";
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
            stroke="none"
            style={{ flexShrink: 0 }}
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
