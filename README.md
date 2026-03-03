# InnerCode - Values, Life Areas & AI Coach

The only app that ties your values, life areas, journaling, and weekly check-ins to one AI coach. Built with React, inspired by PERMA, Self-Determination Theory, Ikigai, and ACT.

## 🌟 Features

- **Onboarding inspired by evidence-based psychology**: Answer reflective questions across 12 life domains (e.g. PERMA, ACT). Rate each area 0–10 and deepen categories in phases.
- **Value detection**: Your words are analyzed (keyword/stemming) to infer themes and surface your core values.
- **Personal Code & Results**: Get a personalized summary, life-areas wheel, values league, and suggestions (weak areas, value-aligned, discovery).
- **Daily journaling**: Entries with mood, gratitude (3 things), and category/value tags. Calendar view and streaks.
- **AI coach (Inny)**: One coach with full context—your onboarding, results, journal summary, and recent entries—for personalized support.
- **Weekly check-in**: Re-rate life areas and get an AI summary of what’s improving, stable, or slipping.
- **Daily Sparks & Insights**: Micro-actions and pattern-based nudges aligned to your values and goals.
- **Sync & offline**: Account and data sync via Supabase; works offline and syncs when back online.

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd innercode-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   The app should automatically open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
innercode-app/
├── src/
│   ├── components/       # Reusable UI components
│   ├── constants/        # Categories, prompts, values, suggestions
│   ├── contexts/         # Auth, etc.
│   ├── lib/              # Supabase client and data helpers
│   ├── pages/            # Landing, onboarding, dashboard, journal, AI coach, etc.
│   ├── types/
│   ├── utils/            # valueDetection, results, aiService, checkInLogic, etc.
│   ├── App.tsx
│   └── main.tsx
├── public/
├── supabase/             # Edge functions (e.g. Inny chat)
├── package.json
├── vite.config.ts
└── README.md
```

## 🎯 How It Works

### 1. Sign up & onboarding
- Create an account (email verification supported). Your data syncs via Supabase so you can use the app on multiple devices.
- Choose life areas and answer reflective questions. Rate each area 0–10. You can expand categories over time for deeper reflection.

### 2. Value detection
- Your answers are analyzed (keyword and stemming) to detect themes that map to values (e.g. connection, growth, vitality, meaning). These are inspired by established psychology frameworks, not a clinical assessment.

### 3. Results & Personal Code
- View your life-areas wheel, values league, and a draft “Personal Code.” Get suggestions: areas to strengthen, actions aligned to your values, and discovery prompts.

### 4. Journaling
- Write daily reflections, log mood, list three gratitudes, and tag entries with categories and values. Your journal feeds into Inny and into adaptive results (e.g. category boosts from tagging).

### 5. AI coach (Inny)
- Chat with Inny, who has access to your onboarding, results, journal summary, and recent entries. Ask about your lowest area, top value, or next steps. Suggestions can be opened into a focused chat.

### 6. Weekly check-in & daily habits
- Re-rate life areas in the quick check-in and see an AI summary of changes. Use Daily Sparks for small, value-aligned actions and Daily Insight for pattern-based nudges.

## 🔒 Privacy & data

- **Accounts and sync**: InnerCode uses **Supabase** for authentication and syncing your data across devices. You need an account to use the app and sync.
- **Your data stays private**: Data is stored in a way that we cannot read your journal entries, answers, or other personal content. The app is designed so your reflections remain private and secure.
- **Offline**: The app works offline and queues changes to sync when you’re back online.
- **Control**: You can sign out and manage your account; clear app/browser data to remove local copies.

## 🛠️ Technology Stack

- **React** – UI
- **TypeScript** – Types
- **Vite** – Build and dev server
- **Supabase** – Auth and cloud data (sync)
- **Local storage** – Offline and cache

## 🎨 Customization

- **Categories & prompts**: `src/constants/categories.ts`, `src/constants/prompts.ts`
- **Values**: `src/constants/values.ts`
- **Suggestions**: `src/constants/suggestions.ts`
- **Global styles**: `src/components/GlobalStyles.tsx`

## 📝 Development

- `npm run dev` – Start dev server
- `npm run build` – Production build
- `npm run preview` – Preview production build
- `npm run lint` – ESLint

## 🙏 Acknowledgments

InnerCode’s design is inspired by ideas from:

- **PERMA** (Positive Psychology)
- **Self-Determination Theory**
- **Ikigai** (Japanese concept of purpose)
- **ACT** (Acceptance and Commitment Therapy)

Developed in partnership with occupational therapists and psychotherapists to support values-aligned living and self-reflection.

## 💡 Future ideas

- Export journal or results (e.g. PDF/text)
- More data visualizations
- Habit and goal tracking
- Optional coach/therapist sharing

---

**Made with ❤️ for personal growth and self-discovery**
