import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getSupabaseClient } from "../lib/supabase";
import { useResetZoom } from "../utils/useResetZoom";
import { skipDays, resetTime, getDebugInfo, invalidateTimeCaches, isDebugMode } from "../utils/timeDebug";

interface SettingsProps {
  onBack: () => void;
  userName?: string;
  onResetOnboarding: () => void;
  onResetAllData: () => void;
  onLogout?: () => void;
}

type ConfirmDialog = {
  type: "resetOnboarding" | "resetAllData" | "logout" | null;
};

export function Settings({
  onBack,
  userName,
  onResetOnboarding,
  onResetAllData,
  onLogout,
}: SettingsProps) {
  useResetZoom();

  const { user, userProfile, updateProfile, forceLogoutAndRedirect } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setConfirmDialog({ type: null });
    // Use synchronous clear + redirect so we never hang on async signOut (e.g. getSupabaseClient)
    forceLogoutAndRedirect();
  };

  // Form states
  const [firstName, setFirstName] = useState(userProfile?.first_name || "");
  const [lastName, setLastName] = useState(userProfile?.last_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI states
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({ type: null });
  
  // Debug time travel states
  const [debugInfo, setDebugInfo] = useState(getDebugInfo());
  const [showDebug, setShowDebug] = useState(isDebugMode());

  // Show message temporarily
  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Update name
  const handleUpdateName = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showMessage("error", "Please enter both first and last name");
      return;
    }

    setIsUpdating(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      showMessage("success", "Name updated successfully!");
    } catch (error) {
      showMessage("error", "Failed to update name. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update email
  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      showMessage("error", "Please enter an email address");
      return;
    }

    if (email === user?.email) {
      showMessage("error", "This is already your current email");
      return;
    }

    setIsUpdating(true);
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ email: email.trim() });
      if (error) throw error;
      showMessage("success", "Verification email sent! Please check your inbox.");
    } catch (error: any) {
      showMessage("error", error.message || "Failed to update email");
    } finally {
      setIsUpdating(false);
    }
  };

  // Update password
  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showMessage("error", "Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      showMessage("error", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("error", "Passwords do not match");
      return;
    }

    setIsUpdating(true);
    try {
      const supabase = await getSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showMessage("success", "Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      showMessage("error", error.message || "Failed to update password");
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm and execute reset onboarding
  const handleConfirmResetOnboarding = () => {
    setConfirmDialog({ type: null });
    onResetOnboarding();
    showMessage("success", "Onboarding data has been reset");
  };

  // Confirm and execute reset all data
  const handleConfirmResetAllData = () => {
    setConfirmDialog({ type: null });
    onResetAllData();
  };

  // Debug time travel handlers
  const handleSkipTime = (days: number) => {
    skipDays(days);
    invalidateTimeCaches();
    setDebugInfo(getDebugInfo());
    setShowDebug(true);
    
    // Show notification
    const info = getDebugInfo();
    showMessage("success", `⏭️ Skipped ${days} day(s) forward! New date: ${info.simulatedTime.toLocaleDateString()}. Refresh to see changes.`);
  };

  const handleResetTime = () => {
    resetTime();
    invalidateTimeCaches();
    setDebugInfo(getDebugInfo());
    setShowDebug(false);
    
    showMessage("success", "🔄 Time reset to normal! Refresh the page.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", paddingTop: "70px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚙️</div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: "#3b3b3b",
            }}
          >
            Settings
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: 16, marginTop: 8 }}>
            Manage your account and preferences
          </p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              marginBottom: 24,
              padding: "16px 20px",
              borderRadius: 12,
              background:
                message.type === "success"
                  ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
                  : "linear-gradient(135deg, #fee2e2, #fecaca)",
              border: `2px solid ${message.type === "success" ? "#10b981" : "#ef4444"}`,
              color: message.type === "success" ? "#065f46" : "#991b1b",
              fontSize: 14,
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Profile Settings Section */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: 20,
              fontWeight: 700,
              color: "#3b3b3b",
            }}
          >
            👤 Profile Settings
          </h2>

          {/* Name */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#6b6b6b",
                marginBottom: 8,
              }}
            >
              Name
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  fontSize: 16,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={handleUpdateName}
              disabled={isUpdating}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 600,
                cursor: isUpdating ? "not-allowed" : "pointer",
                fontSize: 14,
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? "Updating..." : "Update Name"}
            </button>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#6b6b6b",
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleUpdateEmail}
              disabled={isUpdating}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 600,
                cursor: isUpdating ? "not-allowed" : "pointer",
                fontSize: 14,
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? "Updating..." : "Update Email"}
            </button>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
              Note: Changing your email will require verification
            </p>
          </div>

          {/* Password */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 600,
                color: "#6b6b6b",
                marginBottom: 8,
              }}
            >
              Change Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 16,
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleUpdatePassword}
              disabled={isUpdating}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
                color: "#fff",
                fontWeight: 600,
                cursor: isUpdating ? "not-allowed" : "pointer",
                fontSize: 14,
                opacity: isUpdating ? 0.6 : 1,
              }}
            >
              {isUpdating ? "Updating..." : "Change Password"}
            </button>
          </div>
        </div>

        {/* Data Management Section */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: 20,
              fontWeight: 700,
              color: "#3b3b3b",
            }}
          >
            🗂️ Data Management
          </h2>

          {/* Reset Onboarding */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(251,191,36,0.08)",
              border: "2px solid #fbbf24",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                fontWeight: 700,
                color: "#92400e",
              }}
            >
              Reset Onboarding Data
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#78350f",
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              This will clear your assessment results and onboarding progress, allowing you to
              retake the assessment. Your journal entries will be preserved.
            </p>
            <button
              onClick={() => setConfirmDialog({ type: "resetOnboarding" })}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#fbbf24",
                color: "#78350f",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Reset Onboarding
            </button>
          </div>

          {/* Reset All Data */}
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(239,68,68,0.08)",
              border: "2px solid #ef4444",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px 0",
                fontSize: 16,
                fontWeight: 700,
                color: "#991b1b",
              }}
            >
              Reset All Data
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#7f1d1d",
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              This will permanently delete all your data including assessment results, onboarding
              progress, and journal entries. This action cannot be undone.
            </p>
            <button
              onClick={() => setConfirmDialog({ type: "resetAllData" })}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              Reset All Data
            </button>
          </div>
        </div>

        {/* 🧪 DEBUG TIME TRAVEL SECTION */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.15))",
            border: "2px dashed #f97316",
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 24 }}>🧪</span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#ea580c" }}>
              Debug Time Travel
            </h3>
          </div>
          
          <p style={{ fontSize: 14, color: "#9a3412", marginBottom: 16, lineHeight: 1.5 }}>
            Skip forward in time to test Daily Insights, Weekly Check-ins, and other time-based features.
            <strong> Testing only!</strong>
          </p>

          {showDebug && (
            <div
              style={{
                background: "rgba(251, 146, 60, 0.1)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
                fontSize: 13,
                color: "#7c2d12",
              }}
            >
              <div><strong>Real Time:</strong> {debugInfo.realTime.toLocaleString()}</div>
              <div><strong>Simulated Time:</strong> {debugInfo.simulatedTime.toLocaleString()}</div>
              <div><strong>Offset:</strong> {debugInfo.offsetDays} days ({debugInfo.offsetMs}ms)</div>
            </div>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            <button
              onClick={() => handleSkipTime(1)}
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: "2px solid #f97316",
                background: "white",
                color: "#f97316",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f97316";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#f97316";
              }}
            >
              ⏭️ Skip 1 Day
            </button>

            <button
              onClick={() => handleSkipTime(7)}
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: "2px solid #f97316",
                background: "white",
                color: "#f97316",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f97316";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.color = "#f97316";
              }}
            >
              ⏭️⏭️ Skip 7 Days (1 Week)
            </button>

            {showDebug && (
              <button
                onClick={handleResetTime}
                style={{
                  padding: "14px 20px",
                  borderRadius: 12,
                  border: "2px solid #dc2626",
                  background: "white",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#dc2626";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#dc2626";
                }}
              >
                🔄 Reset Time to Normal
              </button>
            )}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#9a3412",
              marginTop: 12,
              fontStyle: "italic",
            }}
          >
            💡 Tip: After skipping time, refresh the page to see new insights and sparks!
          </div>
        </div>

        {/* Account Section - position relative and z-index so logout control is on top */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: 20,
              fontWeight: 700,
              color: "#3b3b3b",
            }}
          >
            👋 Account
          </h2>

          <a
            href="#"
            role="button"
            tabIndex={0}
            aria-label="Log out"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirmDialog({ type: "logout" });
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setConfirmDialog({ type: "logout" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setConfirmDialog({ type: "logout" });
              }
            }}
            style={{
              display: "block",
              padding: "14px 24px",
              minHeight: 48,
              borderRadius: 8,
              border: "2px solid #ef4444",
              background: isLoggingOut ? "#fef2f2" : "#fff",
              color: "#ef4444",
              fontWeight: 600,
              cursor: isLoggingOut ? "wait" : "pointer",
              fontSize: 16,
              width: "100%",
              textAlign: "center",
              textDecoration: "none",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              boxSizing: "border-box",
            }}
          >
            {isLoggingOut ? "Logging out…" : "🚪 Log Out"}
          </a>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            border: "1px solid #d1d5db",
            background: "#fff",
            color: "#6b6b6b",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 16,
            width: "100%",
            marginBottom: 40,
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Confirmation Dialog Overlay */}
      {confirmDialog.type && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.5)",
              zIndex: 100,
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={() => setConfirmDialog({ type: null })}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#fff",
              borderRadius: 16,
              padding: 32,
              maxWidth: 480,
              width: "90%",
              zIndex: 101,
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              animation: "scaleIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>
              {confirmDialog.type === "logout" ? "🚪" : confirmDialog.type === "resetOnboarding" ? "⚠️" : "🚨"}
            </div>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: 22,
                fontWeight: 800,
                color: "#3b3b3b",
                textAlign: "center",
              }}
            >
              {confirmDialog.type === "logout"
                ? "Log out?"
                : confirmDialog.type === "resetOnboarding"
                  ? "Reset Onboarding Data?"
                  : "Reset All Data?"}
            </h3>
            <p
              style={{
                fontSize: 15,
                color: "#6b6b6b",
                lineHeight: 1.6,
                marginBottom: 24,
                textAlign: "center",
              }}
            >
              {confirmDialog.type === "logout" ? (
                "Are you sure you want to log out? You can sign back in anytime."
              ) : confirmDialog.type === "resetOnboarding" ? (
                <>
                  Continuing will delete:
                  <br />
                  <strong>• Assessment results</strong>
                  <br />
                  <strong>• Onboarding progress</strong>
                  <br />
                  <br />
                  Your journal entries will be preserved.
                </>
              ) : (
                <>
                  Continuing will permanently delete:
                  <br />
                  <strong>• Assessment results</strong>
                  <br />
                  <strong>• Onboarding progress</strong>
                  <br />
                  <strong>• All journal entries</strong>
                  <br />
                  <br />
                  This action cannot be undone.
                </>
              )}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setConfirmDialog({ type: null })}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  color: "#6b6b6b",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                Cancel
              </button>
              <button
                onClick={
                  confirmDialog.type === "logout"
                    ? handleLogout
                    : confirmDialog.type === "resetOnboarding"
                      ? handleConfirmResetOnboarding
                      : handleConfirmResetAllData
                }
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    confirmDialog.type === "logout"
                      ? "#ef4444"
                      : confirmDialog.type === "resetOnboarding"
                        ? "#fbbf24"
                        : "#ef4444",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {confirmDialog.type === "logout" ? "Log out" : confirmDialog.type === "resetOnboarding" ? "Reset Onboarding" : "Reset All"}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to { 
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

