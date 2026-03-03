import { Prompt } from "../types";

export const PROMPTS: Prompt[] = [
  {
    id: "rel-1",
    category: "Relationships",
    q: "Who in your life makes you feel most like yourself?",
    essential: true,
    phase: 1,
  },
  {
    id: "rel-2",
    category: "Relationships",
    q: "What type of people drain your energy the fastest?",
    chips: [
      "Negative",
      "Controlling",
      "Competitive",
      "Indifferent",
      "Dishonest",
    ],
    phase: 1,
  },
  {
    id: "rel-x",
    category: "Relationships",
    q: "Do you feel you haven't found people you truly connect with yet?",
    chips: ["Yes", "No", "Unsure"],
    xp: true,
    phase: 1,
  },
  
  // Phase 2: Relationships
  {
    id: "rel-p2-1",
    category: "Relationships",
    q: "How comfortable are you being vulnerable with those closest to you?",
    essential: true,
    phase: 2,
  },
  {
    id: "rel-p2-2",
    category: "Relationships",
    q: "Describe your boundaries in close relationships. Are they clear? Respected?",
    essential: true,
    phase: 2,
  },
  {
    id: "rel-p2-3",
    category: "Relationships",
    q: "What does emotional intimacy mean to you? Can you describe a time you experienced it?",
    essential: true,
    phase: 2,
  },
  {
    id: "rel-p2-4",
    category: "Relationships",
    q: "Do you tend to prioritize others' needs over your own in relationships? Why?",
    essential: true,
    phase: 2,
  },
  
  // Phase 3: Relationships
  {
    id: "rel-p3-1",
    category: "Relationships",
    q: "Design your ideal relationship dynamic. What would it look like day-to-day?",
    essential: true,
    phase: 3,
  },
  {
    id: "rel-p3-2",
    category: "Relationships",
    q: "What one action could you take this week to strengthen your most important relationship?",
    essential: true,
    phase: 3,
  },

  {
    id: "fam-1",
    category: "Family",
    q: "What's one family value or tradition you care about (or want to create)?",
    essential: true,
    phase: 1,
  },
  {
    id: "fam-x",
    category: "Family",
    q: "Has family been a strong source of guidance for you?",
    chips: ["Yes", "No", "Sometimes"],
    xp: true,
    phase: 1,
  },
  
  // Phase 2: Family
  {
    id: "fam-p2-1",
    category: "Family",
    q: "What role do you want to play in your family? How do you see yourself contributing?",
    essential: true,
    phase: 2,
  },
  {
    id: "fam-p2-2",
    category: "Family",
    q: "How has your family shaped your values? What would you keep or change?",
    essential: true,
    phase: 2,
  },
  
  // Phase 3: Family
  {
    id: "fam-p3-1",
    category: "Family",
    q: "If you could create one new family tradition, what would it be?",
    essential: true,
    phase: 3,
  },

  {
    id: "car-1",
    category: "Career & Purpose",
    q: "If money weren't an issue, how would you spend your time?",
    essential: true,
    phase: 1,
  },
  {
    id: "car-2",
    category: "Career & Purpose",
    q: "What do you want more at work: freedom, recognition, or stability?",
    chips: ["Freedom", "Recognition", "Stability"],
    phase: 1,
  },
  {
    id: "car-x",
    category: "Career & Purpose",
    q: "Do you feel you haven't found meaningful work yet?",
    chips: ["Yes", "No", "Unsure"],
    xp: true,
    phase: 1,
  },
  
  // Phase 2: Career & Purpose
  {
    id: "car-p2-1",
    category: "Career & Purpose",
    q: "What would your ideal work environment look like? Describe the day-to-day.",
    essential: true,
    phase: 2,
  },
  {
    id: "car-p2-2",
    category: "Career & Purpose",
    q: "How do you define success in your career? Is it achievement, impact, or something else?",
    essential: true,
    phase: 2,
  },
  
  // Phase 3: Career & Purpose
  {
    id: "car-p3-1",
    category: "Career & Purpose",
    q: "What's one step you could take toward your ideal career this month?",
    essential: true,
    phase: 3,
  },

  {
    id: "fit-1",
    category: "Health & Fitness",
    q: "What activities make your body feel alive or strong?",
    chips: ["Kickboxing", "Running", "Weights", "Yoga", "Cycling", "Other"],
    essential: true,
    phase: 1,
  },
  {
    id: "fit-2",
    category: "Health & Fitness",
    q: "Do you see exercise as discipline, release, or play?",
    chips: ["Discipline", "Release", "Play", "Mix"],
    phase: 1,
  },
  {
    id: "fit-x",
    category: "Health & Fitness",
    q: "Do you feel you haven't found movement that excites you yet?",
    chips: ["Yes", "No", "Sometimes"],
    xp: true,
    phase: 1,
  },

  {
    id: "nut-1",
    category: "Nutrition",
    q: "Is food mostly fuel, comfort, or celebration for you?",
    chips: ["Fuel", "Comfort", "Celebration", "Mix"],
    essential: true,
    phase: 1,
  },
  {
    id: "nut-x",
    category: "Nutrition",
    q: "Do you know which foods make you feel best?",
    chips: ["Yes", "No", "Unsure"],
    xp: true,
    phase: 1,
  },

  {
    id: "slp-1",
    category: "Sleep & Recovery",
    q: "When did you last wake up truly refreshed? What helped?",
    essential: true,
    phase: 1,
  },
  {
    id: "slp-x",
    category: "Sleep & Recovery",
    q: "Have you ever had a consistent, healthy sleep routine?",
    chips: ["Yes", "No", "Sometimes"],
    xp: true,
    phase: 1,
  },

  {
    id: "hob-1",
    category: "Hobbies & Play",
    q: "What makes you lose track of time (even a little)?",
    essential: true,
    phase: 1,
  },
  {
    id: "hob-x",
    category: "Hobbies & Play",
    q: "Do you currently have hobbies that bring you joy?",
    chips: ["Yes", "No", "A bit"],
    xp: true,
    phase: 1,
  },

  {
    id: "lrn-1",
    category: "Learning & Growth",
    q: "What topic or skill sparks your curiosity right now?",
    chips: [
      "Philosophy",
      "Tech/AI",
      "Finance",
      "Parenting",
      "History",
      "Other",
    ],
    essential: true,
    phase: 1,
  },
  {
    id: "lrn-2",
    category: "Learning & Growth",
    q: "Do you prefer deep focus or wide exploration?",
    chips: ["Deep focus", "Wide exploration", "Mix / Not sure"],
    phase: 1,
  },
  {
    id: "lrn-x",
    category: "Learning & Growth",
    q: "Do you feel you haven't found a way of learning that excites you?",
    chips: ["Yes", "No", "Unsure"],
    xp: true,
    phase: 1,
  },

  {
    id: "trv-1",
    category: "Travel & Experiences",
    q: "What kind of places energise you most: nature, cities, or historic sites?",
    chips: ["Nature", "Cities", "Historic", "Mix"],
    essential: true,
    phase: 1,
  },
  {
    id: "trv-x",
    category: "Travel & Experiences",
    q: "Have you had many chances to travel or try new experiences?",
    chips: ["Yes", "No", "Some"],
    xp: true,
    phase: 1,
  },

  {
    id: "spi-1",
    category: "Spirituality & Meaning",
    q: "Where do you feel most grounded: faith, philosophy, nature, creativity…?",
    chips: ["Faith", "Philosophy", "Nature", "Creativity", "Other"],
    essential: true,
    phase: 1,
  },
  {
    id: "spi-x",
    category: "Spirituality & Meaning",
    q: "Have you explored spirituality/meaning much?",
    chips: ["Yes", "No", "A little"],
    xp: true,
    phase: 1,
  },

  {
    id: "fin-1",
    category: "Finance & Money Mindset",
    q: "Is money more about security, freedom, or opportunity for you?",
    chips: ["Security", "Freedom", "Opportunity", "Mix"],
    essential: true,
    phase: 1,
  },
  {
    id: "fin-x",
    category: "Finance & Money Mindset",
    q: "Do you feel confident in your money mindset?",
    chips: ["Yes", "No", "Learning"],
    xp: true,
    phase: 1,
  },

  {
    id: "com-1",
    category: "Community & Contribution",
    q: "Do you prefer helping one-to-one, in groups, or via larger causes?",
    chips: ["1:1", "Groups", "Causes", "Not sure"],
    essential: true,
    phase: 1,
  },
  {
    id: "com-x",
    category: "Community & Contribution",
    q: "Do you feel you've found meaningful ways to contribute?",
    chips: ["Yes", "No", "Not yet"],
    xp: true,
    phase: 1,
  },
  
  // Phase 2 & 3 prompts for remaining categories
  
  // Health & Fitness Phase 2/3
  { id: "fit-p2-1", category: "Health & Fitness", q: "What would your ideal weekly movement routine look like?", essential: true, phase: 2 },
  { id: "fit-p3-1", category: "Health & Fitness", q: "What's one move you can commit to this week for better energy?", essential: true, phase: 3 },
  
  // Nutrition Phase 2/3
  { id: "nut-p2-1", category: "Nutrition", q: "How do you want to feel when you eat? What changes would help?", essential: true, phase: 2 },
  { id: "nut-p3-1", category: "Nutrition", q: "What's one nutrition goal you'd like to work toward?", essential: true, phase: 3 },
  
  // Sleep & Recovery Phase 2/3
  { id: "slp-p2-1", category: "Sleep & Recovery", q: "What would an ideal evening wind-down routine look like for you?", essential: true, phase: 2 },
  { id: "slp-p3-1", category: "Sleep & Recovery", q: "What's one sleep habit you want to prioritize this week?", essential: true, phase: 3 },
  
  // Hobbies & Play Phase 2/3
  { id: "hob-p2-1", category: "Hobbies & Play", q: "What activities used to excite you that you've let go of?", essential: true, phase: 2 },
  { id: "hob-p3-1", category: "Hobbies & Play", q: "How can you add more play and joy into your weekly routine?", essential: true, phase: 3 },
  
  // Learning & Growth Phase 2/3
  { id: "lrn-p2-1", category: "Learning & Growth", q: "What's a skill or topic you've been curious about but haven't explored?", essential: true, phase: 2 },
  { id: "lrn-p3-1", category: "Learning & Growth", q: "What's one way you'll commit to learning this month?", essential: true, phase: 3 },
  
  // Travel & Experiences Phase 2/3
  { id: "trv-p2-1", category: "Travel & Experiences", q: "What kind of experiences would you love to have this year?", essential: true, phase: 2 },
  { id: "trv-p3-1", category: "Travel & Experiences", q: "What's one new place or experience you'll plan this month?", essential: true, phase: 3 },
  
  // Spirituality & Meaning Phase 2/3
  { id: "spi-p2-1", category: "Spirituality & Meaning", q: "What gives your life meaning and purpose right now?", essential: true, phase: 2 },
  { id: "spi-p3-1", category: "Spirituality & Meaning", q: "How can you nurture your sense of meaning this week?", essential: true, phase: 3 },
  
  // Finance & Money Mindset Phase 2/3
  { id: "fin-p2-1", category: "Finance & Money Mindset", q: "What's your relationship with money? What would you like to change?", essential: true, phase: 2 },
  { id: "fin-p3-1", category: "Finance & Money Mindset", q: "What's one financial goal you'll set for this month?", essential: true, phase: 3 },
  
  // Community & Contribution Phase 2/3
  { id: "com-p2-1", category: "Community & Contribution", q: "How do you want to make a difference? What matters most to you?", essential: true, phase: 2 },
  { id: "com-p3-1", category: "Community & Contribution", q: "What's one way you'll contribute to others this month?", essential: true, phase: 3 },
];

