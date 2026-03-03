import { Suggestion } from "../components/SuggestionCard";

export const CATEGORY_SUGGESTIONS: Record<string, Omit<Suggestion, 'id'>[]> = {
  Relationships: [
    {
      title: "Deep Connection Practice",
      description: "Based on your low relationship score, focus on building meaningful connections.",
      action: "Schedule a 30-min coffee or walk with someone who leaves you feeling more yourself.",
      category: "Relationships",
      value: "connection",
      priority: "high",
      type: "weakness",
      estimatedTime: "30 min",
      difficulty: "easy"
    },
    {
      title: "Social Expansion",
      description: "Expand your social circle in a low-pressure way.",
      action: "Join a small, interest-based meetup and talk to two people.",
      category: "Relationships",
      value: "connection",
      priority: "medium",
      type: "weakness",
      estimatedTime: "1-2 hours",
      difficulty: "medium"
    },
  ],
  Family: [
    {
      title: "Family Ritual Creation",
      description: "Strengthen family bonds through consistent, meaningful rituals.",
      action: "Start a tiny weekly ritual (Sunday pancakes, 10-min gratitude at dinner).",
      category: "Family",
      value: "connection",
      priority: "high",
      type: "weakness",
      estimatedTime: "10-30 min",
      difficulty: "easy"
    },
    {
      title: "Appreciation Expression",
      description: "Express gratitude to strengthen family connections.",
      action: "Record a 2-min voice note to a family member sharing one appreciation.",
      category: "Family",
      value: "connection",
      priority: "medium",
      type: "weakness",
      estimatedTime: "2 min",
      difficulty: "easy"
    },
  ],
  "Career & Purpose": [
    {
      title: "Purpose Clarity Sprint",
      description: "Your career satisfaction is low - let's clarify what you really want.",
      action: "Run a 45-min 'dream role' sprint: one-page description + one first step.",
      category: "Career & Purpose",
      value: "achievement",
      priority: "high",
      type: "weakness",
      estimatedTime: "45 min",
      difficulty: "medium"
    },
    {
      title: "Career Exploration",
      description: "Learn from others to understand different career paths.",
      action: "Shadow someone for 30–60 min (or watch a day-in-the-life) and note fits/misfits.",
      category: "Career & Purpose",
      value: "discovery",
      priority: "medium",
      type: "weakness",
      estimatedTime: "30-60 min",
      difficulty: "easy"
    },
  ],
  "Health & Fitness": [
    {
      title: "Joyful Movement",
      description: "Your health score suggests you need more enjoyable physical activity.",
      action: "Add one playful session this week (bag work, circuits, sport) purely for joy.",
      category: "Health & Fitness",
      value: "vitality",
      priority: "high",
      type: "weakness",
      estimatedTime: "30-45 min",
      difficulty: "easy"
    },
    {
      title: "Recovery Routine",
      description: "Build a sustainable recovery practice for better health.",
      action: "10-min mobility flow after bedtime routine on 3 nights.",
      category: "Health & Fitness",
      value: "balance",
      priority: "medium",
      type: "weakness",
      estimatedTime: "10 min",
      difficulty: "easy"
    },
  ],
  Nutrition: [
    {
      title: "Energy Awareness",
      description: "Connect your eating habits to how you feel.",
      action: "Try a 'feel-good' meal twice this week; note energy 2 hours later.",
      category: "Nutrition",
      value: "vitality",
      priority: "medium",
      type: "weakness",
      estimatedTime: "15 min prep",
      difficulty: "easy"
    },
    {
      title: "Smart Snacking",
      description: "Optimize your snacks for sustained energy.",
      action: "Swap one snack for protein + fibre; jot how you feel.",
      category: "Nutrition",
      value: "vitality",
      priority: "low",
      type: "weakness",
      estimatedTime: "5 min",
      difficulty: "easy"
    },
  ],
  "Sleep & Recovery": [
    {
      title: "Wind-Down Ritual",
      description: "Your sleep score indicates you need better evening routines.",
      action: "Create a 10-min wind-down stack: dim lights, stretch, 4-7-8 breathing.",
      category: "Sleep & Recovery",
      value: "balance",
      priority: "high",
      type: "weakness",
      estimatedTime: "10 min",
      difficulty: "easy"
    },
    {
      title: "Digital Detox",
      description: "Reduce screen time before bed for better sleep quality.",
      action: "No phone in bed for 3 nights; charge it outside the room.",
      category: "Sleep & Recovery",
      value: "balance",
      priority: "medium",
      type: "weakness",
      estimatedTime: "0 min",
      difficulty: "medium"
    },
  ],
  "Hobbies & Play": [
    {
      title: "Play Block",
      description: "Your hobbies score suggests you need more unstructured fun.",
      action: "Book a 60-min 'play block' (no productivity allowed). Try one mini-hobby.",
      category: "Hobbies & Play",
      value: "discovery",
      priority: "medium",
      type: "weakness",
      estimatedTime: "60 min",
      difficulty: "easy"
    },
    {
      title: "Childhood Joy Revival",
      description: "Reconnect with activities that brought you joy as a child.",
      action: "Revisit one childhood activity for 20 minutes.",
      category: "Hobbies & Play",
      value: "discovery",
      priority: "low",
      type: "weakness",
      estimatedTime: "20 min",
      difficulty: "easy"
    },
  ],
  "Learning & Growth": [
    {
      title: "Deep Dive Learning",
      description: "Your learning score suggests you crave more intellectual stimulation.",
      action: "Pick one topic and do a 25-min deep dive; write one 'aha'.",
      category: "Learning & Growth",
      value: "growth",
      priority: "medium",
      type: "weakness",
      estimatedTime: "25 min",
      difficulty: "easy"
    },
    {
      title: "Teaching Practice",
      description: "Solidify learning by explaining concepts to others.",
      action: "Teach a 3-min explainer to your future self (voice memo).",
      category: "Learning & Growth",
      value: "growth",
      priority: "low",
      type: "weakness",
      estimatedTime: "3 min",
      difficulty: "medium"
    },
  ],
  "Travel & Experiences": [
    {
      title: "Micro-Adventure",
      description: "Your experience score suggests you need more novelty and exploration.",
      action: "Plan a 2-hour micro-adventure locally (park, museum, historic site).",
      category: "Travel & Experiences",
      value: "discovery",
      priority: "medium",
      type: "weakness",
      estimatedTime: "2 hours",
      difficulty: "easy"
    },
    {
      title: "First-Time Experience",
      description: "Try something completely new to expand your comfort zone.",
      action: "Try a 'first' this week (café, route, class) and rate it out of 10.",
      category: "Travel & Experiences",
      value: "discovery",
      priority: "low",
      type: "weakness",
      estimatedTime: "30-60 min",
      difficulty: "medium"
    },
  ],
  "Spirituality & Meaning": [
    {
      title: "Silent Reflection",
      description: "Your meaning score suggests you need more time for reflection and purpose.",
      action: "Spend 10 minutes in silence outdoors; write one line on what matters.",
      category: "Spirituality & Meaning",
      value: "meaning",
      priority: "high",
      type: "weakness",
      estimatedTime: "10 min",
      difficulty: "easy"
    },
    {
      title: "Spiritual Practice Exploration",
      description: "Explore different ways to connect with something greater.",
      action: "Explore one practice (prayer, meditation, nature journaling) for 5–10 min.",
      category: "Spirituality & Meaning",
      value: "meaning",
      priority: "medium",
      type: "weakness",
      estimatedTime: "5-10 min",
      difficulty: "easy"
    },
  ],
  "Finance & Money Mindset": [
    {
      title: "Expense Awareness",
      description: "Your finance score suggests you need better money awareness.",
      action: "Do a 20-min money check-in: list fixed costs + one leak to patch.",
      category: "Finance & Money Mindset",
      value: "stability",
      priority: "medium",
      type: "weakness",
      estimatedTime: "20 min",
      difficulty: "easy"
    },
    {
      title: "Goal-Setting Practice",
      description: "Build financial confidence through small, achievable goals.",
      action: "Name one 3-month savings goal; set a £ auto-transfer tomorrow.",
      category: "Finance & Money Mindset",
      value: "achievement",
      priority: "low",
      type: "weakness",
      estimatedTime: "15 min",
      difficulty: "easy"
    },
  ],
  "Community & Contribution": [
    {
      title: "Community Action",
      description: "Your contribution score suggests you want to make more impact.",
      action: "Offer a 15-min help to one person this week (no strings).",
      category: "Community & Contribution",
      value: "contribution",
      priority: "medium",
      type: "weakness",
      estimatedTime: "15 min",
      difficulty: "easy"
    },
    {
      title: "Support Network Building",
      description: "Strengthen your community by offering support to others.",
      action: "Browse one local cause; bookmark a 1-hour starter action.",
      category: "Community & Contribution",
      value: "contribution",
      priority: "low",
      type: "weakness",
      estimatedTime: "30 min",
      difficulty: "easy"
    },
  ],
};

// Discovery suggestions for unexplored or low-ranking values
export const VALUE_DISCOVERY_SUGGESTIONS: Record<string, Omit<Suggestion, 'id'>[]> = {
  honesty: [
    {
      title: "Authenticity Practice",
      description: "Explore honesty as a value by practicing vulnerable communication.",
      action: "Share one genuine feeling or thought with someone this week, even if it feels uncomfortable.",
      category: "Relationships",
      value: "honesty",
      priority: "medium",
      type: "strength",
      estimatedTime: "15 min",
      difficulty: "medium"
    },
  ],
  connection: [
    {
      title: "Connection Exploration",
      description: "Discover the value of deep connection through meaningful interaction.",
      action: "Attend a new group activity or class and introduce yourself to three people.",
      category: "Community & Contribution",
      value: "connection",
      priority: "medium",
      type: "strength",
      estimatedTime: "1-2 hours",
      difficulty: "medium"
    },
  ],
  growth: [
    {
      title: "Learning Adventure",
      description: "Experience the value of growth by stepping into the learner's mindset.",
      action: "Pick a skill you've always been curious about and spend 30 minutes exploring it (no pressure to master it).",
      category: "Learning & Growth",
      value: "growth",
      priority: "medium",
      type: "strength",
      estimatedTime: "30 min",
      difficulty: "easy"
    },
  ],
  stability: [
    {
      title: "Security Building",
      description: "Explore stability as a value by creating predictable routines.",
      action: "Establish one consistent morning or evening ritual and follow it for 5 days.",
      category: "Sleep & Recovery",
      value: "stability",
      priority: "medium",
      type: "strength",
      estimatedTime: "10-15 min/day",
      difficulty: "easy"
    },
  ],
  discovery: [
    {
      title: "Curiosity Awakening",
      description: "Ignite the value of discovery by embracing novelty and exploration.",
      action: "Visit a place you've never been (even if it's just a new neighborhood) and note 3 things that surprise you.",
      category: "Travel & Experiences",
      value: "discovery",
      priority: "medium",
      type: "strength",
      estimatedTime: "1-2 hours",
      difficulty: "easy"
    },
  ],
  vitality: [
    {
      title: "Energy Exploration",
      description: "Discover vitality as a value by experiencing physical aliveness.",
      action: "Try a new movement activity that sounds fun (dance, hiking, martial arts) for 20 minutes.",
      category: "Health & Fitness",
      value: "vitality",
      priority: "medium",
      type: "strength",
      estimatedTime: "20 min",
      difficulty: "easy"
    },
  ],
  freedom: [
    {
      title: "Autonomy Experiment",
      description: "Experience freedom as a value by making choices purely for yourself.",
      action: "Block out 2 hours to do exactly what YOU want with zero obligations or others' expectations.",
      category: "Hobbies & Play",
      value: "freedom",
      priority: "medium",
      type: "strength",
      estimatedTime: "2 hours",
      difficulty: "easy"
    },
  ],
  contribution: [
    {
      title: "Impact Discovery",
      description: "Explore contribution as a value by helping others in a small way.",
      action: "Offer genuine help to one person this week without expecting anything in return.",
      category: "Community & Contribution",
      value: "contribution",
      priority: "medium",
      type: "strength",
      estimatedTime: "30 min - 1 hour",
      difficulty: "easy"
    },
  ],
  meaning: [
    {
      title: "Purpose Exploration",
      description: "Discover meaning as a value through reflection and presence.",
      action: "Spend 15 minutes in nature or silence, then write one sentence about what truly matters to you.",
      category: "Spirituality & Meaning",
      value: "meaning",
      priority: "medium",
      type: "strength",
      estimatedTime: "15 min",
      difficulty: "easy"
    },
  ],
  achievement: [
    {
      title: "Success Experiment",
      description: "Explore achievement as a value by setting and completing a small goal.",
      action: "Set one specific, achievable goal for this week and celebrate when you complete it.",
      category: "Career & Purpose",
      value: "achievement",
      priority: "medium",
      type: "strength",
      estimatedTime: "Varies",
      difficulty: "easy"
    },
  ],
  balance: [
    {
      title: "Harmony Discovery",
      description: "Experience balance as a value by creating space for rest and renewal.",
      action: "Schedule one 30-minute 'do nothing' break this week—no phone, no tasks, just being.",
      category: "Sleep & Recovery",
      value: "balance",
      priority: "medium",
      type: "strength",
      estimatedTime: "30 min",
      difficulty: "easy"
    },
  ],
};

// Value-aligned suggestions for when users have strong values
export const VALUE_ALIGNED_SUGGESTIONS: Record<string, Omit<Suggestion, 'id'>[]> = {
  connection: [
    {
      title: "Authentic Connection Practice",
      description: "You value connection - deepen your relationships with intentional conversations.",
      action: "Have one honest, low-stakes conversation with someone you trust this week.",
      category: "Relationships",
      value: "connection",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "30 min",
      difficulty: "easy"
    },
    {
      title: "Community Exploration",
      description: "Your connection value suggests you thrive in community settings.",
      action: "Join a small, interest-aligned group to test connection fit.",
      category: "Community & Contribution",
      value: "connection",
      priority: "low",
      type: "value-aligned",
      estimatedTime: "1-2 hours",
      difficulty: "medium"
    },
  ],
  vitality: [
    {
      title: "Playful Movement",
      description: "Your vitality value suggests you love physical energy and movement.",
      action: "Add one playful movement session (bag work / circuits) this week.",
      category: "Health & Fitness",
      value: "vitality",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "30-45 min",
      difficulty: "easy"
    },
  ],
  discovery: [
    {
      title: "Micro-Adventure",
      description: "Your discovery value drives you to explore new experiences.",
      action: "Plan a 2-hour micro-adventure nearby.",
      category: "Travel & Experiences",
      value: "discovery",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "2 hours",
      difficulty: "easy"
    },
  ],
  growth: [
    {
      title: "Deep Learning Session",
      description: "Your growth value suggests you love expanding your knowledge.",
      action: "Pick one topic and do a single 25-min deep dive — jot one insight.",
      category: "Learning & Growth",
      value: "growth",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "25 min",
      difficulty: "easy"
    },
  ],
  balance: [
    {
      title: "Sleep Wind-Down",
      description: "Your balance value suggests you need restorative practices.",
      action: "Try a 10-minute wind-down ritual for sleep on 3 nights.",
      category: "Sleep & Recovery",
      value: "balance",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "10 min",
      difficulty: "easy"
    },
  ],
  contribution: [
    {
      title: "Community Impact",
      description: "Your contribution value drives you to help others.",
      action: "Choose one 1-hour community action this month.",
      category: "Community & Contribution",
      value: "contribution",
      priority: "medium",
      type: "value-aligned",
      estimatedTime: "1 hour",
      difficulty: "medium"
    },
  ],
};