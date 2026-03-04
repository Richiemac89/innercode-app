import { useResetZoom } from "../utils/useResetZoom";

interface HowToUseInnyProps {
  onBack: () => void;
  onOpenAICoach?: () => void;
}

export function HowToUseInny({ onBack, onOpenAICoach }: HowToUseInnyProps) {
  useResetZoom();

  const background = "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(253,186,116,0.12))";

  const sectionStyle = {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  };

  const headingStyle = {
    margin: "0 0 12px",
    fontSize: 18,
    fontWeight: 700,
    color: "#3b3b3b",
  } as const;

  const bodyStyle = {
    margin: 0,
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 1.6,
  } as const;

  const promptItemStyle = {
    marginBottom: 8,
    padding: "10px 14px",
    background: "rgba(139,92,246,0.06)",
    borderRadius: 10,
    border: "1px solid rgba(139,92,246,0.15)",
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
  } as const;

  return (
    <div style={{ minHeight: "100vh", background, padding: 20, paddingTop: 70 }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 24px", fontSize: 26, fontWeight: 800, color: "#3b3b3b" }}>
          How to use InnerCode and Inny
        </h1>

        {/* What InnerCode does */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>What InnerCode does</h2>
          <p style={bodyStyle}>
            InnerCode helps you see how you're living relative to your values and key life areas, and supports you in making small, consistent changes. It connects a single reflective assessment, ongoing journaling, and one AI coach—Inny—so your progress and reflections stay in one place.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Ideas from frameworks like PERMA (flourishing), Self-Determination Theory (autonomy, connection, competence), and acceptance-based approaches suggest that when daily choices align more with what you find meaningful, wellbeing and satisfaction can be supported. InnerCode doesn't diagnose or treat; it uses these ideas to structure reflection. Focusing on specific life areas—such as relationships, health, or purpose—can make it easier to notice what's working, what's slipping, and where to adjust.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Rather than a generic chatbot or a one-off quiz, InnerCode ties your values, life areas, journal, and goals to one coach. Inny is designed to refer to your own words and priorities in conversation, so the guidance can feel more relevant to you.
          </p>
        </div>

        {/* Unlocking Inny and Goals */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Unlocking Inny's full potential (and Goals)</h2>
          <p style={bodyStyle}>
            To get the most from Inny, complete the full assessment (all 12 life areas), journal regularly with some detail, and try a few Daily Sparks. Once you've done that, the Goals feature unlocks too. You can then set value-aligned goals and track them, and Inny can refer to your goals and next steps in your conversations.
          </p>
        </div>

        {/* Why Inny is useful */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Why Inny is useful</h2>
          <p style={bodyStyle}>
            Inny is the same AI coach across the app. She receives a summary of your onboarding—how you described your life areas and what matters to you—plus a condensed view of your journal and, when you use them, your goals and progress. So when you ask for reflection or ideas, her replies can refer to your values, your lower-scoring areas, and your stated goals instead of generic advice.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            She doesn't have access to raw journal text outside the app's own summary; the app is built so your data stays private while still allowing Inny to use that summary. The aim is to make conversations feel continuous with the work you're already doing in the assessment and journal, rather than starting from scratch each time.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Many AI tools are either one-off (e.g. a single quiz) or disconnected from your ongoing reflections. Here, the same context—values, life areas, journal, goals—is reused in chat, in weekly check-ins, and in suggestions, so the coaching can build on what you've already written and chosen.
          </p>
        </div>

        {/* Prompts to try */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Prompts to try with Inny</h2>
          <p style={{ ...bodyStyle, marginBottom: 16 }}>
            You can ask Inny to help you reflect and grow in relation to your values and life areas. Here are some examples:
          </p>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Values</div>
            <div style={promptItemStyle}>"Help me reflect on how I've lived my value of connection this week."</div>
            <div style={promptItemStyle}>"What's one small way I could honour my top value today?"</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Life areas</div>
            <div style={promptItemStyle}>"My lowest life area score is low—what might be one gentle step to improve it?"</div>
            <div style={promptItemStyle}>"Which life area should I focus on this month and why?"</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Goals and next steps</div>
            <div style={promptItemStyle}>"Based on my goals, what's the one thing I should do next?"</div>
            <div style={promptItemStyle}>"I'm stuck on a goal—help me break it down or reframe it."</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Journal and reflection</div>
            <div style={promptItemStyle}>"What patterns do you see in my recent journal entries?"</div>
            <div style={promptItemStyle}>"Help me reflect on what my journal says about my priorities."</div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Weekly check-in</div>
            <div style={promptItemStyle}>"Summarise what's improved or slipped from my check-ins and what to focus on."</div>
          </div>
        </div>

        {onOpenAICoach && (
          <button
            type="button"
            onClick={onOpenAICoach}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg,#8B5CF6,#7C3AED)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
              marginBottom: 24,
            }}
          >
            🤖 Chat with Inny
          </button>
        )}
      </div>
    </div>
  );
}
