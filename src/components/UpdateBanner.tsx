import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function UpdateBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentBuildId = typeof __APP_BUILD_ID__ !== "undefined" ? __APP_BUILD_ID__ : "";

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { buildId?: string };
        const serverBuildId = data.buildId ?? "";
        if (serverBuildId && serverBuildId !== currentBuildId) {
          setShowBanner(true);
        }
      } catch {
        // ignore network errors
      }
    };

    const t = setTimeout(check, 15000); // first check after 15s
    const interval = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
        color: "#fff",
        padding: "10px 16px",
        fontSize: 14,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
      }}
    >
      <span>A new version is available. Please refresh to update.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          background: "rgba(255,255,255,0.25)",
          border: "1px solid rgba(255,255,255,0.5)",
          color: "#fff",
          padding: "6px 14px",
          borderRadius: 8,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        Refresh
      </button>
    </div>
  );
}
