import { useState } from "react";
import { CATEGORY_ICONS } from "../constants/categories";
import { VALUE_ICONS } from "../constants/values";
import { JournalEntry } from "../types";

export function JournalCalendar({
  entries,
  onBack,
  userName,
}: {
  entries: JournalEntry[];
  onBack: () => void;
  userName?: string;
}) {
  // Local day key like "2025-09-09"
  function dateKey(ts: number) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    return y + "-" + m + "-" + day;
  }

  // Group entries by date
  const byDate: Record<string, JournalEntry[]> = {};
  entries.forEach((e) => {
    const k = dateKey(e.createdAt);
    if (!byDate[k]) byDate[k] = [];
    byDate[k].push(e);
  });

  // Month navigation + selected date
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // month 0–11
  });
  const [selected, setSelected] = useState<string | null>(() => {
    const d = new Date();
    return dateKey(+d);
  });

  function startOfMonth(year: number, month: number) {
    return new Date(year, month, 1);
  }
  function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }
  function prevMonth() {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0
        ? { year: c.year - 1, month: 11 }
        : { year: c.year, month: m };
    });
  }
  function nextMonth() {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11
        ? { year: c.year + 1, month: 0 }
        : { year: c.year, month: m };
    });
  }

  // Build calendar cells
  const first = startOfMonth(cursor.year, cursor.month);
  const startWeekday = first.getDay(); // 0 = Sun
  const totalDays = daysInMonth(cursor.year, cursor.month);
  const cells: Array<{ label: string; key?: string; has?: boolean }> = [];

  for (let i = 0; i < startWeekday; i++) cells.push({ label: "" });
  for (let d = 1; d <= totalDays; d++) {
    const dt = new Date(cursor.year, cursor.month, d);
    const k = dateKey(+dt);
    cells.push({ label: String(d), key: k, has: !!byDate[k] });
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const selectedEntries: JournalEntry[] = selected
    ? byDate[selected] || []
    : [];

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(167,139,250,0.10), rgba(16,185,129,0.10))",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 18, paddingTop: "70px" }}>
        {/* Welcome Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📅</div>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: "#3b3b3b",
            }}
          >
            {(() => {
              const hour = new Date().getHours();
              const greeting = 
                hour < 12 ? "Good morning" :
                hour < 18 ? "Good afternoon" :
                "Good evening";
              return greeting;
            })()}{userName ? `, ${userName}` : ''}!
          </h1>
          <p style={{ color: "#6b6b6b", fontSize: 16, marginTop: 8 }}>
            Your Journal Calendar
          </p>
        </div>

        {/* Month controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <button
            onClick={prevMonth}
            style={{
              background: "transparent",
              border: "none",
              color: "#7C3AED",
              cursor: "pointer",
              padding: "6px 10px",
            }}
          >
            ←
          </button>
          <div style={{ fontWeight: 800 }}>
            {monthNames[cursor.month]} {cursor.year}
          </div>
          <button
            onClick={nextMonth}
            style={{
              background: "transparent",
              border: "none",
              color: "#7C3AED",
              cursor: "pointer",
              padding: "6px 10px",
            }}
          >
            →
          </button>
        </div>

        {/* Week headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
            marginBottom: 6,
            color: "#6b6b6b",
            fontSize: 12,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
            <div key={w} style={{ textAlign: "center" }}>
              {w}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 6,
          }}
        >
          {cells.map((c, i) => {
            const isSelected = selected === c.key;
            return (
              <button
                key={i}
                className="calendar-date-button"
                onClick={() => {
                  if (c.key) setSelected(c.key);
                }}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 12,
                  border: isSelected
                    ? "2px solid #8B5CF6"
                    : "1px solid #e5e7eb",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                  padding: 0,
                  cursor: c.key ? "pointer" : "default",
                }}
                disabled={!c.key}
              >
                {c.has ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: "#8B5CF6",
                    }}
                  />
                ) : null}
                <div style={{ textAlign: "center", width: "100%" }}>{c.label}</div>
              </button>
            );
          })}
        </div>

        {/* Entries list for selected day */}
        <div style={{ marginTop: 16 }}>
          {selected ? (
            <div style={{ marginBottom: 8, color: "#4b4b4b" }}>
              <strong>Entries</strong> — {selected}
            </div>
          ) : null}

          {selectedEntries.length === 0 ? (
            <div style={{ color: "#666" }}>No entries for this day.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 12,
              }}
            >
              {selectedEntries
                .slice()
                .sort((a, b) => b.createdAt - a.createdAt)
                .map((e) => {
                  // Support both new (e.categories[]) and legacy (e.category) data
                  const cats =
                    e.categories && e.categories.length
                      ? e.categories
                      : e.category
                      ? [e.category]
                      : [];
                  const vals = e.values || [];

                  return (
                    <div
                      key={e.id}
                      style={{
                        background: "#fff",
                        border: "1px solid #eee",
                        borderRadius: 14,
                        padding: 12,
                        boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
                      }}
                    >
                      {/* slot + time */}
                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b6b6b",
                          marginBottom: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>
                          {e.slot === "morning" ? "☀️ Morning" : e.slot === "evening" ? "🌙 Evening" : "🌙 Evening"}
                        </span>
                        <span>{new Date(e.createdAt).toLocaleTimeString()}</span>
                      </div>

                      {/* mood */}
                      {e.mood && (
                        <div style={{ fontSize: 20, marginBottom: 6 }}>
                          {e.mood}
                        </div>
                      )}

                      {/* text */}
                      <div style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>
                        {e.text}
                      </div>

                      {/* categories & values */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 6,
                        }}
                      >
                        {cats.map((c) => (
                          <span
                            key={`c-${c}`}
                            style={{
                              border: "1px solid #eee",
                              background: "#fafafa",
                              borderRadius: 999,
                              padding: "4px 8px",
                              fontSize: 12,
                            }}
                          >
                            {CATEGORY_ICONS[c]} {c}
                          </span>
                        ))}
                        {vals.map((v) => (
                          <span
                            key={`v-${v}`}
                            style={{
                              border: "1px solid #e5e7eb",
                              background: "#f9fafb",
                              borderRadius: 999,
                              padding: "4px 8px",
                              fontSize: 12,
                            }}
                          >
                            {VALUE_ICONS[v] ?? "✨"} {v}
                          </span>
                        ))}
                      </div>

                      {/* gratitude (morning) or went well (evening) */}
                      {e.slot === "morning" && e.gratitude && e.gratitude.length > 0 ? (
                        <div style={{ marginTop: 10, fontSize: 13 }}>
                          <strong>Grateful for:</strong>
                          <ul style={{ margin: "6px 0 0 18px" }}>
                            {e.gratitude.map((g, i) => (
                              <li key={i}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {e.slot === "evening" && e.wentWell && e.wentWell.length > 0 ? (
                        <div style={{ marginTop: 10, fontSize: 13 }}>
                          <strong>Went well:</strong>
                          <ul style={{ margin: "6px 0 0 18px" }}>
                            {e.wentWell.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {!e.slot && e.gratitude && e.gratitude.length > 0 ? (
                        <div style={{ marginTop: 10, fontSize: 13 }}>
                          <strong>Grateful for:</strong>
                          <ul style={{ margin: "6px 0 0 18px" }}>
                            {e.gratitude.map((g, i) => (
                              <li key={i}>{g}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Override global mobile CSS for calendar buttons */}
      <style>{`
        .calendar-date-button {
          padding: 0 !important;
          margin: 0 !important;
        }
      `}</style>
    </div>
  );
}

