# Revert Instructions

How to disable or remove engagement features if needed.

## Method 1: Feature Flags (Instant, No Code Deletion)

The easiest way to disable features is using feature flags:

### Step 1: Open Feature Flags File

```bash
open src/constants/featureFlags.ts
```

### Step 2: Disable Features

```typescript
export const FEATURES = {
  WEEKLY_CHECKIN: false,      // 👈 Set to false
  DAILY_SPARKS: false,         // 👈 Set to false
  PROGRESSIVE_DEEPENING: false, // 👈 Set to false
  // ... other flags
};
```

### Step 3: Save and Reload

The app will instantly update - features disappear from UI. No code deletion needed.

**Benefits:**
- ✅ Instant toggle
- ✅ No code deletion
- ✅ Can re-enable anytime
- ✅ Files remain for reference

---

## Method 2: Git Branch Revert (Clean Slate)

If you want to completely remove all changes:

### Step 1: Switch to Main Branch

```bash
git checkout main
```

### Step 2: Delete Feature Branch (Optional)

```bash
git branch -D feature/engagement-features
```

### Step 3: Done

You're back to the original state.

---

## Method 3: Manual File Deletion (Nuclear Option)

If you want to permanently delete feature files:

### Step 1: Delete New Files

```bash
# Weekly Check-In
rm src/pages/QuickCheckIn.tsx
rm src/components/WeeklyCheckInBanner.tsx

# Daily Sparks
rm src/components/DailySparks.tsx
rm src/components/MicroActionCard.tsx

# Progressive Deepening (when implemented)
rm src/components/PhaseProgressBadge.tsx

# Utility files
rm src/utils/checkInLogic.ts
rm src/utils/sparkSelection.ts
rm src/utils/phaseUnlocking.ts

# Constants
rm src/constants/microActions.ts
rm src/constants/featureFlags.ts

# AI abstraction (if not needed)
rm src/utils/aiService.ts
rm -rf src/utils/aiProviders/

# Documentation
rm OPENAI_INTEGRATION.md
rm REVERT_INSTRUCTIONS.md
```

### Step 2: Remove Feature Code from Existing Files

In `src/pages/Dashboard.tsx`:
- Look for comments: `👇 WEEKLY CHECK-IN FEATURE START` / `👆 WEEKLY CHECK-IN FEATURE END`
- Look for comments: `👇 DAILY SPARKS FEATURE START` / `👆 DAILY SPARKS FEATURE END`
- Look for comments: `👇 PROGRESSIVE DEEPENING FEATURE START` / `👆 PROGRESSIVE DEEPENING FEATURE END`
- Delete all code between these comments

In `src/App.tsx`:
- Look for similar comments around route handlers
- Delete marked sections

In `src/types/index.ts`:
- Remove `CheckInEntry`, `CategoryPhase`, `CategoryHistory` interfaces
- Remove `phase` field from `Prompt` type
- Remove `quickCheckIn` from `Route` type

### Step 3: Remove Import Statements

In modified files, remove imports for deleted components:
- `import { WeeklyCheckInBanner } from ...`
- `import { DailySparks } from ...`
- `import { QuickCheckIn } from ...`
- etc.

### Step 4: Clean Up localStorage

```javascript
// In browser console:
localStorage.removeItem("innercode_checkins");
localStorage.removeItem("innercode_category_history");
localStorage.removeItem("innercode_daily_actions");
```

### Step 5: Restore Original AICoach.tsx (if you want to remove AI abstraction)

The AI abstraction refactored AICoach.tsx. If you want to restore the original inline logic:

```bash
git checkout HEAD -- src/pages/AICoach.tsx
```

Then remove:
- `import { aiService } from "../utils/aiService";`
- Replace async/await calls with original synchronous functions

---

## Method 4: Selective Feature Removal

Want to keep some features but remove others?

### Keep Only Weekly Check-In

```typescript
// In featureFlags.ts
export const FEATURES = {
  WEEKLY_CHECKIN: true,       // ✅ Keep this
  DAILY_SPARKS: false,         // ❌ Remove this
  PROGRESSIVE_DEEPENING: false, // ❌ Remove this
};
```

Delete files for disabled features (see Method 3).

### Keep Only Daily Sparks

```typescript
export const FEATURES = {
  WEEKLY_CHECKIN: false,      // ❌ Remove this
  DAILY_SPARKS: true,          // ✅ Keep this
  PROGRESSIVE_DEEPENING: false, // ❌ Remove this
};
```

---

## Quick Revert Checklist

- [ ] Feature flags disabled (fastest)
- [ ] OR Files deleted (complete removal)
- [ ] Import statements removed
- [ ] Marked code sections removed from Dashboard.tsx
- [ ] Marked code sections removed from App.tsx
- [ ] Types cleaned up in types/index.ts
- [ ] localStorage cleared (optional, manual cleanup)
- [ ] App tested (verify no errors)

---

## Time Estimates

- **Method 1 (Feature Flags):** 30 seconds ⚡
- **Method 2 (Git Revert):** 1 minute
- **Method 3 (Manual Deletion):** 5-10 minutes
- **Method 4 (Selective):** 2-5 minutes

---

## Need Help?

If you encounter issues during revert:

1. Check browser console for errors
2. Look for broken imports
3. Verify localStorage keys don't reference deleted features
4. Test each feature one by one

The app should work perfectly with any combination of features enabled/disabled.

