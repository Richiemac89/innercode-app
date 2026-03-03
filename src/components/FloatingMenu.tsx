import { useState, useEffect } from "react";
import { Route } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { getSafeLocalStorage } from "../utils/helpers";

type UserState = "first-time" | "in-progress" | "completed";

export function FloatingMenu({ 
  onNav,
  onLogout,
}: { 
  onNav: (route: Route) => void;
  onLogout?: () => void;
}) {
  const { userData, syncComplete } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userState, setUserState] = useState<UserState>("first-time");
  const [showLockedTooltip, setShowLockedTooltip] = useState<string | null>(null);

  // CRITICAL FIX: Use useEffect instead of useMemo since we're setting state
  // Also check both userData and local storage to prevent false "in-progress" state during refresh
  useEffect(() => {
    if (!syncComplete) {
      setUserState("in-progress");
      return;
    }

    const onboardingState = userData.onboardingState;
    const hasResults = !!userData.results;
    const hasOnboardingAnswers = Array.isArray(userData.onboardingAnswers) && userData.onboardingAnswers.length > 0;
    const hasCompletedCategories = onboardingState?.completed_categories && onboardingState.completed_categories.length > 0;

    // CRITICAL FIX: Also check local storage for results and hasSeenResults
    const localResults = typeof window !== 'undefined' 
      ? (getSafeLocalStorage()?.getItem('innercode_results'))
      : null;
    const hasLocalResults = localResults ? (() => {
      try {
        const parsed = JSON.parse(localResults);
        return !!parsed && typeof parsed === 'object';
      } catch {
        return false;
      }
    })() : false;

    const localHasSeenResults = typeof window !== 'undefined' 
      ? (getSafeLocalStorage()?.getItem('innercode_hasSeenResults') === 'true')
      : false;
    const hasSeenResults = onboardingState?.has_seen_results || localHasSeenResults;

    // User is completed if ANY of these are true:
    // 1. They have results (remote or local) AND have seen them
    // 2. They have onboarding answers (completed onboarding flow)
    // 3. They have completed categories (finished at least one category)
    const isCompleted = 
      ((hasResults || hasLocalResults) && hasSeenResults) ||
      hasOnboardingAnswers ||
      hasCompletedCategories;

    if (isCompleted) {
      setUserState("completed");
      return;
    }

    // Only show "in-progress" if user has actually started but not completed
    if (onboardingState) {
      const selectedCategories = onboardingState.selected_categories || [];
      const completedCategories = onboardingState.completed_categories || [];
      const hasIncompleteCategories = selectedCategories.some(
        (cat: string) => !completedCategories.includes(cat)
      );

      // Only show in-progress if they have actual progress but no results yet
      if (
        (onboardingState.step > 0 ||
         (Array.isArray(onboardingState.messages) && onboardingState.messages.length > 0) ||
         hasIncompleteCategories) &&
        !hasResults &&
        !hasOnboardingAnswers &&
        !hasCompletedCategories
      ) {
        setUserState("in-progress");
        return;
      }
    }

    // Default to first-time only if truly no progress
    setUserState("first-time");
  }, [userData.results, userData.onboardingState, userData.onboardingAnswers, syncComplete]);
  return (
    <div style={{ 
      position: "fixed", 
      top: 16, 
      left: 16, 
      zIndex: 50,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <button
        aria-label="Open menu"
        onClick={() => setSidebarOpen((v) => !v)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, #6A3ABF, #8A4EF0)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 20px rgba(106,58,191,0.35)",
          cursor: "pointer",
          padding: 0,
          margin: 0,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 12px 24px rgba(106,58,191,0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(106,58,191,0.35)";
        }}
      >
        <span style={{ 
          fontSize: "18px", 
          fontWeight: "bold", 
          color: "#ffffff",
          lineHeight: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          ☰
        </span>
      </button>

      {/* ChatGPT-style Sidebar */}
      {sidebarOpen && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 40,
              animation: "fadeIn 0.3s ease-out",
            }}
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              width: "280px",
              background: "#6A3ABF",
              boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
              zIndex: 50,
              animation: "slideInLeft 0.3s ease-out",
              padding: "20px 0",
              overflowY: "auto",
            }}
          >
            {/* Close Button */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              padding: "0 20px 20px 20px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
              marginBottom: "20px"
            }}>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(255, 255, 255, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "#ffffff",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
              >
                ×
              </button>
            </div>

            {/* Menu Items */}
            <div style={{ padding: "0 20px" }}>
              {(() => {
                const items: Array<{ label: string; r: Route; locked?: boolean }> = [
                  { label: "📱 Dashboard", r: "dashboard" },
                ];

                // CRITICAL FIX: Remove "Continue Onboarding" menu item
                // Users can only access menu after completing onboarding, so this is redundant
                // If user hasn't completed onboarding, they shouldn't see the menu at all

                if (userState === "completed") {
                  items.push(
                    { label: "📊 Results", r: "results" },
                    { label: "🤖 AI Coach", r: "aiCoach" },
                    { label: "📓 Journal", r: "journal" },
                    { label: "📅 Journal Calendar", r: "journalCalendar" },
                  );
                } else {
                  items.push(
                    { label: "📊 Results", r: "results", locked: true },
                    { label: "🤖 AI Coach", r: "aiCoach", locked: true },
                    { label: "📓 Journal", r: "journal", locked: true },
                    { label: "📅 Journal Calendar", r: "journalCalendar", locked: true },
                  );
                }

                items.push({ label: "ℹ️ How InnerCode Works", r: "instructions" });

                return items;
              })().map((it) => (
                <div
                  key={it.r}
                  style={{ marginBottom: "8px" }}
                >
                  <button
                    onClick={() => {
                      if (it.locked) return;
                      
                      // Blur any active input before navigation to trigger zoom-out
                      if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur();
                      }
                      
                      setSidebarOpen(false);
                      
                      // Delay to allow blur to take effect and zoom to reset
                      setTimeout(() => {
                        onNav(it.r as Route);
                      }, 100);
                    }}
                    disabled={it.locked}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      cursor: it.locked ? "not-allowed" : "pointer",
                      opacity: it.locked ? 0.5 : 1,
                      color: it.locked ? "rgba(255, 255, 255, 0.4)" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "16px",
                      fontWeight: "500",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!it.locked) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{it.label}</span>
                    {it.locked && <span style={{ fontSize: 14 }}>🔒</span>}
                  </button>
                </div>
              ))}
            </div>

            {/* Settings Button */}
            <div style={{ 
              padding: "20px 20px 0 20px",
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              marginTop: "20px"
            }}>
              <button
                onClick={() => {
                  // Blur any active input before navigation to trigger zoom-out
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  
                  setSidebarOpen(false);
                  
                  // Delay to allow blur to take effect and zoom to reset
                  setTimeout(() => {
                    onNav("settings" as Route);
                  }, 100);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '16px',
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
        </>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

