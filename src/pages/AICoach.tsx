import { useState, useEffect, useRef } from "react";
import { Suggestion } from "../components/SuggestionCard";
import { ChatInput } from "../components/ChatInput";
import { VALUE_ICONS } from "../constants/values";
import { CATEGORY_ICONS } from "../constants/categories";
import { aiService } from "../utils/aiService";
import { JournalSnapshotEntry } from "../utils/contextBuilders";

interface AICoachProps {
  weakAreaSuggestions: Suggestion[];
  valueStrengthSuggestions: Suggestion[];
  discoveryAreaSuggestions: Suggestion[];
  userName?: string;
  categoryScores?: Record<string, number>;
  completedCategories?: string[];
  valueEntries?: [string, number][];
  onboardingAnswers?: string[];
  journalSummary?: string;
  recentJournalEntries?: JournalSnapshotEntry[];
  goalsSummary?: string;
  onBack?: () => void;
  onJournal?: (prompt: string, suggestion?: Suggestion) => void;
}

interface Message {
  id: string;
  sender: "inny" | "you";
  text: string;
  timestamp: number;
}

type Mode = "landing" | "chat" | "suggestions" | "suggestionChat";

export function AICoach({
  weakAreaSuggestions = [],
  valueStrengthSuggestions = [],
  discoveryAreaSuggestions = [],
  userName = "",
  categoryScores = {},
  completedCategories = [],
  valueEntries = [],
  onboardingAnswers = [],
  journalSummary = "",
  recentJournalEntries = [],
  goalsSummary = "",
  onBack,
  onJournal,
}: AICoachProps) {
  const [mode, setMode] = useState<Mode>("landing");
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Combine all suggestions
  const allSuggestions = [
    ...weakAreaSuggestions,
    ...valueStrengthSuggestions,
    ...discoveryAreaSuggestions,
  ];

  // Start free chat mode
  const handleStartChat = () => {
    setMode("chat");
    const greeting: Message = {
      id: `inny-${Date.now()}`,
      sender: "inny",
      text: `Hi${userName ? ` ${userName}` : ''}! 👋 I'm Inny, your AI coach.\n\nI'm here to help you understand your InnerCode and take meaningful action. You can ask me anything:\n\n• Why is my ${getLowestCategory()} score lower?\n• What should I focus on this week?\n• Tell me about my top value: ${getTopValue()}\n• How can I improve my ${getLowestCategory()}?\n\nWhat's on your mind?`,
      timestamp: Date.now(),
    };
    setMessages([greeting]);
  };

  // Get lowest category for context
  const getLowestCategory = (): string => {
    if (!categoryScores || Object.keys(categoryScores).length === 0) return "life areas";
    const entries = Object.entries(categoryScores).sort((a, b) => a[1] - b[1]);
    return entries[0]?.[0] || "life areas";
  };

  // Get top value for context
  const getTopValue = (): string => {
    if (!valueEntries || valueEntries.length === 0) return "values";
    return valueEntries[0]?.[0] || "values";
  };

  // Handle suggestion card click
  const handleSuggestionClick = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setMode("suggestionChat");
    
    const icon = suggestion.value ? VALUE_ICONS[suggestion.value] : CATEGORY_ICONS[suggestion.category];
    const openingMessage: Message = {
      id: `inny-${Date.now()}`,
      sender: "inny",
      text: `Let's explore this action together! ${icon}\n\n"${suggestion.action}"\n\nThis suggestion came up because ${getReasonForSuggestion(suggestion)}.\n\nHow does this feel to you? Would you like me to:\n• Explain why this matters\n• Break it into smaller steps\n• Adjust it to fit your schedule`,
      timestamp: Date.now(),
    };
    
    setMessages([openingMessage]);
  };

  // Get reason for suggestion based on type
  const getReasonForSuggestion = (suggestion: Suggestion): string => {
    if (suggestion.type === "weakness") {
      return `you rated ${suggestion.category} lower, and this could help strengthen that area`;
    } else if (suggestion.type === "value-aligned") {
      return `${suggestion.value} is one of your core values, and this action aligns with it`;
    } else {
      return `this could help you explore new areas and discover what matters to you`;
    }
  };

  // Handle user message
  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `you-${Date.now()}`,
      sender: "you",
      text: input.trim(),
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setIsTyping(true);

    // Use AI service for responses
    setTimeout(async () => {
      try {
        const context = {
          userName,
          categoryScores,
          completedCategories,
          valueEntries,
          lowestCategory: getLowestCategory(),
          topValue: getTopValue(),
          allSuggestions,
          weakAreaSuggestions,
          valueStrengthSuggestions,
          discoveryAreaSuggestions,
          conversationHistory: messages.map(m => ({ sender: m.sender, text: m.text })),
          onboardingAnswers,
          journalSummary,
          recentJournalEntries,
          goalsSummary,
        };

        const response = mode === "suggestionChat"
          ? await aiService.chatAboutSuggestion(userInput, selectedSuggestion!, context)
          : await aiService.chat(userInput, context);

        const innyMessage: Message = {
          id: `inny-${Date.now()}`,
          sender: "inny",
          text: response,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, innyMessage]);
      } catch (error) {
        console.error("Inny chat failed", error);
        setMessages(prev => [
          ...prev,
          {
            id: `inny-error-${Date.now()}`,
            sender: "inny",
            text: "I’m having trouble connecting right now, but I’m here with you. Could you try again in a moment?",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    }, 1000 + Math.random() * 1000);
  };

  // AI abstraction: Logic moved to aiService
  // Old functions (generateChatResponse, generateSuggestionResponse, getValueDescription) 
  // have been moved to src/utils/aiProviders/staticAI.ts

  // Handle journal about suggestion
  const handleJournalAbout = () => {
    if (!selectedSuggestion) return;
    
    const journalPrompt = `Reflecting on: "${selectedSuggestion.action}"\n\nHow does this action align with my values? What would success look like? What's my first step?`;
    
    if (onJournal) {
      onJournal(journalPrompt, selectedSuggestion);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (mode === "suggestionChat") {
      setMode("suggestions");
      setSelectedSuggestion(null);
      setMessages([]);
    } else if (mode === "chat" || mode === "suggestions") {
      setMode("landing");
      setMessages([]);
    }
  };

  // Render based on mode
  if (mode === "landing") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
          padding: "24px",
          paddingBottom: "100px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
          }}
        >
          {/* Header with Inny */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "40px",
              opacity: 1,
              animation: "fadeIn 0.6s ease-out",
            }}
          >
            <div
              style={{
                fontSize: "80px",
                marginBottom: "16px",
                animation: "float 3s ease-in-out infinite",
              }}
            >
              🤖
            </div>
            <h1
              style={{
                margin: "0 0 12px",
                fontSize: "32px",
                fontWeight: 800,
                color: "#3b3b3b",
              }}
            >
              Inny, your AI Coach
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "18px",
                color: "#6b6b6b",
                lineHeight: 1.5,
              }}
            >
              Hi{userName ? ` ${userName}` : ''}! How can I help you today?
            </p>
          </div>

          {/* Chat Button */}
          <button
            onClick={handleStartChat}
            style={{
              width: "100%",
              padding: "32px 24px",
              borderRadius: "24px",
              border: "none",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              marginBottom: "16px",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(106, 58, 191, 0.3)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: "translateY(0)",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.3)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  fontSize: "48px",
                  width: "64px",
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
                  borderRadius: "16px",
                }}
              >
                💬
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>
                  Chat with Inny
                </h3>
                <p style={{ margin: 0, fontSize: "15px", color: "#6b7280", lineHeight: 1.4 }}>
                  Ask me anything about your results, values, or what to focus on
                </p>
              </div>
            </div>
          </button>

          {/* Suggestions Button */}
          <button
            onClick={() => setMode("suggestions")}
            style={{
              width: "100%",
              padding: "32px 24px",
              borderRadius: "24px",
              border: "none",
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(20px)",
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(106, 58, 191, 0.3)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: "translateY(0)",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(106, 58, 191, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(106, 58, 191, 0.3)";
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  fontSize: "48px",
                  width: "64px",
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #8A4EF0, #B088F0)",
                  borderRadius: "16px",
                }}
              >
                💡
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 700, color: "#1f2937" }}>
                  Get Suggestions
                </h3>
                <p style={{ margin: 0, fontSize: "15px", color: "#6b7280", lineHeight: 1.4 }}>
                  View {allSuggestions.length} personalized actions based on your InnerCode
                </p>
              </div>
            </div>
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render Suggestions Mode
  if (mode === "suggestions") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "white",
          paddingBottom: "100px",
        }}
      >
        {/* Purple Header */}
        <div
          style={{
            padding: "16px 20px",
            background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <button
            onClick={handleBack}
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "transparent",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "13px",
              fontWeight: 500,
              opacity: 0.7,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Back
          </button>
          <div
            style={{
              fontSize: 20,
              animation: "float 3s ease-in-out infinite",
            }}
          >
            🤖
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "16px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              Your Personalized Actions
            </div>
            <div style={{ fontSize: "12px", opacity: 0.9 }}>
              {allSuggestions.length} tailored suggestions
            </div>
          </div>
        </div>

        {/* Suggestions Content */}
        <div
          style={{
            padding: "24px",
          }}
        >

        {/* Suggestion Cards */}
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            display: "grid",
            gap: "16px",
          }}
        >
          {allSuggestions.length === 0 ? (
            <div
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                borderRadius: "24px",
                padding: "32px",
                textAlign: "center",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🌱</div>
              <h3 style={{ margin: "0 0 8px", fontSize: "20px", color: "#6A3ABF" }}>
                Complete your assessment first
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
                Inny needs to learn about you before suggesting personalized actions
              </p>
            </div>
          ) : (
            allSuggestions.map((suggestion, index) => {
              const icon = suggestion.value ? VALUE_ICONS[suggestion.value] : CATEGORY_ICONS[suggestion.category];
              
              return (
                <div
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(20px)",
                    borderRadius: "20px",
                    padding: "20px",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: "0 4px 16px rgba(106, 58, 191, 0.1)",
                    opacity: 0,
                    animation: `slideUp 0.5s ease-out ${index * 0.1}s forwards`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(106, 58, 191, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(106, 58, 191, 0.1)";
                  }}
                >
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <span style={{ fontSize: "32px" }}>{icon}</span>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: "0 0 4px",
                          fontSize: "18px",
                          fontWeight: 700,
                          color: "#1f2937",
                        }}
                      >
                        {suggestion.title}
                      </h3>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            background: suggestion.type === "weakness" 
                              ? "rgba(239, 68, 68, 0.1)" 
                              : suggestion.type === "value-aligned"
                              ? "rgba(106, 58, 191, 0.1)"
                              : "rgba(59, 130, 246, 0.1)",
                            color: suggestion.type === "weakness"
                              ? "#dc2626"
                              : suggestion.type === "value-aligned"
                              ? "#6A3ABF"
                              : "#2563eb",
                            fontWeight: 600,
                          }}
                        >
                          {suggestion.type === "weakness" ? "Growth Area" : suggestion.type === "value-aligned" ? "Value Strength" : "Discovery"}
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            background: "rgba(156, 163, 175, 0.1)",
                            color: "#6b7280",
                            fontWeight: 600,
                          }}
                        >
                          {suggestion.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.6, color: "#6b7280" }}>
                    {suggestion.description}
                  </p>
                  
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(106, 58, 191, 0.05)",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#6A3ABF",
                    }}
                  >
                    💡 {suggestion.action}
                  </div>
                </div>
              );
            })
          )}
        </div>
        </div>

        <style>{`
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // Render Chat Mode (both free chat and suggestion chat)
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        paddingBottom: "100px",
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: "16px 20px",
          background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
          <button
            onClick={handleBack}
            style={{
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "transparent",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              flexShrink: 0,
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "13px",
              fontWeight: 500,
              opacity: 0.7,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.7";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Back
          </button>
          <div style={{ fontSize: "28px", flexShrink: 0 }}>🤖</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mode === "suggestionChat" && selectedSuggestion ? selectedSuggestion.title : "Chat with Inny"}
            </h3>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
              {mode === "suggestionChat" ? "Exploring this action" : "Your AI coach"}
            </p>
          </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: "24px",
          minHeight: "60vh",
        }}
      >
          {messages.map((msg, index) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.sender === "you" ? "flex-end" : "flex-start",
              marginBottom: "12px",
                opacity: 0,
                animation: `fadeInMessage 0.4s ease-out ${index * 0.1}s forwards`,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "14px 18px",
                  borderRadius: msg.sender === "inny" ? "18px 18px 18px 4px" : "18px 18px 4px 18px",
                  background: msg.sender === "inny" 
                    ? "rgba(106, 58, 191, 0.08)" 
                    : "#6A3ABF",
                  color: msg.sender === "inny" ? "#1f2937" : "white",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  boxShadow: msg.sender === "you" 
                    ? "0 4px 12px rgba(106, 58, 191, 0.3)" 
                    : "none",
                }}
              >
                {msg.sender === "inny" && (
                  <div style={{ fontWeight: 700, marginBottom: "6px", color: "#6A3ABF", fontSize: "13px" }}>
                    Inny
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  padding: "14px 18px",
                  borderRadius: "18px 18px 18px 4px",
                  background: "rgba(106, 58, 191, 0.08)",
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6A3ABF", fontWeight: 700, marginRight: "4px" }}>Inny</span>
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6A3ABF", animation: "bounce 1s infinite" }} />
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#8A4EF0", animation: "bounce 1s infinite 0.2s" }} />
                <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#B088F0", animation: "bounce 1s infinite 0.4s" }} />
              </div>
            </div>
          )}
          
        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons (only in suggestion chat mode) */}
      {mode === "suggestionChat" && selectedSuggestion && (
        <div style={{ padding: "12px 24px", background: "white", borderTop: "1px solid #f3f4f6" }}>
          <button
            onClick={handleJournalAbout}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "50px",
              border: "1px solid #6A3ABF",
              background: "white",
              color: "#6A3ABF",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#6A3ABF";
              e.currentTarget.style.color = "white";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.color = "#6A3ABF";
            }}
          >
            📓 Journal about this
          </button>
        </div>
      )}

      {/* ChatGPT-style Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={handleSendMessage}
        placeholder="Type your message..."
        disabled={false}
        maxLines={3}
      />

      <style>{`
        @keyframes fadeInMessage {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
