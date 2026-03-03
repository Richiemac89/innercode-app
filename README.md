# InnerCode - Values Discovery & Journaling App

A React application that helps users discover their values through evidence-based psychology, reflect by journaling, and continuously improve their lifestyle through AI-powered insights.

## 🌟 Features

- **Evidence-Based Onboarding**: Answer questions across 12 life domains using frameworks like PERMA, Self-Determination Theory, Ikigai, and ACT
- **Value Detection**: Automatic analysis of your responses to identify your core values
- **Personal Code**: Get a personalized summary of your values and traits
- **Smart Suggestions**: Receive actionable suggestions aligned with your values and areas needing attention
- **Daily Journaling**: Journal entries with mood tracking, gratitude practice, and value/category tagging
- **Calendar View**: Visual calendar to track your journaling journey
- **Adaptive Results**: Your results improve over time as you journal and tag entries

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

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## 📁 Project Structure

```
innercode-app/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── AnalyzingOverlay.tsx
│   │   ├── Callout.tsx
│   │   ├── CategoryHeader.tsx
│   │   ├── CategoryProgress.tsx
│   │   ├── CategoryTable.tsx
│   │   ├── FilterChip.tsx
│   │   ├── FloatingMenu.tsx
│   │   ├── GlobalStyles.tsx
│   │   ├── Toast.tsx
│   │   └── ValuesLeague.tsx
│   ├── constants/        # App constants and data
│   │   ├── categories.ts
│   │   ├── prompts.ts
│   │   ├── suggestions.ts
│   │   └── values.ts
│   ├── pages/           # Page components
│   │   ├── Home.tsx
│   │   ├── Instructions.tsx
│   │   ├── Journal.tsx
│   │   ├── JournalCalendar.tsx
│   │   ├── Onboarding.tsx
│   │   └── Results.tsx
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── helpers.ts
│   │   ├── results.ts
│   │   └── valueDetection.ts
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── README.md           # This file
```

## 🎯 How It Works

### 1. Onboarding Flow
- Answer questions across 12 life categories
- Rate each category from 0-10
- The app analyzes your responses using evidence-based frameworks

### 2. Value Detection
The app uses keyword analysis and stemming to detect themes in your responses:
- **Connection**: relationships, community, belonging
- **Growth**: learning, improvement, development
- **Vitality**: health, energy, physical wellness
- **Discovery**: exploration, adventure, new experiences
- And more...

### 3. Results
You'll receive:
- **Category Focus**: Areas ranked by your ratings (weakest first for focused improvement)
- **Values League**: Your top values ranked by signal strength
- **Personal Code**: A draft statement of your core values
- **Suggestions**: Actionable steps for both improvement areas and value-aligned activities

### 4. Journaling
- Write daily reflections
- Track your mood with emojis
- Practice gratitude (3 things daily)
- Tag entries with categories and values
- View entries in a calendar

### 5. Adaptive Learning
As you journal and tag entries:
- Categories with 3+ tagged entries in 14 days get +1 boost
- Categories with 7+ tagged entries get +2 boost
- Your results update to reflect your progress

## 🔒 Privacy

- **All data is stored locally** in your browser's localStorage
- No data is sent to any server
- Your journal entries remain private on your device
- Clear your browser data to reset the app

## 🛠️ Technology Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Local Storage** - Data persistence

## 🎨 Customization

### Adding New Categories
Edit `src/constants/categories.ts` and `src/constants/prompts.ts`

### Adding New Values
Edit `src/constants/values.ts` to add value signals and icons

### Customizing Suggestions
Edit `src/constants/suggestions.ts` to modify category-specific suggestions

### Styling
Global styles are in `src/components/GlobalStyles.tsx`
Each component uses inline styles for easy customization

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization

- **Components**: Small, reusable UI pieces
- **Pages**: Full page views
- **Utils**: Pure functions for logic
- **Constants**: Data that doesn't change
- **Types**: TypeScript interfaces and types

## 🤝 Contributing

This is a personal project, but suggestions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this code for your own projects!

## 🙏 Acknowledgments

Built with evidence-based psychology frameworks:
- **PERMA** (Positive Psychology)
- **Self-Determination Theory**
- **Ikigai** (Japanese concept of purpose)
- **ACT** (Acceptance and Commitment Therapy)

## 💡 Future Ideas

- Export journal as PDF/text
- Data visualization charts
- Habit tracking
- Goal setting integration
- Optional cloud sync
- Mobile app version

---

**Made with ❤️ for personal growth and self-discovery**

