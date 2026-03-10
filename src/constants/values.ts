export const VALUE_SIGNALS: Record<string, string[]> = {
  honesty: ["honest", "honesty", "truth", "authentic", "real", "genuine", "transparent", "open", "candid"],
  connection: [
    "connect",
    "connection",
    "belong",
    "friends",
    "community",
    "family",
    "relationships",
    "people",
    "social",
    "together",
    "support",
    "love",
    "trust",
    "bond",
    "close",
    "intimate",
  ],
  growth: ["learn", "learning", "growth", "improve", "progress", "develop", "advance", "better", "skill", "knowledge", "education", "study"],
  stability: ["secure", "security", "stability", "safe", "safety", "stable", "consistent", "reliable", "predictable", "steady"],
  discovery: ["new", "explore", "adventure", "travel", "try", "curious", "discover", "experience", "journey", "different", "unknown", "challenge"],
  vitality: [
    "kickboxing",
    "running",
    "weights",
    "yoga",
    "strong",
    "alive",
    "gym",
    "exercise",
    "fitness",
    "health",
    "energy",
    "active",
    "movement",
    "sport",
    "physical",
  ],
  freedom: ["freedom", "autonomy", "independent", "free", "choice", "control", "self", "own", "personal"],
  contribution: ["help", "serve", "community", "give back", "contribute", "volunteer", "support", "assist", "make difference", "impact"],
  meaning: ["meaning", "purpose", "spiritual", "nature", "peace", "fulfillment", "significance", "values", "belief", "important"],
  achievement: ["achievement", "recognition", "career", "promotion", "success", "accomplish", "goal", "ambition", "excel", "win"],
  balance: ["balance", "rest", "sleep", "recovery", "relax", "peaceful", "calm", "harmony", "equilibrium", "wellbeing"],
};

export const VALUE_ICONS: Record<string, string> = {
  honesty: "🧭",
  connection: "🤝",
  growth: "🌱",
  stability: "🛡️",
  discovery: "🔭",
  vitality: "⚡️",
  freedom: "🕊️",
  contribution: "🎁",
  meaning: "✨",
  achievement: "🏆",
  balance: "🌙",
};

/** Short description and example for each value (used in Results page info modal). */
export const VALUE_DESCRIPTIONS: Record<string, { description: string; example: string }> = {
  honesty: {
    description: "Being truthful and authentic with yourself and others.",
    example: "Use it when you're reflecting on being genuine in a relationship, at work, or in how you talk to yourself.",
  },
  connection: {
    description: "Meaningful relationships, belonging, and feeling close to others.",
    example: "Use it when you write about family, friends, feeling supported, or wanting more community.",
  },
  growth: {
    description: "Learning, improving, and developing new skills or understanding.",
    example: "Use it when you're journaling about learning something new, getting better at a skill, or personal progress.",
  },
  stability: {
    description: "Feeling secure, safe, and able to rely on things staying consistent.",
    example: "Use it when you reflect on finances, home, job security, or needing more predictability.",
  },
  discovery: {
    description: "Exploring new experiences, curiosity, and stepping into the unknown.",
    example: "Use it when you write about trying something new, travel, adventure, or pushing past your comfort zone.",
  },
  vitality: {
    description: "Physical energy, health, fitness, and feeling alive in your body.",
    example: "Use it when you journal about exercise, sleep, nutrition, or wanting more energy.",
  },
  freedom: {
    description: "Autonomy, having choices, and living on your own terms.",
    example: "Use it when reflecting on independence, work-life control, or feeling free to make your own decisions.",
  },
  contribution: {
    description: "Helping others, giving back, and making a positive impact.",
    example: "Use it when you write about volunteering, supporting someone, or wanting to make a difference.",
  },
  meaning: {
    description: "Purpose, significance, and what makes life feel worthwhile.",
    example: "Use it when you're reflecting on why things matter, spirituality, or finding fulfillment.",
  },
  achievement: {
    description: "Recognition, success, and reaching goals that matter to you.",
    example: "Use it when journaling about career, accomplishments, ambition, or what you want to excel at.",
  },
  balance: {
    description: "Rest, recovery, and harmony between different parts of life.",
    example: "Use it when you reflect on burnout, rest, calm, or balancing work and wellbeing.",
  },
};

// Value-to-Category mapping for insight detection
// Maps values to their related life area categories
export const VALUE_CATEGORY_MAP: Record<string, string[]> = {
  honesty: ["Relationships", "Personal Growth", "Self-Reflection"],
  connection: ["Relationships", "Family", "Social Life", "Community"],
  growth: ["Career", "Learning", "Personal Growth", "Skills Development"],
  stability: ["Finances", "Career", "Home", "Security"],
  discovery: ["Learning", "Travel", "Hobbies", "New Experiences"],
  vitality: ["Health", "Fitness", "Nutrition", "Physical Activity"],
  freedom: ["Lifestyle", "Independence", "Work-Life Balance", "Travel"],
  contribution: ["Community", "Volunteering", "Purpose", "Service"],
  meaning: ["Spirituality", "Purpose", "Self-Reflection", "Values"],
  achievement: ["Career", "Goals", "Accomplishments", "Success"],
  balance: ["Work-Life Balance", "Mental Health", "Rest", "Wellness"],
};

