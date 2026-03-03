// OpenAI Provider Implementation via Supabase Edge Functions
import { AIService, UserContext, CheckInChanges, InsightPattern } from "../aiService";
import { Suggestion } from "../../components/SuggestionCard";
import { getSupabaseClient } from "../../lib/supabase";
import { devLog } from "../devLog";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

interface InvokeResponse {
  reply?: string;
  error?: string;
}

const RECENT_JOURNAL_LIMIT = 5;

function getFallbackMessage(status?: number) {
  if (status === 401 || status === 403) {
    return "It looks like your session timed out. Please log in again so we can keep going together. 💚";
  }

  if (status && status >= 500) {
    return "I'm having trouble reaching our servers right now. Let's give it a moment and try again. 💚";
  }

  return "I'm having trouble connecting right now. Please try again in a moment and I'll be right here. 💚";
}

async function invokeInnyChat(payload: {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}): Promise<string> {
  const startedAt = (typeof performance !== "undefined" && typeof performance.now === "function")
    ? performance.now()
    : Date.now();

  const lastMessage = payload.messages[payload.messages.length - 1];

  devLog.log('invokeInnyChat: request started', {
    messageCount: payload.messages.length,
    lastRole: lastMessage?.role,
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    devLog.error('invokeInnyChat: missing Supabase URL or anon key');
    return getFallbackMessage();
  }

  const functionUrl = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/inny-chat`;
  const TIMEOUT_MS = 90000; // 90s for cold start + OpenAI
  const maxAttempts = 2;

  async function doFetch(attempt: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMs = ((typeof performance !== "undefined" && typeof performance.now === "function")
      ? performance.now()
      : Date.now()) - startedAt;

    let data: InvokeResponse;
    try {
      data = await response.json();
    } catch {
      devLog.error('invokeInnyChat: invalid JSON response', { status: response.status, durationMs });
      return getFallbackMessage(response.status);
    }

    if (!response.ok) {
      devLog.error('invokeInnyChat: Supabase function error', {
        status: response.status,
        message: (data as any)?.error ?? response.statusText,
        durationMs,
      });
      return getFallbackMessage(response.status);
    }

    if (data?.error) {
      devLog.error('invokeInnyChat: function returned error payload', { durationMs, message: data.error });
      return getFallbackMessage();
    }

    if (!data?.reply) {
      devLog.warn('invokeInnyChat: empty reply received', { durationMs, data });
      return getFallbackMessage();
    }

    devLog.log('invokeInnyChat: reply received', { durationMs, charCount: data.reply.length, attempt });
    return data.reply;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await doFetch(attempt);
    } catch (error: any) {
      const durationMs = ((typeof performance !== "undefined" && typeof performance.now === "function")
        ? performance.now()
        : Date.now()) - startedAt;
      const isAbort = error?.name === 'AbortError' || (error instanceof Error && error.message?.includes('timeout'));
      if (isAbort && attempt < maxAttempts) {
        devLog.warn('invokeInnyChat: Request timed out, retrying', { attempt, durationMs });
        continue;
      }
      if (isAbort) {
        devLog.error('invokeInnyChat: Request timed out after retries', { durationMs, error: error?.message });
        return getFallbackMessage(504);
      }
      devLog.error('invokeInnyChat: Unexpected error', { durationMs, error: error?.message || String(error) });
      return getFallbackMessage();
    }
  }

  return getFallbackMessage();
}

function formatRecentJournalEntries(
  entries?: Array<{ text: string; createdAt: number; mood?: string }>
): string {
  if (!entries || entries.length === 0) {
    return "";
  }

  return entries
    .slice(0, RECENT_JOURNAL_LIMIT)
    .map((entry) => {
      const date = new Date(entry.createdAt);
      const dateLabel = Number.isNaN(date.getTime())
        ? "Recent"
        : date.toLocaleDateString();
      const moodPart = entry.mood ? ` Mood: ${entry.mood}.` : "";
      const text = entry.text || "";
      const snippet = text.length > 200 ? `${text.slice(0, 197)}…` : text;
      return `${dateLabel}.${moodPart} ${snippet}`.trim();
    })
    .join(" | ");
}

export class OpenAIService implements AIService {
  private buildSystemPrompt(context: UserContext): string {
    // Defensive checks to prevent errors if context data is missing
    const topValues = (Array.isArray(context.valueEntries) && context.valueEntries.length > 0)
      ? context.valueEntries.slice(0, 3).map(v => v[0]).join(", ")
      : "Not yet identified";
    
    const completedAreas = Array.isArray(context.completedCategories) && context.completedCategories.length > 0
      ? context.completedCategories.join(", ")
      : "None yet";
    
    const onboardingHighlights = Array.isArray(context.onboardingAnswers) && context.onboardingAnswers.length > 0
      ? context.onboardingAnswers.slice(-3).join(" | ")
      : "";
    
    const journalSummary = context.journalSummary || "";
    const recentMood = context.recentJournalEntries?.find(entry => entry.mood)?.mood;
    const journalHighlights = formatRecentJournalEntries(context.recentJournalEntries);
    
    // Compact scores for speed (keep data for tailoring)
    let categoryScoresStr = "—";
    try {
      const scores = context.categoryScores || {};
      const entries = Object.entries(scores);
      categoryScoresStr = entries.length > 0
        ? entries.map(([k, v]) => `${k}: ${v}`).join(", ")
        : "—";
    } catch (e) {
      devLog.error('Failed to stringify categoryScores', e);
    }

    const lines: string[] = [
      "You are Inny, a compassionate coach in the InnerCode app. Use the user's data below to tailor answers. Scan their journal entries to match what they ask and give relevant, personal replies. Be warm and concise (2–3 sentences). 💚 Don't say you're an AI.",
      "",
      "User: " + (context.userName || "Friend"),
      "Life areas: " + completedAreas,
      "Scores: " + categoryScoresStr,
      "Top values: " + topValues,
    ];
    if (context.lowestCategory) lines.push("Needs attention: " + context.lowestCategory);
    if (context.topValue) lines.push("Strongest value: " + context.topValue);
    if (onboardingHighlights) lines.push("Onboarding: " + onboardingHighlights);
    if (journalSummary) lines.push("Journal summary: " + journalSummary);
    if (recentMood) lines.push("Latest mood: " + recentMood);
    if (journalHighlights) lines.push("Recent journals (use these to match and tailor): " + journalHighlights);
    return lines.join("\n");
  }

  async chat(userInput: string, context: UserContext): Promise<string> {
    const messages: ChatMessage[] = [
      { role: "system", content: this.buildSystemPrompt(context) },
    ];

    if (context.conversationHistory) {
      context.conversationHistory.slice(-6).forEach(msg => {
        messages.push({
          role: msg.sender === "you" ? "user" : "assistant",
          content: msg.text,
        });
      });
    }

    messages.push({ role: "user", content: userInput });

    return invokeInnyChat({
      messages,
      temperature: 0.8,
      maxTokens: 300,
      model: "gpt-4o-mini",
    });
  }

  async chatAboutSuggestion(userInput: string, suggestion: Suggestion, context: UserContext): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(context);
    const suggestionContext = `

Current Suggestion Context:
- Title: ${suggestion.title}
- Description: ${suggestion.description}
- Category: ${suggestion.category}
- Type: ${suggestion.type}

The user is asking about this specific suggestion. Help them understand how it relates to their values and life areas.`;

    return invokeInnyChat({
      messages: [
        { role: "system", content: systemPrompt + suggestionContext },
        { role: "user", content: userInput },
      ],
      temperature: 0.8,
      maxTokens: 300,
      model: "gpt-4o-mini",
    });
  }

  async generateCheckInSummary(changes: CheckInChanges, context: UserContext): Promise<string> {
    const summaryPrompt = `Generate a warm, encouraging summary of the user's check-in changes.

Changes:
- Improvements: ${changes.improvements.map(i => `${i.category} (${i.oldScore}→${i.newScore})`).join(", ")}
- Stable Areas: ${changes.stable.map(s => `${s.category} (${s.score})`).join(", ")}
- Declines: ${changes.declines.map(d => `${d.category} (${d.oldScore}→${d.newScore})`).join(", ")}

Celebrate improvements, acknowledge stability, and gently address declines. Keep it to 2-3 sentences. Be encouraging! 🌟`;

    return invokeInnyChat({
      messages: [
        { role: "system", content: this.buildSystemPrompt(context) },
        { role: "user", content: summaryPrompt },
      ],
      temperature: 0.9,
      maxTokens: 200,
      model: "gpt-4o-mini",
    });
  }

  async generateInsight(pattern: InsightPattern, context: UserContext): Promise<string> {
    let patternDescription = "";
    
    switch (pattern.type) {
      case "scoreDrop":
        patternDescription = `The user's ${pattern.category} score dropped from ${pattern.oldScore} to ${pattern.newScore}. Offer gentle insight.`;
        break;
      case "neglectedCategory":
        patternDescription = `The user hasn't checked in on ${pattern.category} lately. Encourage them kindly.`;
        break;
      case "repeatedWords":
        patternDescription = `The user often mentions "${pattern.word}" in their journal. What might this reveal?`;
        break;
      case "valueDisconnect":
        patternDescription = `The user values ${pattern.value}, but their ${pattern.category} score is low. Help them see the connection.`;
        break;
    }

    return invokeInnyChat({
      messages: [
        { role: "system", content: this.buildSystemPrompt(context) },
        {
          role: "user",
          content: `${patternDescription} Generate a compassionate, actionable insight in 1-2 sentences.`,
        },
      ],
      temperature: 0.85,
      maxTokens: 150,
      model: "gpt-4o-mini",
    });
  }
}

