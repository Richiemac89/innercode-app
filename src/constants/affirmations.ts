/**
 * Affirmations for the morning journal carousel, tagged by life area or value
 * so we can show ones that match the user's completed categories and values.
 */
export interface Affirmation {
  text: string;
  tag: string;
}

export const AFFIRMATIONS_BY_LIFE_AREA: Record<string, string[]> = {
  Relationships: [
    "I nurture my relationships with presence and care.",
    "I am worthy of deep, supportive connections.",
    "I show up for the people I care about with an open heart.",
    "I communicate with kindness and listen with curiosity.",
    "I choose relationships that help me grow and feel seen.",
  ],
  Family: [
    "I show up for my family with patience and love.",
    "I create space for quality time with the people who matter most.",
    "I honour my family's needs while respecting my own boundaries.",
    "I am present with my family when we are together.",
    "I contribute to a home that feels safe and supportive.",
  ],
  "Career & Purpose": [
    "I am aligned with work that matters to me.",
    "I use my strengths in ways that feel meaningful.",
    "I am allowed to grow and change direction in my career.",
    "I show up for my work with focus and intention.",
    "I choose opportunities that match my values and purpose.",
  ],
  "Health & Fitness": [
    "I honour my body with movement and rest.",
    "I am committed to feeling strong and energised in my body.",
    "I move in ways that feel good and sustainable.",
    "I treat my body as my ally, not my enemy.",
    "I make choices that support my long-term health and energy.",
  ],
  Nutrition: [
    "I fuel my body with foods that support how I want to feel.",
    "I eat with awareness and without guilt.",
    "I choose nourishment that gives me energy and clarity.",
    "I respect my body's hunger and fullness.",
    "I enjoy food as part of a balanced, kind relationship with myself.",
  ],
  "Sleep & Recovery": [
    "I prioritise rest so I can show up fully.",
    "I give myself permission to rest without earning it.",
    "I create a routine that supports deep, restorative sleep.",
    "I listen to my body when it needs rest and recovery.",
    "I protect my sleep as a non-negotiable part of my wellbeing.",
  ],
  "Hobbies & Play": [
    "I give myself permission to play and create.",
    "I make time for activities that bring me joy.",
    "I don't have to be productive to be valuable.",
    "I explore hobbies that help me feel alive and curious.",
    "I allow myself to have fun without justification.",
  ],
  "Learning & Growth": [
    "I am open to learning something new today.",
    "I grow through curiosity, not only through success.",
    "I welcome feedback as a chance to improve.",
    "I am a lifelong learner, and that is enough.",
    "I celebrate progress, not only mastery.",
  ],
  "Travel & Experiences": [
    "I am open to new places and experiences.",
    "I allow myself to explore and step outside my comfort zone.",
    "I create memories that matter to me.",
    "I see adventure as a way to learn and grow.",
    "I give myself permission to invest in experiences that enrich my life.",
  ],
  "Spirituality & Meaning": [
    "I connect with what gives my life meaning.",
    "I make space for stillness and reflection.",
    "I trust that I am part of something larger than myself.",
    "I live in line with what I believe matters most.",
    "I find peace in the present moment.",
  ],
  "Finance & Money Mindset": [
    "I make choices that support my financial wellbeing.",
    "I am capable of building security and options for myself.",
    "I relate to money with clarity, not fear.",
    "I use money in ways that align with my values.",
    "I am allowed to want both stability and abundance.",
  ],
  "Community & Contribution": [
    "I contribute in ways that feel true to me.",
    "I belong to communities that support and inspire me.",
    "I make a difference in small and meaningful ways.",
    "I give from a full cup, not from depletion.",
    "I am part of something bigger than myself.",
  ],
};

export const AFFIRMATIONS_BY_VALUE: Record<string, string[]> = {
  honesty: [
    "I choose to be honest with myself and others.",
    "I speak my truth with kindness and clarity.",
    "I value authenticity over approval.",
    "I can be real about how I feel without shame.",
    "I build trust by being genuine and consistent.",
  ],
  connection: [
    "I am worthy of deep connection.",
    "I show up for others and allow them to show up for me.",
    "I create space for real, meaningful relationships.",
    "I belong and I am enough as I am.",
    "I nurture the bonds that matter to me.",
  ],
  growth: [
    "I am capable of growth.",
    "I welcome challenges as opportunities to learn.",
    "I am allowed to change and evolve.",
    "I grow one step at a time, and that is enough.",
    "I invest in becoming the person I want to be.",
  ],
  stability: [
    "I can build a sense of safety and steadiness.",
    "I take practical steps toward security and calm.",
    "I create routines that ground me.",
    "I am allowed to want predictability and peace of mind.",
    "I trust that I can handle what comes my way.",
  ],
  discovery: [
    "I am curious and open to new experiences.",
    "I step into the unknown with courage.",
    "I learn by trying, not only by planning.",
    "I welcome adventure as part of a full life.",
    "I discover more about myself and the world every day.",
  ],
  vitality: [
    "I have the energy to do what matters today.",
    "I take care of my body so I can live fully.",
    "I move in ways that make me feel alive.",
    "I protect my energy and use it on what I value.",
    "I am allowed to feel strong and energised.",
  ],
  freedom: [
    "I have the freedom to choose how I respond.",
    "I live in line with my own values, not others' expectations.",
    "I am allowed to want autonomy and space.",
    "I make choices that support my sense of freedom.",
    "I can change direction when something no longer fits.",
  ],
  contribution: [
    "I make a difference in small and big ways.",
    "I give from a place of abundance, not obligation.",
    "I use my time and skills to help others when I can.",
    "My contributions matter, even when they feel small.",
    "I am part of positive change in the world.",
  ],
  meaning: [
    "My life has purpose and meaning.",
    "I connect with what makes life feel worthwhile.",
    "I live according to what I believe matters.",
    "I find meaning in both big and small moments.",
    "I am here for a reason, and I get to define what that means.",
  ],
  achievement: [
    "I celebrate progress, not only outcomes.",
    "I am allowed to aim high and take pride in my efforts.",
    "I define success in ways that fit my values.",
    "I move toward my goals one step at a time.",
    "I am capable of accomplishing what I set out to do.",
  ],
  balance: [
    "I can find balance between doing and being.",
    "I honour both work and rest.",
    "I listen to my body and mind when they need a break.",
    "I don't have to be busy to be valuable.",
    "I create a rhythm that sustains me over time.",
  ],
};

/** Flatten into a single list with tags for filtering by user's life areas and values */
export function buildAffirmationsList(): Affirmation[] {
  const list: Affirmation[] = [];
  for (const [tag, texts] of Object.entries(AFFIRMATIONS_BY_LIFE_AREA)) {
    for (const text of texts) list.push({ text, tag });
  }
  for (const [tag, texts] of Object.entries(AFFIRMATIONS_BY_VALUE)) {
    for (const text of texts) list.push({ text, tag });
  }
  return list;
}

const ALL_AFFIRMATIONS = buildAffirmationsList();

/** Evening: "I" affirmations only (rest, letting go, self-compassion) */
export const EVENING_AFFIRMATIONS_AND_REMINDERS: Affirmation[] = [
  { text: "I reflect on the day with curiosity, not judgment.", tag: "Evening" },
  { text: "I am allowed to rest; I don't have to earn it.", tag: "Evening" },
  { text: "I let go of what I can't control.", tag: "Evening" },
  { text: "I close the day with kindness toward myself.", tag: "Evening" },
  { text: "I notice what went well, not only what didn't.", tag: "Evening" },
  { text: "I give myself permission to put today down.", tag: "Evening" },
  { text: "I learn from the day without punishing myself.", tag: "Evening" },
  { text: "I am enough, regardless of how today went.", tag: "Evening" },
  { text: "I've done enough for today.", tag: "Evening" },
  { text: "I make rest part of the practice.", tag: "Evening" },
];

/** Fisher–Yates shuffle so affirmations aren't shown in tag order (e.g. 5 Family in a row) */
function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Shuffled evening list for the carousel (I affirmations only) */
export function getEveningAffirmations(): Affirmation[] {
  return shuffleArray([...EVENING_AFFIRMATIONS_AND_REMINDERS]);
}

/**
 * Get affirmations that match the user's completed life areas and/or selected values.
 * If no tags match, returns the full list so the carousel always has content.
 * List is shuffled so the user doesn't see several in a row from the same tag.
 */
export function getAffirmationsForUser(
  completedCategories: string[],
  userValueKeys: string[]
): Affirmation[] {
  const allowedTags = new Set([...completedCategories, ...userValueKeys]);
  const list = allowedTags.size === 0
    ? ALL_AFFIRMATIONS
    : (() => {
        const filtered = ALL_AFFIRMATIONS.filter((a) => allowedTags.has(a.tag));
        return filtered.length > 0 ? filtered : ALL_AFFIRMATIONS;
      })();
  return shuffleArray(list);
}
