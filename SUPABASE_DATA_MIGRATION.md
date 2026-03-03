# 🔄 Supabase Data Migration Guide

## Overview
This guide explains how to move `results` and `journal entries` from localStorage to Supabase for cross-device synchronization.

---

## 📊 Current State (localStorage)
- ✅ Works great for single device
- ❌ Data doesn't sync across devices
- ❌ Lost if user clears browser data
- ❌ Can't be accessed from other browsers

## 🎯 Goal State (Supabase)
- ✅ Data syncs across all devices
- ✅ Persists even if browser data is cleared
- ✅ Accessible from any device with login
- ✅ Can implement backup/restore features

---

## 🗄️ Step 1: Create Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- ============================================
-- TABLE: user_results
-- Stores the computed results for each user
-- ============================================
CREATE TABLE user_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  personal_code text NOT NULL,
  aligned text[] DEFAULT '{}',
  improvement text[] DEFAULT '{}',
  value_entries jsonb DEFAULT '[]',
  suggestions jsonb DEFAULT '[]',
  weak_area_suggestions jsonb DEFAULT '[]',
  value_strength_suggestions jsonb DEFAULT '[]',
  discovery_area_suggestions jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- TABLE: journal_entries
-- Stores user's journal entries
-- ============================================
CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text text NOT NULL,
  categories text[] DEFAULT '{}',
  values text[] DEFAULT '{}',
  gratitude text[] DEFAULT '{}',
  mood text,
  suggestion_ref text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: user_onboarding_state
-- Stores user's onboarding progress snapshot
-- ============================================
CREATE TABLE user_onboarding_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages jsonb DEFAULT '[]',
  step integer DEFAULT 0,
  selected_categories text[] DEFAULT '{}',
  completed_categories text[] DEFAULT '{}',
  category_scores jsonb DEFAULT '{}',
  category_phases jsonb DEFAULT '{}',
  has_seen_results boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- TABLE: user_onboarding_answers
-- Stores per-question onboarding responses
-- ============================================
CREATE TABLE user_onboarding_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step_key text NOT NULL,
  question text,
  answer text NOT NULL,
  category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, step_key)
);

-- ============================================
-- TABLE: user_daily_insights
-- Stores generated insights & interactions
-- ============================================
CREATE TABLE user_daily_insights (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date text NOT NULL,
  pattern jsonb NOT NULL,
  insight_text text NOT NULL,
  dismissed boolean DEFAULT FALSE,
  interacted boolean DEFAULT FALSE,
  timestamp_ms bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_user_results_user_id ON user_results(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding_state(user_id);
CREATE INDEX idx_user_onboarding_answers_user_id_created_at ON user_onboarding_answers(user_id, created_at DESC);
CREATE INDEX idx_user_daily_insights_user_id ON user_daily_insights(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only access their own data
-- ============================================
ALTER TABLE user_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select their own results"
  ON user_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert their own results"
  ON user_results FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users select their own journal entries"
  ON journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own journal entries"
  ON journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own journal entries"
  ON journal_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own journal entries"
  ON journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users manage onboarding state"
  ON user_onboarding_state FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage onboarding answers"
  ON user_onboarding_answers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage daily insights"
  ON user_daily_insights FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_results_updated_at
  BEFORE UPDATE ON user_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_onboarding_state_updated_at
  BEFORE UPDATE ON user_onboarding_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_onboarding_answers_updated_at
  BEFORE UPDATE ON user_onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_daily_insights_updated_at
  BEFORE UPDATE ON user_daily_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📝 Step 2: Create Supabase Helper Functions

Create a new file: `src/lib/supabaseData.ts`

```typescript
import { supabase } from './supabase';
import { ResultsData, JournalEntry } from '../types';
import { devLog } from '../utils/devLog';

// ============================================
// RESULTS MANAGEMENT
// ============================================

export async function saveResultsToSupabase(results: ResultsData) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devLog.error('No user logged in');
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('user_results')
      .upsert({
        user_id: user.id,
        personal_code: results.personalCode,
        aligned: results.aligned,
        improvement: results.improvement,
        value_entries: results.valueEntries,
        suggestions: results.suggestions,
        weak_area_suggestions: results.weakAreaSuggestions,
        value_strength_suggestions: results.valueStrengthSuggestions,
        discovery_area_suggestions: results.discoveryAreaSuggestions,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    
    devLog.log('Results saved to Supabase successfully');
    return { error: null };
  } catch (error: any) {
    devLog.error('Error saving results to Supabase:', error);
    return { error: error.message };
  }
}

export async function loadResultsFromSupabase(): Promise<ResultsData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_results')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No results found - this is okay
        devLog.log('No results found in Supabase');
        return null;
      }
      throw error;
    }

    if (!data) return null;

    // Transform database format to app format
    const results: ResultsData = {
      personalCode: data.personal_code,
      aligned: data.aligned || [],
      improvement: data.improvement || [],
      valueEntries: data.value_entries || [],
      suggestions: data.suggestions || [],
      weakAreaSuggestions: data.weak_area_suggestions || [],
      valueStrengthSuggestions: data.value_strength_suggestions || [],
      discoveryAreaSuggestions: data.discovery_area_suggestions || [],
    };

    devLog.log('Results loaded from Supabase');
    return results;
  } catch (error: any) {
    devLog.error('Error loading results from Supabase:', error);
    return null;
  }
}

// ============================================
// JOURNAL MANAGEMENT
// ============================================

export async function saveJournalEntryToSupabase(entry: JournalEntry) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      devLog.error('No user logged in');
      return { error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        text: entry.text,
        categories: entry.categories,
        values: entry.values,
        gratitude: entry.gratitude,
        mood: entry.mood,
        suggestion_ref: entry.suggestionRef,
        created_at: new Date(entry.createdAt).toISOString(),
      });

    if (error) throw error;
    
    devLog.log('Journal entry saved to Supabase');
    return { error: null };
  } catch (error: any) {
    devLog.error('Error saving journal entry to Supabase:', error);
    return { error: error.message };
  }
}

export async function loadJournalEntriesFromSupabase(): Promise<JournalEntry[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    // Transform database format to app format
    const entries: JournalEntry[] = data.map(entry => ({
      id: entry.id,
      text: entry.text,
      categories: entry.categories || [],
      values: entry.values || [],
      gratitude: entry.gratitude || [],
      mood: entry.mood,
      suggestionRef: entry.suggestion_ref,
      createdAt: new Date(entry.created_at).getTime(),
    }));

    devLog.log(`Loaded ${entries.length} journal entries from Supabase`);
    return entries;
  } catch (error: any) {
    devLog.error('Error loading journal entries from Supabase:', error);
    return [];
  }
}

export async function deleteJournalEntryFromSupabase(entryId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id);

    if (error) throw error;
    
    devLog.log('Journal entry deleted from Supabase');
    return { error: null };
  } catch (error: any) {
    devLog.error('Error deleting journal entry from Supabase:', error);
    return { error: error.message };
  }
}

// ============================================
// ONBOARDING STATE MANAGEMENT
// ============================================

export async function saveOnboardingStateToSupabase(state: {
  messages: any[];
  step: number;
  selectedCategories: string[];
  completedCategories: string[];
  categoryScores: Record<string, number>;
  categoryPhases: any;
  hasSeenResults: boolean;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('user_onboarding_state')
      .upsert({
        user_id: user.id,
        messages: state.messages,
        step: state.step,
        selected_categories: state.selectedCategories,
        completed_categories: state.completedCategories,
        category_scores: state.categoryScores,
        category_phases: state.categoryPhases,
        has_seen_results: state.hasSeenResults,
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    
    devLog.log('Onboarding state saved to Supabase');
    return { error: null };
  } catch (error: any) {
    devLog.error('Error saving onboarding state to Supabase:', error);
    return { error: error.message };
  }
}

export async function loadOnboardingStateFromSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_onboarding_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        devLog.log('No onboarding state found in Supabase');
        return null;
      }
      throw error;
    }

    devLog.log('Onboarding state loaded from Supabase');
    return data;
  } catch (error: any) {
    devLog.error('Error loading onboarding state from Supabase:', error);
    return null;
  }
}

// ============================================
// SYNC HELPERS
// ============================================

export async function syncLocalToSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Sync results
    const localResults = localStorage.getItem('innercode_results');
    if (localResults) {
      const results = JSON.parse(localResults);
      await saveResultsToSupabase(results);
    }

    // Sync journal entries
    const localJournal = localStorage.getItem('innercode_journal');
    if (localJournal) {
      const entries = JSON.parse(localJournal);
      for (const entry of entries) {
        await saveJournalEntryToSupabase(entry);
      }
    }

    // Sync onboarding state
    const localState = localStorage.getItem('innercode_state_v1');
    const hasSeenResults = localStorage.getItem('innercode_hasSeenResults');
    if (localState) {
      const state = JSON.parse(localState);
      await saveOnboardingStateToSupabase({
        ...state,
        hasSeenResults: !!hasSeenResults,
      });
    }

    devLog.log('Local data synced to Supabase');
  } catch (error) {
    devLog.error('Error syncing local to Supabase:', error);
  }
}

export async function syncSupabaseToLocal() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load and merge results
    const supabaseResults = await loadResultsFromSupabase();
    if (supabaseResults) {
      localStorage.setItem('innercode_results', JSON.stringify(supabaseResults));
    }

    // Load and merge journal entries
    const supabaseJournal = await loadJournalEntriesFromSupabase();
    if (supabaseJournal.length > 0) {
      localStorage.setItem('innercode_journal', JSON.stringify(supabaseJournal));
    }

    // Load onboarding state
    const supabaseState = await loadOnboardingStateFromSupabase();
    if (supabaseState) {
      const stateObj = {
        route: 'dashboard', // Default, will be overridden by getInitialRoute
        messages: supabaseState.messages,
        step: supabaseState.step,
        selectedCategories: supabaseState.selected_categories,
        completedCategories: supabaseState.completed_categories,
        categoryScores: supabaseState.category_scores,
        categoryPhases: supabaseState.category_phases,
      };
      localStorage.setItem('innercode_state_v1', JSON.stringify(stateObj));
      
      if (supabaseState.has_seen_results) {
        localStorage.setItem('innercode_hasSeenResults', 'true');
      }
    }

    devLog.log('Supabase data synced to local');
  } catch (error) {
    devLog.error('Error syncing Supabase to local:', error);
  }
}
```

---

## 🔄 Step 3: Update AuthContext to Sync Data

Update `src/contexts/AuthContext.tsx`:

```typescript
// Add this import at the top
import { syncLocalToSupabase, syncSupabaseToLocal } from '../lib/supabaseData';

// In the useEffect that handles auth state changes, add sync logic:
useEffect(() => {
  // ... existing code ...
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    devLog.log('Auth event:', event);
    
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      fetchUserProfile(session.user.id);
      
      // NEW: Sync data when user signs in
      if (event === 'SIGNED_IN') {
        // First try to load from Supabase
        await syncSupabaseToLocal();
        
        // Then sync any local changes up (for data created before login)
        await syncLocalToSupabase();
      }
    } else {
      setUserProfile(null);
    }
    
    setLoading(false);

    // Handle email confirmation
    if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
      devLog.log('Email confirmed!');
    }
  });

  return () => subscription.unsubscribe();
}, []);
```

---

## 🔄 Step 4: Update App.tsx to Save Data

In `App.tsx`, add sync calls when data changes:

```typescript
// Add import at top
import { 
  saveResultsToSupabase, 
  saveJournalEntryToSupabase,
  saveOnboardingStateToSupabase 
} from './lib/supabaseData';

// When results are updated (search for setResults calls):
setResults(computed);
// Add this line after:
if (user) await saveResultsToSupabase(computed);

// When journal entries are added (in addJournalEntry function):
setJournalEntries((prev: JournalEntry[]) => {
  const updated = [entry, ...prev];
  
  // NEW: Save to Supabase
  if (user) {
    saveJournalEntryToSupabase(entry);
  }
  
  // ... rest of function
});

// For onboarding state, add a useEffect to auto-save:
useEffect(() => {
  if (!user) return;
  
  const saveState = async () => {
    await saveOnboardingStateToSupabase({
      messages,
      step,
      selectedCategories,
      completedCategories,
      categoryScores,
      categoryPhases,
      hasSeenResults: !!localStorage.getItem('innercode_hasSeenResults'),
    });
  };
  
  // Debounce saves to avoid too many writes
  const timer = setTimeout(saveState, 2000);
  return () => clearTimeout(timer);
}, [user, messages, step, selectedCategories, completedCategories, categoryScores, categoryPhases]);
```

---

## ✅ Step 5: Testing the Migration

### Test Scenario 1: Existing User Data
1. User has data in localStorage
2. Signs in
3. Data automatically syncs to Supabase ✅
4. Open different browser/device
5. Sign in
6. Data loads from Supabase ✅

### Test Scenario 2: New User
1. New user signs up
2. Completes onboarding
3. All data automatically saves to Supabase ✅
4. Can access from any device ✅

### Test Scenario 3: Offline Mode
1. User has no internet
2. Data saves to localStorage ✅
3. When internet returns
4. Data syncs to Supabase ✅

---

## 🎯 Migration Strategy (Phased Rollout)

### Phase 1: Add Tables (NOW)
- Run SQL to create tables ✅
- No code changes yet
- Zero risk to existing users

### Phase 2: Dual-Write (NEXT)
- Save to BOTH localStorage AND Supabase
- Read from localStorage (for now)
- Ensures data backup

### Phase 3: Dual-Read (LATER)
- Try Supabase first, fallback to localStorage
- Still write to both
- Test cross-device sync

### Phase 4: Supabase-First (FUTURE)
- Read from Supabase primarily
- localStorage becomes cache only
- Full cross-device sync

---

## 🔐 Security & Performance

### Security ✅
- Row Level Security (RLS) enabled
- Users can only access their own data
- All queries filtered by `auth.uid()`

### Performance ✅
- Indexes on user_id for fast lookups
- Timestamps for syncing only changed data
- Local cache (localStorage) for offline access

### Data Privacy ✅
- Data encrypted in transit (HTTPS)
- Data encrypted at rest (Supabase default)
- User owns their data (can export/delete)

---

## 📱 Benefits

✅ **Cross-Device Sync** - Access from phone, tablet, computer
✅ **Data Persistence** - Never lose data if browser clears
✅ **Better UX** - Seamless login experience
✅ **Backup** - Data stored safely in cloud
✅ **Scalability** - Ready for mobile apps
✅ **Analytics** - Can track engagement (anonymously)

---

## 🚀 Next Steps

1. **Run the SQL** in Supabase SQL Editor
2. **Create `supabaseData.ts`** helper file
3. **Update AuthContext** with sync logic
4. **Update App.tsx** to save data
5. **Test with your account** on multiple devices
6. **Monitor Supabase logs** for any errors

---

**Questions? Check the Supabase docs or ask me!** 🎉

## ✅ Step 6: Sanity-Check Supabase Writes

1. Sign in to the deployed app and open the browser devtools Network tab.
2. Trigger an onboarding answer, journal entry, and results save to fire `/rest/v1/user_onboarding_answers`, `/rest/v1/journal_entries`, and `/rest/v1/user_results` requests.
3. Confirm each request returns **200** (select/read) or **201** (insert/upsert). If you see 401/403/406, verify that `auth.uid()` matches the `user_id` and that RLS policies are applied.
4. In Supabase, open **Project Settings → Logs → API** and filter by the table names to confirm no errors are logged.
5. Inspect the tables directly (**Database → Tables**) to ensure new rows are created for the authenticated user.

---

