// Micro-Actions Library
// Daily Sparks - Quick actions for each life area

export interface MicroAction {
  id: string;
  text: string;
  time: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  value?: string;
}

export const MICRO_ACTIONS: Record<string, MicroAction[]> = {
  "Relationships": [
    { id: "rel-1", text: "Send a 'thinking of you' text to someone who matters", time: "2 min", difficulty: "easy", category: "Relationships", value: "connection" },
    { id: "rel-2", text: "Give someone a genuine compliment", time: "1 min", difficulty: "easy", category: "Relationships", value: "connection" },
    { id: "rel-3", text: "Call someone you haven't talked to in a while", time: "10 min", difficulty: "medium", category: "Relationships", value: "connection" },
    { id: "rel-4", text: "Ask a friend how they're really doing and listen", time: "5 min", difficulty: "easy", category: "Relationships", value: "connection" },
    { id: "rel-5", text: "Plan a short catch-up with someone you miss", time: "3 min", difficulty: "easy", category: "Relationships", value: "connection" },
    { id: "rel-6", text: "Send a thank-you message to someone who helped you", time: "2 min", difficulty: "easy", category: "Relationships", value: "connection" },
    { id: "rel-7", text: "Have a conversation without checking your phone", time: "15 min", difficulty: "medium", category: "Relationships", value: "connection" },
    { id: "rel-8", text: "Reach out to one person you've lost touch with", time: "5 min", difficulty: "easy", category: "Relationships", value: "connection" },
  ],
  "Family": [
    { id: "fam-1", text: "Send a voice note to a family member sharing appreciation", time: "2 min", difficulty: "easy", category: "Family", value: "connection" },
    { id: "fam-2", text: "Set up a regular weekly check-in with family", time: "5 min", difficulty: "medium", category: "Family", value: "connection" },
    { id: "fam-3", text: "Do something small to help a family member", time: "15 min", difficulty: "easy", category: "Family", value: "contribution" },
    { id: "fam-4", text: "Share one thing you're grateful for about your family", time: "2 min", difficulty: "easy", category: "Family", value: "connection" },
    { id: "fam-5", text: "Send a photo or memory to a relative", time: "3 min", difficulty: "easy", category: "Family", value: "connection" },
    { id: "fam-6", text: "Ask a family member about their day and really listen", time: "10 min", difficulty: "easy", category: "Family", value: "connection" },
    { id: "fam-7", text: "Plan one small family activity for this week", time: "5 min", difficulty: "easy", category: "Family", value: "connection" },
    { id: "fam-8", text: "Write or say one thing you appreciate about a family member", time: "2 min", difficulty: "easy", category: "Family", value: "contribution" },
  ],
  "Career & Purpose": [
    { id: "career-1", text: "Write down one small goal for this week", time: "5 min", difficulty: "easy", category: "Career & Purpose", value: "achievement" },
    { id: "career-2", text: "Learn one new thing about your field", time: "10 min", difficulty: "easy", category: "Career & Purpose", value: "growth" },
    { id: "career-3", text: "Update your LinkedIn or portfolio", time: "15 min", difficulty: "medium", category: "Career & Purpose", value: "achievement" },
    { id: "career-4", text: "List three skills you want to develop", time: "5 min", difficulty: "easy", category: "Career & Purpose", value: "growth" },
    { id: "career-5", text: "Reach out to one person in your industry", time: "5 min", difficulty: "easy", category: "Career & Purpose", value: "connection" },
    { id: "career-6", text: "Block 30 minutes for deep work this week", time: "2 min", difficulty: "easy", category: "Career & Purpose", value: "achievement" },
    { id: "career-7", text: "Reflect on one win from the past week", time: "3 min", difficulty: "easy", category: "Career & Purpose", value: "achievement" },
    { id: "career-8", text: "Read or watch something that expands your professional view", time: "15 min", difficulty: "easy", category: "Career & Purpose", value: "growth" },
  ],
  "Health & Fitness": [
    { id: "health-1", text: "Do 10 pushups or squats right now", time: "2 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-2", text: "Take a 5-minute walk outside", time: "5 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-3", text: "Drink a full glass of water", time: "1 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-4", text: "Stretch for 5 minutes", time: "5 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-5", text: "Take the stairs instead of the lift once today", time: "2 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-6", text: "Do a 1-minute plank or wall sit", time: "1 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-7", text: "Stand or move for 5 minutes every hour", time: "5 min", difficulty: "easy", category: "Health & Fitness", value: "vitality" },
    { id: "health-8", text: "Try one new exercise or movement", time: "10 min", difficulty: "medium", category: "Health & Fitness", value: "vitality" },
  ],
  "Nutrition": [
    { id: "nutrition-1", text: "Eat one serving of vegetables", time: "5 min", difficulty: "easy", category: "Nutrition", value: "vitality" },
    { id: "nutrition-2", text: "Drink a glass of water before your next meal", time: "1 min", difficulty: "easy", category: "Nutrition", value: "vitality" },
    { id: "nutrition-3", text: "Try a new healthy snack", time: "10 min", difficulty: "easy", category: "Nutrition", value: "discovery" },
    { id: "nutrition-4", text: "Eat one meal without screens", time: "15 min", difficulty: "easy", category: "Nutrition", value: "balance" },
    { id: "nutrition-5", text: "Add one fruit or vegetable to your next meal", time: "2 min", difficulty: "easy", category: "Nutrition", value: "vitality" },
    { id: "nutrition-6", text: "Prep one healthy option for tomorrow", time: "10 min", difficulty: "medium", category: "Nutrition", value: "vitality" },
    { id: "nutrition-7", text: "Notice one thing about how food makes you feel", time: "1 min", difficulty: "easy", category: "Nutrition", value: "balance" },
    { id: "nutrition-8", text: "Choose a wholegrain or high-fibre option at one meal", time: "2 min", difficulty: "easy", category: "Nutrition", value: "vitality" },
  ],
  "Sleep & Recovery": [
    { id: "sleep-1", text: "Set a bedtime alarm for tonight", time: "1 min", difficulty: "easy", category: "Sleep & Recovery", value: "balance" },
    { id: "sleep-2", text: "Do 5 minutes of evening stretching", time: "5 min", difficulty: "easy", category: "Sleep & Recovery", value: "balance" },
    { id: "sleep-3", text: "Put your phone in another room 30 min before bed", time: "1 min", difficulty: "medium", category: "Sleep & Recovery", value: "balance" },
    { id: "sleep-4", text: "Wind down with 5 minutes of breathing or relaxation", time: "5 min", difficulty: "easy", category: "Sleep & Recovery", value: "balance" },
    { id: "sleep-5", text: "Avoid caffeine after a set time today", time: "1 min", difficulty: "easy", category: "Sleep & Recovery", value: "balance" },
    { id: "sleep-6", text: "Write down one thing on your mind before bed", time: "2 min", difficulty: "easy", category: "Sleep & Recovery", value: "balance" },
    { id: "sleep-7", text: "Get 5 minutes of natural light in the morning", time: "5 min", difficulty: "easy", category: "Sleep & Recovery", value: "vitality" },
    { id: "sleep-8", text: "Rest or nap for 10–20 minutes if you need it", time: "20 min", difficulty: "easy", category: "Sleep & Recovery", value: "balance" },
  ],
  "Hobbies & Play": [
    { id: "hobbies-1", text: "Spend 10 minutes on a hobby you love", time: "10 min", difficulty: "easy", category: "Hobbies & Play", value: "discovery" },
    { id: "hobbies-2", text: "Try something creative you've never done", time: "15 min", difficulty: "medium", category: "Hobbies & Play", value: "creativity" },
    { id: "hobbies-3", text: "Play a game or do something purely for fun", time: "20 min", difficulty: "easy", category: "Hobbies & Play", value: "discovery" },
    { id: "hobbies-4", text: "Listen to music you love without multitasking", time: "10 min", difficulty: "easy", category: "Hobbies & Play", value: "discovery" },
    { id: "hobbies-5", text: "Doodle, sketch, or make something with your hands", time: "10 min", difficulty: "easy", category: "Hobbies & Play", value: "creativity" },
    { id: "hobbies-6", text: "Try a new recipe or cook something for fun", time: "20 min", difficulty: "medium", category: "Hobbies & Play", value: "creativity" },
    { id: "hobbies-7", text: "Watch or read something that makes you laugh", time: "10 min", difficulty: "easy", category: "Hobbies & Play", value: "discovery" },
    { id: "hobbies-8", text: "Spend 15 minutes outdoors doing something you enjoy", time: "15 min", difficulty: "easy", category: "Hobbies & Play", value: "vitality" },
  ],
  "Learning & Growth": [
    { id: "learning-1", text: "Read one article or watch one educational video", time: "10 min", difficulty: "easy", category: "Learning & Growth", value: "growth" },
    { id: "learning-2", text: "Learn one new word or concept", time: "5 min", difficulty: "easy", category: "Learning & Growth", value: "growth" },
    { id: "learning-3", text: "Take an online course lesson", time: "20 min", difficulty: "medium", category: "Learning & Growth", value: "growth" },
    { id: "learning-4", text: "Summarise one thing you learned today", time: "3 min", difficulty: "easy", category: "Learning & Growth", value: "growth" },
    { id: "learning-5", text: "Listen to a podcast or audiobook for 10 minutes", time: "10 min", difficulty: "easy", category: "Learning & Growth", value: "growth" },
    { id: "learning-6", text: "Ask someone about a topic they know well", time: "5 min", difficulty: "easy", category: "Learning & Growth", value: "growth" },
    { id: "learning-7", text: "Practice a skill you're building for 10 minutes", time: "10 min", difficulty: "easy", category: "Learning & Growth", value: "growth" },
    { id: "learning-8", text: "Note one question you want to explore this week", time: "2 min", difficulty: "easy", category: "Learning & Growth", value: "discovery" },
  ],
  "Travel & Experiences": [
    { id: "travel-1", text: "Visit a place nearby you've never been", time: "30 min", difficulty: "easy", category: "Travel & Experiences", value: "discovery" },
    { id: "travel-2", text: "Try a new type of food or cuisine", time: "20 min", difficulty: "easy", category: "Travel & Experiences", value: "discovery" },
    { id: "travel-3", text: "Explore a new neighborhood or street", time: "15 min", difficulty: "easy", category: "Travel & Experiences", value: "discovery" },
    { id: "travel-4", text: "Take a different route for a usual journey", time: "5 min", difficulty: "easy", category: "Travel & Experiences", value: "discovery" },
    { id: "travel-5", text: "Look up one place you'd like to visit and save it", time: "5 min", difficulty: "easy", category: "Travel & Experiences", value: "discovery" },
    { id: "travel-6", text: "Try one new café, shop, or local spot", time: "15 min", difficulty: "easy", category: "Travel & Experiences", value: "discovery" },
    { id: "travel-7", text: "Share a travel or experience memory with someone", time: "5 min", difficulty: "easy", category: "Travel & Experiences", value: "connection" },
    { id: "travel-8", text: "Spend 10 minutes outside in a green space", time: "10 min", difficulty: "easy", category: "Travel & Experiences", value: "vitality" },
  ],
  "Spirituality & Meaning": [
    { id: "spirituality-1", text: "Spend 5 minutes in quiet reflection", time: "5 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
    { id: "spirituality-2", text: "Write down one thing you're grateful for", time: "2 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
    { id: "spirituality-3", text: "Read something inspiring or philosophical", time: "10 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
    { id: "spirituality-4", text: "Notice one moment of calm or beauty today", time: "1 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
    { id: "spirituality-5", text: "Set an intention for the day in one sentence", time: "2 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
    { id: "spirituality-6", text: "Do a short breathing or grounding exercise", time: "3 min", difficulty: "easy", category: "Spirituality & Meaning", value: "balance" },
    { id: "spirituality-7", text: "Reflect on one value that matters to you", time: "3 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
    { id: "spirituality-8", text: "Write one sentence about what gave today meaning", time: "2 min", difficulty: "easy", category: "Spirituality & Meaning", value: "meaning" },
  ],
  "Finance & Money Mindset": [
    { id: "finance-1", text: "Review one expense category for this month", time: "5 min", difficulty: "easy", category: "Finance & Money Mindset", value: "stability" },
    { id: "finance-2", text: "Set up one automatic savings transfer", time: "10 min", difficulty: "medium", category: "Finance & Money Mindset", value: "stability" },
    { id: "finance-3", text: "Learn one money tip or strategy", time: "10 min", difficulty: "easy", category: "Finance & Money Mindset", value: "growth" },
    { id: "finance-4", text: "Check your balance or budget once", time: "3 min", difficulty: "easy", category: "Finance & Money Mindset", value: "stability" },
    { id: "finance-5", text: "Cancel or pause one subscription you don't use", time: "5 min", difficulty: "easy", category: "Finance & Money Mindset", value: "stability" },
    { id: "finance-6", text: "Put a small amount into savings or a goal", time: "2 min", difficulty: "easy", category: "Finance & Money Mindset", value: "stability" },
    { id: "finance-7", text: "Note one spending win from this week", time: "2 min", difficulty: "easy", category: "Finance & Money Mindset", value: "achievement" },
    { id: "finance-8", text: "Read one short article about money or saving", time: "5 min", difficulty: "easy", category: "Finance & Money Mindset", value: "growth" },
  ],
  "Community & Contribution": [
    { id: "community-1", text: "Offer genuine help to one person", time: "15 min", difficulty: "easy", category: "Community & Contribution", value: "contribution" },
    { id: "community-2", text: "Find one local cause or organization to support", time: "10 min", difficulty: "easy", category: "Community & Contribution", value: "contribution" },
    { id: "community-3", text: "Share something helpful with others", time: "5 min", difficulty: "easy", category: "Community & Contribution", value: "contribution" },
    { id: "community-4", text: "Thank someone who helps your community", time: "2 min", difficulty: "easy", category: "Community & Contribution", value: "contribution" },
    { id: "community-5", text: "Donate one item or small amount to a cause", time: "5 min", difficulty: "easy", category: "Community & Contribution", value: "contribution" },
    { id: "community-6", text: "Recommend a local business or person to someone", time: "2 min", difficulty: "easy", category: "Community & Contribution", value: "connection" },
    { id: "community-7", text: "Offer to help a neighbour or colleague with one small thing", time: "10 min", difficulty: "easy", category: "Community & Contribution", value: "contribution" },
    { id: "community-8", text: "Learn about one local initiative or event", time: "5 min", difficulty: "easy", category: "Community & Contribution", value: "discovery" },
  ],
};

