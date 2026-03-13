// Static AI Provider
// Current pattern-matching implementation (moved from AICoach.tsx)

import { AIService, UserContext, CheckInChanges, InsightPattern, WeeklyReflectionResult } from "../aiService";
import type { WeeklyReflectionPayload } from "../contextBuilders";
import { Suggestion } from "../../components/SuggestionCard";
import { VALUE_ICONS } from "../../constants/values";
import { CATEGORY_ICONS } from "../../constants/categories";

export class StaticAIService implements AIService {
  async chat(userInput: string, context: UserContext): Promise<string> {
    const lowerInput = userInput.toLowerCase();

    // Questions about scores/results
    if (lowerInput.includes("why") && (lowerInput.includes("low") || lowerInput.includes("score"))) {
      const lowestCat = context.lowestCategory || "life areas";
      return `Great question! Your ${lowestCat} score might be lower because:\n\n1. Life happens - we all have areas we're currently neglecting\n2. This area hasn't been a priority lately\n3. There might be specific challenges affecting it\n\nThe good news? You've identified it, which is the first step! Want to see specific actions to improve your ${lowestCat}? Just ask "Show me ${lowestCat} suggestions" 💪`;
    }

    // Questions about focus
    if (lowerInput.includes("focus") || lowerInput.includes("should i") || (lowerInput.includes("what") && lowerInput.includes("start"))) {
      const lowestCat = context.lowestCategory || "life areas";
      return `Based on your results, I'd recommend focusing on **${lowestCat}** first.\n\nWhy? Because small improvements in your weakest areas often create the biggest positive ripple effects in your life.\n\nWould you like me to show you personalized suggestions for ${lowestCat}? Or would you prefer to explore your strengths instead?`;
    }

    // Questions about values
    if (lowerInput.includes("value") || lowerInput.includes("tell me about")) {
      const topValue = context.topValue || "values";
      return `Your top value is **${topValue}**! ${VALUE_ICONS[topValue] || "✨"}\n\nThis means you naturally gravitate toward ${this.getValueDescription(topValue)}. When you live in alignment with this value, you feel most authentic and energized.\n\nWant to see actions that strengthen this value? Or curious about your other values?`;
    }

    // Questions about improvement
    if (lowerInput.includes("improve") || lowerInput.includes("better") || lowerInput.includes("help")) {
      return `I can help you improve in several ways:\n\n1. **Weak Areas**: Focus on your lowest-scoring life areas\n2. **Value Alignment**: Do more of what matches your core values\n3. **Discovery**: Try new things to uncover hidden values\n\nWhich approach interests you most? Or type "show suggestions" to see all your personalized actions! 🎯`;
    }

    // Ask for suggestions
    if (lowerInput.includes("suggestion") || lowerInput.includes("action") || lowerInput.includes("show me")) {
      const total = (context.allSuggestions?.length || 0);
      const weak = (context.weakAreaSuggestions?.length || 0);
      const value = (context.valueStrengthSuggestions?.length || 0);
      const discovery = (context.discoveryAreaSuggestions?.length || 0);
      
      return `Perfect! I have ${total} personalized actions ready for you, organized into:\n\n🛠️ Growth Areas (${weak})\n💎 Value Strengths (${value})\n🌟 Discovery (${discovery})\n\nWould you like to see them? (Go back and tap "Get Suggestions")`;
    }

    // General encouragement
    if (lowerInput.includes("thank") || lowerInput.includes("appreciate")) {
      return `You're very welcome! ${context.userName ? `${context.userName}, ` : ''}I'm here whenever you need guidance. Remember, growth isn't linear - celebrate every small step forward! 🌱\n\nWhat else can I help with?`;
    }

    // Default response
    return `I hear you. ${context.userName ? `${context.userName}, ` : ''}that's a thoughtful question.\n\nI can help you with:\n• Understanding your scores and values\n• Finding areas to focus on\n• Getting personalized action suggestions\n• Breaking down goals into manageable steps\n\nCould you tell me more about what you'd like to explore?`;
  }

  async chatAboutSuggestion(userInput: string, suggestion: Suggestion, context: UserContext): Promise<string> {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes("why") || lowerInput.includes("how")) {
      return `Great question! ${suggestion.description}\n\nThe key is to ${suggestion.action.toLowerCase()}. This typically takes about ${suggestion.estimatedTime} and is ${suggestion.difficulty} to get started.\n\nWould you like me to help you break this down into smaller steps?`;
    } else if (lowerInput.includes("step") || lowerInput.includes("break") || lowerInput.includes("smaller")) {
      return `Absolutely! Let's break "${suggestion.action}" into bite-sized steps:\n\n1️⃣ Set aside ${suggestion.estimatedTime} in your calendar\n2️⃣ Prepare what you need (minimal - just start!)\n3️⃣ Begin with the easiest part\n4️⃣ Reflect on how it felt afterward\n\nWhich step feels most doable for you today?`;
    } else if (lowerInput.includes("simpler") || lowerInput.includes("easier") || lowerInput.includes("less time")) {
      return `I hear you - let's make this more manageable!\n\nSimplified version:\n"${suggestion.action.split('.')[0].replace(/\d+\s*(min|minutes|hour|hours)/, '5 min')} for just 5 minutes"\n\nEven 5 minutes is meaningful progress. Would you like to journal about how you'll fit this in?`;
    } else if (lowerInput.includes("when") || lowerInput.includes("schedule") || lowerInput.includes("time")) {
      return `Good thinking - scheduling makes it real! ${suggestion.estimatedTime} fits nicely into:\n\n🌅 Morning: Before your day gets busy\n☀️ Midday: During lunch break\n🌙 Evening: Wind-down ritual\n\nWhen do you typically have the most energy? That's your best time to try this.`;
    } else if (lowerInput.includes("journal")) {
      return `Perfect! Journaling about this will help you commit and reflect. I'll prepare some prompts for you.\n\nReady to journal about "${suggestion.action}"? Tap the "Journal about this" button below! 📓`;
    } else if (lowerInput.includes("yes") || lowerInput.includes("okay") || lowerInput.includes("sure")) {
      return `Amazing! I love your commitment. 🌟\n\nNext steps:\n1. Tap "Journal about this" to set your intention\n2. Schedule it in your calendar\n3. Come back and tell me how it went!\n\nYou've got this! 💪`;
    } else if (lowerInput.includes("no") || lowerInput.includes("not sure") || lowerInput.includes("different")) {
      return `That's totally okay - not every action resonates with everyone.\n\nWhat specifically doesn't feel right? I can:\n• Show you a different suggestion\n• Adjust this one to be simpler\n• Explain more about why this matters\n\nWhat would help most?`;
    } else {
      return `I appreciate you sharing that. ${VALUE_ICONS[suggestion.value || ""] || "✨"}\n\nThis action could be valuable for you. The key is to ${suggestion.action.toLowerCase()}.\n\nWould you like to:\n• Journal about your plan for this\n• Adjust it to fit your schedule\n• See other suggestions instead`;
    }
  }

  async generateCheckInSummary(changes: CheckInChanges, context: UserContext): Promise<string> {
    if (changes.improvements.length > 0) {
      const topImprovement = changes.improvements[0];
      return `Great progress on ${topImprovement.category}! Your score improved from ${topImprovement.oldScore} to ${topImprovement.newScore}. That's growth! 🌱`;
    }
    
    if (changes.declines.length > 0) {
      const decline = changes.declines[0];
      return `I noticed your ${decline.category} score dropped from ${decline.oldScore} to ${decline.newScore}. Want to talk about what changed? We can work through this together. 💙`;
    }
    
    return `Thanks for checking in! Your areas are looking stable. Keep up the great work! 💪`;
  }

  async generateWeeklyReflection(payload: WeeklyReflectionPayload, context: UserContext): Promise<WeeklyReflectionResult> {
    const openNoSteps = payload.goalsForReview.filter((g) => !g.isCompleted && !g.hasSteps);
    return {
      reflectionText: `This week you logged journals, ${payload.sparksCompletedThisWeek.length} spark(s), and have ${payload.goalsForReview.length} goal(s) in progress. Keep taking small steps that align with your values. 💚`,
      moodPositiveFactors: ["Journaling and reflection", "Completing sparks", "Progress on goals"].slice(0, 3),
      moodNegativeFactors: payload.negativeThemes?.length ? payload.negativeThemes.slice(0, 3) : [],
      goalSuggestions: openNoSteps.map((g) => ({ goalId: g.goalId, suggestedSteps: ["Break the goal into one small step", "Schedule 15 minutes this week", "Reflect on one barrier"] })),
    };
  }

  async generateInsight(pattern: InsightPattern, context: UserContext): Promise<string> {
    if (pattern.type === "scoreDrop" && pattern.category && pattern.oldScore !== undefined && pattern.newScore !== undefined) {
      return `Your ${pattern.category} score dropped from ${pattern.oldScore} to ${pattern.newScore}. Everything okay there? Want to chat about what changed?`;
    }
    
    if (pattern.type === "neglectedCategory" && pattern.category) {
      return `You haven't reflected on ${pattern.category} in 2 weeks. Everything okay there?`;
    }
    
    if (pattern.type === "repeatedWords" && pattern.word) {
      return `You've mentioned "${pattern.word}" 3 times this week. Let's explore that deeper.`;
    }
    
    if (pattern.type === "valueDisconnect" && pattern.value && pattern.category) {
      return `Your top value is ${pattern.value} but ${pattern.category} is low. Want to explore the disconnect?`;
    }
    
    return `I noticed something in your patterns. Want to explore it together?`;
  }

  private getValueDescription(value: string): string {
    const descriptions: Record<string, string> = {
      connection: "meaningful relationships and deep bonds with others",
      growth: "learning, developing, and becoming your best self",
      discovery: "exploring new experiences and expanding your horizons",
      creativity: "expressing yourself and bringing new ideas to life",
      balance: "harmony between different areas of your life",
      achievement: "accomplishing goals and making progress",
      freedom: "autonomy and the ability to choose your path",
      health: "physical and mental wellbeing",
      purpose: "meaningful contribution and living with intention",
    };
    return descriptions[value] || "living authentically";
  }
}

