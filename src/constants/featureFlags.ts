// Feature Flags Configuration
// Toggle features on/off without code deletion

export const FEATURES = {
  // Phase 1-3: Engagement Features
  WEEKLY_CHECKIN: true,
  DAILY_SPARKS: true,
  PROGRESSIVE_DEEPENING: true,
  DAILY_INSIGHTS: true, // AI-powered pattern insights
  
  // Phase 4-6: Future Features
  INTELLIGENT_PROMPTS: false,
  MONTHLY_REVIEW: false,
  THEMED_CHALLENGES: false,
  
  // AI Provider Toggle
  USE_OPENAI: true, // OpenAI integration enabled!
};

// Helper to check if feature is enabled
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature] === true;
}

