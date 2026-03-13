import { JournalEntry } from "../types";
import { dayKeyFromTs } from "../utils/helpers";

interface MoodTrendsProps {
  entries: JournalEntry[];
}

const moodScores: Record<string, number> = {
  "😭": 1,
  "☹️": 2,
  "😐": 3,
  "🙂": 4,
  "😄": 5,
  "😡": 2, // anger is also negative
};

function getMoodScore(mood: string | undefined): number {
  if (!mood) return 3; // neutral default
  return moodScores[mood] || 3;
}

function getWeeklyMoodData(entries: JournalEntry[]): { date: string; score: number; emoji: string }[] {
  const today = new Date();
  const weekData: { date: string; score: number; emoji: string }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const dayKey = dayKeyFromTs(date.getTime());
    const dayEntries = entries.filter((e) => dayKeyFromTs(e.createdAt) === dayKey);
    const morningEntry = dayEntries.find((e) => e.slot === "morning");
    const eveningEntry = dayEntries.find((e) => e.slot === "evening" || e.slot == null);

    const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
    const scores: number[] = [];
    const emojis: string[] = [];
    if (morningEntry?.mood) {
      scores.push(getMoodScore(morningEntry.mood));
      emojis.push("☀️" + morningEntry.mood);
    }
    if (eveningEntry?.mood) {
      scores.push(getMoodScore(eveningEntry.mood));
      emojis.push("🌙" + eveningEntry.mood);
    }
    const score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const emoji = emojis.length > 0 ? emojis.join(" ") : "";

    weekData.push({ date: weekday, score, emoji });
  }

  return weekData;
}

export function MoodTrends({ entries }: MoodTrendsProps) {
  const weekData = getWeeklyMoodData(entries);
  const avgScore = weekData.filter(d => d.score > 0).reduce((sum, d) => sum + d.score, 0) / weekData.filter(d => d.score > 0).length;
  const trend = weekData.length >= 2 && weekData[6].score > weekData[0].score ? "up" : weekData[6].score < weekData[0].score ? "down" : "stable";
  
  // Get most common mood
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    if (e.mood) {
      moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
    }
  });
  const mostCommon = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "🙂";

  const maxScore = 5;
  const hasData = weekData.some(d => d.score > 0);

  // Reactive emoji strip: 2 lines when any day has morning+evening (emoji contains space)
  const needsTwoLines = hasData && weekData.some(d => d.emoji && d.emoji.includes(" "));
  const emojiStripHeight = needsTwoLines ? 52 : 28;
  const barMaxHeight = 140;
  const dayLabelHeight = 24;
  const chartHeight = emojiStripHeight + barMaxHeight + dayLabelHeight;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
        <span style={{ fontSize: 24 }}>📈</span>
        <h3 style={{ margin: 0, fontSize: 18 }}>Mood Trends (Last 7 Days)</h3>
      </div>

      {!hasData ? (
        <div style={{ textAlign: "center", color: "#6b6b6b", padding: "20px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div>Start journaling with moods to see your trends!</div>
        </div>
      ) : (
        <>
          {/* Bar Chart: reactive height = emoji strip + bars + labels */}
          <div
            style={{
              display: "flex",
              alignItems: "stretch",
              gap: 8,
              height: chartHeight,
              marginBottom: 16,
            }}
          >
            {weekData.map((day, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                {/* Emoji strip: full column width so content centers over bar */}
                <div
                  style={{
                    height: emojiStripHeight,
                    alignSelf: "stretch",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 20,
                    gap: 2,
                    textAlign: "center",
                  }}
                >
                  {day.emoji ? (
                    day.emoji.includes(" ") ? (
                      day.emoji.split(" ").map((part, j) => (
                        <span key={j} style={{ display: "block" }}>{part}</span>
                      ))
                    ) : (
                      <span>{day.emoji}</span>
                    )
                  ) : null}
                </div>
                {/* Bar area: full column width, bar aligned to bottom */}
                <div
                  style={{
                    height: barMaxHeight,
                    alignSelf: "stretch",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: day.score > 0 ? `${(day.score / maxScore) * barMaxHeight}px` : "10px",
                      background: day.score > 0
                        ? day.score >= 4
                          ? "linear-gradient(180deg, #10b981, #059669)"
                          : day.score === 3
                          ? "linear-gradient(180deg, #f59e0b, #d97706)"
                          : "linear-gradient(180deg, #ef4444, #dc2626)"
                        : "#e5e7eb",
                      borderRadius: "8px 8px 0 0",
                      transition: "all 0.3s ease",
                    }}
                  />
                </div>
                {/* Day label */}
                <div
                  style={{
                    height: dayLabelHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: 11,
                    color: "#6b6b6b",
                    fontWeight: 600,
                  }}
                >
                  {day.date}
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              paddingTop: 12,
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{mostCommon}</div>
              <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 4 }}>
                Most Common
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#3b3b3b" }}>
                {avgScore > 0 ? avgScore.toFixed(1) : "-"}
              </div>
              <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 4 }}>
                Avg Mood
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>
                {trend === "up" ? "📈" : trend === "down" ? "📉" : "➡️"}
              </div>
              <div style={{ fontSize: 11, color: "#6b6b6b", marginTop: 4 }}>
                Trend
              </div>
            </div>
          </div>

          {/* Insight */}
          {avgScore > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                borderRadius: 12,
                background:
                  avgScore >= 4
                    ? "rgba(16,185,129,0.08)"
                    : avgScore >= 3
                    ? "rgba(245,158,11,0.08)"
                    : "rgba(239,68,68,0.08)",
                border:
                  avgScore >= 4
                    ? "1px solid rgba(16,185,129,0.2)"
                    : avgScore >= 3
                    ? "1px solid rgba(245,158,11,0.2)"
                    : "1px solid rgba(239,68,68,0.2)",
                fontSize: 13,
                color: "#4b4b4b",
              }}
            >
              {avgScore >= 4
                ? "🌟 You're doing great this week! Keep up the positive momentum."
                : avgScore >= 3
                ? "💭 Your mood has been steady. Consider activities from your values list."
                : "💜 Tough week? Remember to be kind to yourself and reach out for support."}
            </div>
          )}
        </>
      )}
    </div>
  );
}

