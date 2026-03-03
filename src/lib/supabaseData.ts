import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { ResultsData, JournalEntry, DailyInsight, OnboardingAnswer, CheckInEntry, CategoryHistory } from '../types';
import { extractOnboardingAnswers } from '../utils/contextBuilders';
import { devLog } from '../utils/devLog';
import { safeGetItem, safeSetItem, safeRemoveItem, getSafeLocalStorage } from '../utils/helpers';

export interface SupabaseUserData {
  results: ResultsData | null;
  journalEntries: JournalEntry[];
  dailyInsights: DailyInsight[];
  onboardingState: any | null;
  onboardingAnswers: OnboardingAnswer[];
  sparkCompletions: Record<string, string[]>;
  checkInHistory: CheckInEntry[];
  categoryHistory: CategoryHistory[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function generateClientUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const r = Math.random() * 16 | 0;
    const v = char === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type OnboardingAnswerPayload = {
  stepKey: string;
  question?: string;
  response: string;
  category?: string;
};

type OnboardingStatePayload = {
  messages: any[];
  step: number;
  selectedCategories: string[];
  completedCategories: string[];
  categoryScores: Record<string, number>;
  categoryPhases: any;
  hasSeenResults: boolean;
  sparkCompletions?: Record<string, string[]>;
};

type OfflineOperation =
  | { type: 'saveResults'; payload: ResultsData }
  | { type: 'saveJournalEntry'; payload: JournalEntry }
  | { type: 'deleteJournalEntry'; payload: { entryId: string } }
  | { type: 'saveOnboardingAnswer'; payload: OnboardingAnswerPayload }
  | { type: 'saveOnboardingState'; payload: OnboardingStatePayload }
  | { type: 'saveDailyInsight'; payload: DailyInsight }
  | { type: 'updateDailyInsightStatus'; payload: { insightId: string; changes: Partial<Pick<DailyInsight, 'dismissed' | 'interacted'>> } }
  | { type: 'saveSparkCompletions'; payload: Record<string, string[]> }
  | { type: 'saveCheckInHistory'; payload: CheckInEntry[] }
  | { type: 'saveCategoryHistory'; payload: CategoryHistory[] };

const OFFLINE_QUEUE_KEY = 'innercode_offline_queue_v1';

const isNavigatorOffline = () => typeof navigator !== 'undefined' && !navigator.onLine;

const isNetworkError = (error: unknown) => error instanceof TypeError;

type SupabaseBrowserClient = SupabaseClient<any, 'public', any>;
let supabaseClientPromise: Promise<SupabaseBrowserClient> | null = null;

async function ensureSupabaseClient(): Promise<SupabaseBrowserClient> {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client is not available outside the browser environment.');
  }
  if (!supabaseClientPromise) {
    supabaseClientPromise = getSupabaseClient();
  }
  return supabaseClientPromise;
}

/**
 * Wraps a promise with a timeout to prevent infinite hanging
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => {
        devLog.warn(`Operation "${operationName}" timed out after ${timeoutMs}ms`);
        reject(new Error(`Operation "${operationName}" timed out after ${timeoutMs}ms`));
      }, timeoutMs)
    )
  ]);
}

async function withSupabase<T>(fn: (client: SupabaseBrowserClient) => Promise<T>): Promise<T> {
  const client = await ensureSupabaseClient();
  return fn(client);
}

function readOfflineQueue(): OfflineOperation[] {
  try {
    const raw = safeGetItem(OFFLINE_QUEUE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineOperation[]) : [];
  } catch (error) {
    devLog.error('Failed to read offline queue', error);
    return [];
  }
}

function writeOfflineQueue(queue: OfflineOperation[]) {
  try {
    safeSetItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    devLog.error('Failed to write offline queue', error);
  }
}

function enqueueOfflineOperation(operation: OfflineOperation) {
  const queue = readOfflineQueue();
  queue.push(operation);
  writeOfflineQueue(queue);
  devLog.warn('Queued offline operation', { type: operation.type });
}

// ============================================
// RESULTS MANAGEMENT
// ============================================

export async function saveResultsToSupabase(results: ResultsData, options: { skipQueue?: boolean } = {}) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveResults', payload: results });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
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
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveResults', payload: results });
        devLog.warn('saveResultsToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving results to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadResultsFromSupabase(): Promise<ResultsData | null> {
  return withSupabase(async (supabase) => {
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
          devLog.log('No results found in Supabase');
          return null;
        }
        throw error;
      }

      if (!data) return null;

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
  });
}

// ============================================
// JOURNAL MANAGEMENT
// ============================================

export async function saveJournalEntryToSupabase(entry: JournalEntry, options: { skipQueue?: boolean } = {}) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveJournalEntry', payload: entry });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        devLog.error('No user logged in');
        return { error: 'Not authenticated' };
      }

      const payload = {
        ...(isUuid(entry.id) ? { id: entry.id } : {}),
        user_id: user.id,
        text: entry.text,
        categories: entry.categories,
        values: entry.values,
        gratitude: entry.gratitude,
        mood: entry.mood,
        suggestion_ref: entry.suggestionRef,
        created_at: new Date(entry.createdAt).toISOString(),
      };

      const { error } = await supabase
        .from('journal_entries')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
      
      devLog.log('Journal entry saved to Supabase');
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveJournalEntry', payload: entry });
        devLog.warn('saveJournalEntryToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving journal entry to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadJournalEntriesFromSupabase(): Promise<JournalEntry[]> {
  return withSupabase(async (supabase) => {
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
  });
}

// ============================================
// DAILY INSIGHT MANAGEMENT
// ============================================

export async function upsertDailyInsightToSupabase(insight: DailyInsight, options: { skipQueue?: boolean } = {}) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveDailyInsight', payload: insight });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('user_daily_insights')
        .upsert({
          id: insight.id,
          user_id: user.id,
          date: insight.date,
          pattern: insight.pattern,
          insight_text: insight.text,
          dismissed: insight.dismissed,
          interacted: insight.interacted,
          timestamp_ms: insight.timestamp,
        }, {
          onConflict: 'id',
        });

      if (error) throw error;

      devLog.log('Daily insight upserted to Supabase');
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveDailyInsight', payload: insight });
        devLog.warn('upsertDailyInsightToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error upserting daily insight to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function updateDailyInsightStatusInSupabase(
  insightId: string,
  changes: Partial<Pick<DailyInsight, 'dismissed' | 'interacted'>>,
  options: { skipQueue?: boolean } = {}
) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'updateDailyInsightStatus', payload: { insightId, changes } });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      const payload: Record<string, boolean> = {};
      if (typeof changes.dismissed === 'boolean') {
        payload.dismissed = changes.dismissed;
      }
      if (typeof changes.interacted === 'boolean') {
        payload.interacted = changes.interacted;
      }

      if (Object.keys(payload).length === 0) {
        return { error: null };
      }

      const { error } = await supabase
        .from('user_daily_insights')
        .update(payload)
        .eq('id', insightId)
        .eq('user_id', user.id);

      if (error) throw error;

      devLog.log('Daily insight status updated in Supabase', { insightId, payload });
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'updateDailyInsightStatus', payload: { insightId, changes } });
        devLog.warn('updateDailyInsightStatusInSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error updating daily insight status in Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadDailyInsightsFromSupabase(): Promise<DailyInsight[]> {
  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_daily_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90);

      if (error) throw error;
      if (!data) return [];

      const insights: DailyInsight[] = data.map((row) => ({
        id: row.id,
        date: row.date,
        pattern: row.pattern,
        text: row.insight_text,
        dismissed: row.dismissed ?? false,
        interacted: row.interacted ?? false,
        timestamp: typeof row.timestamp_ms === 'number'
          ? row.timestamp_ms
          : new Date(row.created_at).getTime(),
      }));

      devLog.log(`Loaded ${insights.length} daily insights from Supabase`);
      return insights;
    } catch (error: any) {
      devLog.error('Error loading daily insights from Supabase:', error);
      return [];
    }
  });
}

export async function deleteJournalEntryFromSupabase(entryId: string, options: { skipQueue?: boolean } = {}) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'deleteJournalEntry', payload: { entryId } });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
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
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'deleteJournalEntry', payload: { entryId } });
        devLog.warn('deleteJournalEntryFromSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error deleting journal entry from Supabase:', error);
      return { error: error.message };
    }
  });
}

// ============================================
// ONBOARDING ANSWER MANAGEMENT
// ============================================

export async function upsertOnboardingAnswerToSupabase(answer: OnboardingAnswerPayload, options: { skipQueue?: boolean } = {}) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveOnboardingAnswer', payload: answer });
    return { data: undefined, error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }

      const payload = {
        user_id: user.id,
        step_key: answer.stepKey,
        question: answer.question ?? null,
        answer: answer.response,
        category: answer.category ?? null,
      };

      const { data, error } = await supabase
        .from('user_onboarding_answers')
        .upsert(payload, { onConflict: 'user_id, step_key' })
        .select('*')
        .limit(1);

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : undefined;
      if (!row) {
        return { error: null };
      }

      const mapped: OnboardingAnswer = {
        id: row.id,
        stepKey: row.step_key,
        question: row.question,
        answer: row.answer,
        category: row.category,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at ?? row.created_at).getTime(),
      };

      devLog.log('Onboarding answer saved to Supabase', { stepKey: answer.stepKey });
      return { data: mapped, error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveOnboardingAnswer', payload: answer });
        devLog.warn('upsertOnboardingAnswerToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving onboarding answer to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadOnboardingAnswersFromSupabase(): Promise<OnboardingAnswer[]> {
  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_onboarding_answers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      const answers: OnboardingAnswer[] = data.map((row: any) => ({
        id: row.id,
        stepKey: row.step_key,
        question: row.question,
        answer: row.answer,
        category: row.category,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at ?? row.created_at).getTime(),
      }));

      devLog.log(`Loaded ${answers.length} onboarding answers from Supabase`);
      return answers;
    } catch (error: any) {
      devLog.error('Error loading onboarding answers from Supabase:', error);
      return [];
    }
  });
}

// ============================================
// ONBOARDING STATE MANAGEMENT
// ============================================

export async function saveOnboardingStateToSupabase(state: OnboardingStatePayload, options: { skipQueue?: boolean } = {}) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveOnboardingState', payload: state });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'Not authenticated' };

      // CRITICAL FIX: Load existing state first to preserve spark_completions if not provided
      const { data: existingState, error: fetchError } = await supabase
        .from('user_onboarding_state')
        .select('spark_completions')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows found" which is fine for new users
        throw fetchError;
      }

      // Preserve existing spark_completions if not provided in state
      const sparkCompletionsToSave = state.sparkCompletions !== undefined
        ? state.sparkCompletions
        : (existingState?.spark_completions ?? null);

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
          spark_completions: sparkCompletionsToSave,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
      
      devLog.log('Onboarding state saved to Supabase');
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveOnboardingState', payload: state });
        devLog.warn('saveOnboardingStateToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving onboarding state to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadOnboardingStateFromSupabase() {
  return withSupabase(async (supabase) => {
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
  });
}

export async function saveSparkCompletionsToSupabase(
  completions: Record<string, string[]>,
  options: { skipQueue?: boolean } = {}
) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveSparkCompletions', payload: completions });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        devLog.error('saveSparkCompletionsToSupabase: No authenticated user');
        return { error: 'Not authenticated' };
      }

      const { data: existing, error: fetchError } = await supabase
        .from('user_onboarding_state')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase
          .from('user_onboarding_state')
          .update({ spark_completions: completions })
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_onboarding_state')
          .insert({
            user_id: user.id,
            spark_completions: completions,
          });
        if (error) throw error;
      }

      devLog.log('Spark completions saved to Supabase');
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveSparkCompletions', payload: completions });
        devLog.warn('saveSparkCompletionsToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving spark completions to Supabase:', error);
      return { error: error.message };
    }
  });
}

// ============================================
// CHECK-IN MANAGEMENT
// ============================================

export async function saveCheckInHistoryToSupabase(
  checkInHistory: CheckInEntry[],
  options: { skipQueue?: boolean } = {}
) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveCheckInHistory', payload: checkInHistory });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        devLog.error('No user logged in');
        return { error: 'Not authenticated' };
      }

      // CRITICAL FIX: Load existing state first to preserve other fields
      const { data: existingState, error: fetchError } = await supabase
        .from('user_onboarding_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows found" which is fine for new users
        throw fetchError;
      }

      // Merge check-in history with existing state, preserving all other fields
      const { error } = await supabase
        .from('user_onboarding_state')
        .upsert({
          user_id: user.id,
          // Preserve existing fields if they exist
          messages: existingState?.messages ?? [],
          step: existingState?.step ?? 0,
          selected_categories: existingState?.selected_categories ?? [],
          completed_categories: existingState?.completed_categories ?? [],
          category_scores: existingState?.category_scores ?? {},
          category_phases: existingState?.category_phases ?? {},
          has_seen_results: existingState?.has_seen_results ?? false,
          spark_completions: existingState?.spark_completions ?? null, // Preserve sparks!
          category_history: existingState?.category_history ?? [], // Preserve category history
          // Update only the check-in history
          check_in_history: checkInHistory,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      devLog.log('Check-in history saved to Supabase');
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveCheckInHistory', payload: checkInHistory });
        devLog.warn('saveCheckInHistoryToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving check-in history to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadCheckInHistoryFromSupabase(): Promise<CheckInEntry[]> {
  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_onboarding_state')
        .select('check_in_history')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found
          return [];
        }
        throw error;
      }

      if (!data?.check_in_history) {
        return [];
      }

      // Ensure it's an array
      const history = Array.isArray(data.check_in_history) ? data.check_in_history : [];
      return history as CheckInEntry[];
    } catch (error) {
      devLog.error('Error loading check-in history from Supabase:', error);
      return [];
    }
  });
}

export async function saveCategoryHistoryToSupabase(
  categoryHistory: CategoryHistory[],
  options: { skipQueue?: boolean } = {}
) {
  if (!options.skipQueue && isNavigatorOffline()) {
    enqueueOfflineOperation({ type: 'saveCategoryHistory', payload: categoryHistory });
    return { error: 'offline' };
  }

  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        devLog.error('No user logged in');
        return { error: 'Not authenticated' };
      }

      // CRITICAL FIX: Load existing state first to preserve other fields
      const { data: existingState, error: fetchError } = await supabase
        .from('user_onboarding_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows found" which is fine for new users
        throw fetchError;
      }

      // Merge category history with existing state, preserving all other fields
      const { error } = await supabase
        .from('user_onboarding_state')
        .upsert({
          user_id: user.id,
          // Preserve existing fields if they exist
          messages: existingState?.messages ?? [],
          step: existingState?.step ?? 0,
          selected_categories: existingState?.selected_categories ?? [],
          completed_categories: existingState?.completed_categories ?? [],
          category_scores: existingState?.category_scores ?? {},
          category_phases: existingState?.category_phases ?? {},
          has_seen_results: existingState?.has_seen_results ?? false,
          spark_completions: existingState?.spark_completions ?? null, // Preserve sparks!
          check_in_history: existingState?.check_in_history ?? [], // Preserve check-in history
          // Update only the category history
          category_history: categoryHistory,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      devLog.log('Category history saved to Supabase');
      return { error: null };
    } catch (error: any) {
      if (!options.skipQueue && isNetworkError(error)) {
        enqueueOfflineOperation({ type: 'saveCategoryHistory', payload: categoryHistory });
        devLog.warn('saveCategoryHistoryToSupabase: network issue detected, queued for retry');
        return { error: 'offline' };
      }

      devLog.error('Error saving category history to Supabase:', error);
      return { error: error.message };
    }
  });
}

export async function loadCategoryHistoryFromSupabase(): Promise<CategoryHistory[]> {
  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('user_onboarding_state')
        .select('category_history')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row found
          return [];
        }
        throw error;
      }

      if (!data?.category_history) {
        return [];
      }

      // Ensure it's an array
      const history = Array.isArray(data.category_history) ? data.category_history : [];
      return history as CategoryHistory[];
    } catch (error) {
      devLog.error('Error loading category history from Supabase:', error);
      return [];
    }
  });
}

// ============================================
// SYNC HELPERS
// ============================================

export async function syncLocalToSupabase() {
  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const localResults = safeGetItem('innercode_results');
      if (localResults) {
        const results = JSON.parse(localResults);
        await saveResultsToSupabase(results);
      }

      const localJournal = safeGetItem('innercode_journal');
      if (localJournal) {
        try {
          const parsed = JSON.parse(localJournal);
          if (Array.isArray(parsed)) {
            const normalized: JournalEntry[] = [];
            let mutated = false;

            for (const rawEntry of parsed) {
              if (!rawEntry) continue;

              const normalizedEntry: JournalEntry = {
                ...rawEntry,
                id: isUuid(rawEntry.id) ? rawEntry.id : generateClientUuid(),
                createdAt: typeof rawEntry.createdAt === 'number' ? rawEntry.createdAt : Date.now(),
              };

              if (normalizedEntry.id !== rawEntry.id) {
                mutated = true;
              }

              await saveJournalEntryToSupabase(normalizedEntry);
              normalized.push(normalizedEntry);
            }

            if (mutated) {
              safeSetItem('innercode_journal', JSON.stringify(normalized));
            }
          }
        } catch (error) {
          devLog.error('Error syncing local journal entries to Supabase:', error);
        }
      }

      const localSparkCompletions = safeGetItem('innercode_daily_actions');
      if (localSparkCompletions) {
        try {
          const parsed = JSON.parse(localSparkCompletions);
          if (parsed && typeof parsed === 'object') {
            await saveSparkCompletionsToSupabase(parsed);
          }
        } catch (error) {
          devLog.error('Error syncing spark completions to Supabase:', error);
        }
      }

      const localInsights = safeGetItem('innercode_daily_insights');
      if (localInsights) {
        try {
          const parsed = JSON.parse(localInsights);
          const insights: DailyInsight[] = Array.isArray(parsed?.insights) ? parsed.insights : [];
          for (const insight of insights) {
            await upsertDailyInsightToSupabase(insight);
          }
        } catch (error) {
          devLog.error('Error syncing local insights to Supabase:', error);
        }
      }

      // Sync check-in history
      const localCheckIns = safeGetItem('innercode_checkins');
      if (localCheckIns) {
        try {
          const parsed = JSON.parse(localCheckIns);
          if (Array.isArray(parsed) && parsed.length > 0) {
            await saveCheckInHistoryToSupabase(parsed);
          }
        } catch (error) {
          devLog.error('Error syncing check-in history to Supabase:', error);
        }
      }

      // Sync category history
      const localCategoryHistory = safeGetItem('innercode_category_history');
      if (localCategoryHistory) {
        try {
          const parsed = JSON.parse(localCategoryHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            await saveCategoryHistoryToSupabase(parsed);
          }
        } catch (error) {
          devLog.error('Error syncing category history to Supabase:', error);
        }
      }

      const legacySyncKey = 'innercode_onboarding_answers_synced_v1';
      const localState = safeGetItem('innercode_state_v1');
      const hasSeenResults = safeGetItem('innercode_hasSeenResults');
      let parsedState: any = null;
      if (localState) {
        try {
          parsedState = JSON.parse(localState);
        } catch (error) {
          devLog.error('Failed to parse onboarding state snapshot for sync:', error);
        }
      }

      if (parsedState && !safeGetItem(legacySyncKey)) {
        try {
          const legacyAnswers = extractOnboardingAnswers(parsedState.messages ?? []);
          for (let index = 0; index < legacyAnswers.length; index += 1) {
            const answerText = legacyAnswers[index];
            if (!answerText) continue;
            await upsertOnboardingAnswerToSupabase({
              stepKey: `legacy-${index + 1}`,
              response: answerText,
            });
          }
          safeSetItem(legacySyncKey, 'true');
          devLog.log('Migrated legacy onboarding answers to Supabase', { count: legacyAnswers.length });
        } catch (error) {
          devLog.error('Failed to migrate legacy onboarding answers:', error);
        }
      }

      if (parsedState) {
        await saveOnboardingStateToSupabase({
          ...parsedState,
          hasSeenResults: !!hasSeenResults,
        });
      }

      devLog.log('Local data synced to Supabase');
    } catch (error) {
      devLog.error('Error syncing local to Supabase:', error);
    }
  });
}

export async function syncSupabaseToLocal() {
  return withSupabase(async (supabase) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const supabaseResults = await loadResultsFromSupabase();
      if (supabaseResults) {
        safeSetItem('innercode_results', JSON.stringify(supabaseResults));
      } else {
        safeRemoveItem('innercode_results');
      }

      const supabaseJournal = await loadJournalEntriesFromSupabase();
      // CRITICAL FIX: Always merge, never remove local entries
      // Even if Supabase is empty, preserve local entries (they might not have synced yet)
      try {
        const localJournalRaw = safeGetItem('innercode_journal');
        const localJournal = localJournalRaw ? JSON.parse(localJournalRaw) : [];
        const mergedMap = new Map<string, JournalEntry>();

        // Add Supabase entries first (they take precedence if there are duplicates)
        supabaseJournal.forEach((entry) => {
          mergedMap.set(entry.id, entry);
        });

        // Always add local entries that aren't in Supabase (preserve local-only entries)
        if (Array.isArray(localJournal)) {
          localJournal.forEach((entry: JournalEntry) => {
            if (!mergedMap.has(entry.id)) {
              mergedMap.set(entry.id, entry);
            }
          });
        }

        const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
        safeSetItem('innercode_journal', JSON.stringify(merged));
        devLog.log(`Merged journal entries: ${supabaseJournal.length} from Supabase, ${localJournal.length} local, ${merged.length} total`);
      } catch (error) {
        devLog.error('Error merging journal entries from Supabase:', error);
        // Don't overwrite local journal on error - preserve what we have
      }

      const supabaseInsights = await loadDailyInsightsFromSupabase();
      if (supabaseInsights.length > 0) {
        safeSetItem('innercode_daily_insights', JSON.stringify({ insights: supabaseInsights }));
      } else {
        safeRemoveItem('innercode_daily_insights');
      }

      const supabaseState = await loadOnboardingStateFromSupabase();
      if (supabaseState) {
        const stateObj = {
          route: 'dashboard',
          messages: supabaseState.messages,
          step: supabaseState.step,
          selectedCategories: supabaseState.selected_categories,
          completedCategories: supabaseState.completed_categories,
          categoryScores: supabaseState.category_scores,
          categoryPhases: supabaseState.category_phases,
        };
        safeSetItem('innercode_state_v1', JSON.stringify(stateObj));
        
        if (supabaseState.has_seen_results) {
          safeSetItem('innercode_hasSeenResults', 'true');
        } else {
          safeRemoveItem('innercode_hasSeenResults');
        }

        // CRITICAL FIX: Merge spark completions instead of overwriting
        if (supabaseState.spark_completions && typeof supabaseState.spark_completions === 'object') {
          const localSparkCompletionsRaw = safeGetItem('innercode_daily_actions');
          const localSparkCompletions = localSparkCompletionsRaw ? JSON.parse(localSparkCompletionsRaw) : {};
          // Merge remote and local (remote takes precedence for same day keys)
          const merged = { ...localSparkCompletions, ...supabaseState.spark_completions };
          safeSetItem('innercode_daily_actions', JSON.stringify(merged));
          devLog.log('Merged spark completions from Supabase');
        } else {
          // Don't remove local spark completions if remote doesn't have them
          // They might not have synced yet
        }

        // CRITICAL FIX: Merge check-in history instead of overwriting
        if (supabaseState.check_in_history && Array.isArray(supabaseState.check_in_history)) {
          const localCheckInsRaw = safeGetItem('innercode_checkins');
          const localCheckIns = localCheckInsRaw ? JSON.parse(localCheckInsRaw) : [];
          // Merge arrays, removing duplicates by ID or date
          const merged = [...supabaseState.check_in_history];
          localCheckIns.forEach((local: any) => {
            if (!merged.find((r: any) => r.id === local.id || r.date === local.date)) {
              merged.push(local);
            }
          });
          safeSetItem('innercode_checkins', JSON.stringify(merged));
          devLog.log('Merged check-in history from Supabase');
        } else {
          // Don't remove local check-ins if remote doesn't have them
        }

        // CRITICAL FIX: Merge category history instead of overwriting
        if (supabaseState.category_history && Array.isArray(supabaseState.category_history)) {
          const localCategoryHistoryRaw = safeGetItem('innercode_category_history');
          const localCategoryHistory = localCategoryHistoryRaw ? JSON.parse(localCategoryHistoryRaw) : [];
          // Merge arrays, removing duplicates by ID or date
          const merged = [...supabaseState.category_history];
          localCategoryHistory.forEach((local: any) => {
            if (!merged.find((r: any) => r.id === local.id || r.date === local.date)) {
              merged.push(local);
            }
          });
          safeSetItem('innercode_category_history', JSON.stringify(merged));
          devLog.log('Merged category history from Supabase');
        } else {
          // Don't remove local category history if remote doesn't have them
        }
      } else {
        safeRemoveItem('innercode_state_v1');
        safeRemoveItem('innercode_hasSeenResults');
        safeRemoveItem('innercode_daily_actions');
        safeRemoveItem('innercode_checkins');
        safeRemoveItem('innercode_category_history');
      }

      // Also load check-in and category history separately if not in onboarding state
      // CRITICAL FIX: Merge instead of overwrite
      const supabaseCheckIns = await loadCheckInHistoryFromSupabase();
      if (supabaseCheckIns.length > 0) {
        const localCheckInsRaw = safeGetItem('innercode_checkins');
        const localCheckIns = localCheckInsRaw ? JSON.parse(localCheckInsRaw) : [];
        // Merge arrays, removing duplicates by ID or date
        const merged = [...supabaseCheckIns];
        localCheckIns.forEach((local: any) => {
          if (!merged.find((r: any) => r.id === local.id || r.date === local.date)) {
            merged.push(local);
          }
        });
        safeSetItem('innercode_checkins', JSON.stringify(merged));
      }

      const supabaseCategoryHistory = await loadCategoryHistoryFromSupabase();
      if (supabaseCategoryHistory.length > 0) {
        const localCategoryHistoryRaw = safeGetItem('innercode_category_history');
        const localCategoryHistory = localCategoryHistoryRaw ? JSON.parse(localCategoryHistoryRaw) : [];
        // Merge arrays, removing duplicates by ID or date
        const merged = [...supabaseCategoryHistory];
        localCategoryHistory.forEach((local: any) => {
          if (!merged.find((r: any) => r.id === local.id || r.date === local.date)) {
            merged.push(local);
          }
        });
        safeSetItem('innercode_category_history', JSON.stringify(merged));
      }

      devLog.log('Supabase data synced to local');
    } catch (error) {
      devLog.error('Error syncing Supabase to local:', error);
    }
  });
}

export async function processOfflineQueue() {
  const queue = readOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  const remaining: OfflineOperation[] = [];

  for (const operation of queue) {
    try {
      switch (operation.type) {
        case 'saveResults':
          await saveResultsToSupabase(operation.payload, { skipQueue: true });
          break;
        case 'saveJournalEntry':
          await saveJournalEntryToSupabase(operation.payload, { skipQueue: true });
          break;
        case 'deleteJournalEntry':
          await deleteJournalEntryFromSupabase(operation.payload.entryId, { skipQueue: true });
          break;
        case 'saveOnboardingAnswer':
          await upsertOnboardingAnswerToSupabase(operation.payload, { skipQueue: true });
          break;
        case 'saveOnboardingState':
          await saveOnboardingStateToSupabase(operation.payload, { skipQueue: true });
          break;
        case 'saveDailyInsight':
          await upsertDailyInsightToSupabase(operation.payload, { skipQueue: true });
          break;
        case 'updateDailyInsightStatus':
          await updateDailyInsightStatusInSupabase(operation.payload.insightId, operation.payload.changes, { skipQueue: true });
          break;
      case 'saveSparkCompletions':
        await saveSparkCompletionsToSupabase(operation.payload, { skipQueue: true });
        break;
      case 'saveCheckInHistory':
        await saveCheckInHistoryToSupabase(operation.payload, { skipQueue: true });
        break;
      case 'saveCategoryHistory':
        await saveCategoryHistoryToSupabase(operation.payload, { skipQueue: true });
        break;
        default:
          devLog.warn('Unknown offline operation discarded', operation);
      }
    } catch (error) {
      if (isNavigatorOffline() || isNetworkError(error)) {
        remaining.push(operation);
        devLog.warn('Offline operation deferred', { type: operation.type, error });
      } else {
        devLog.error('Offline operation failed permanently', { type: operation.type, error });
      }
    }
  }

  writeOfflineQueue(remaining);
}

export const EMPTY_SUPABASE_USER_DATA: SupabaseUserData = {
  results: null,
  journalEntries: [],
  dailyInsights: [],
  onboardingState: null,
  onboardingAnswers: [],
  sparkCompletions: {},
  checkInHistory: [],
  categoryHistory: [],
};

export async function fetchSupabaseUserData(): Promise<SupabaseUserData> {
  try {
    // Wrap the entire operation with a 15-second timeout to prevent infinite loading
    return await withTimeout(
      withSupabase(async (supabase) => {
        try {
          const { data } = await supabase.auth.getUser();
          if (!data?.user) {
            return EMPTY_SUPABASE_USER_DATA;
          }

          // Wrap each individual load operation with timeout (10 seconds each)
          // Add .catch() to each to prevent one failure from breaking everything
          const [
            results,
            journalEntries,
            dailyInsights,
            onboardingState,
            onboardingAnswers,
            checkInHistory,
            categoryHistory,
          ] = await Promise.all([
            withTimeout(loadResultsFromSupabase(), 10000, 'loadResultsFromSupabase').catch(() => null),
            withTimeout(loadJournalEntriesFromSupabase(), 10000, 'loadJournalEntriesFromSupabase').catch(() => []),
            withTimeout(loadDailyInsightsFromSupabase(), 10000, 'loadDailyInsightsFromSupabase').catch(() => []),
            withTimeout(loadOnboardingStateFromSupabase(), 10000, 'loadOnboardingStateFromSupabase').catch(() => null),
            withTimeout(loadOnboardingAnswersFromSupabase(), 10000, 'loadOnboardingAnswersFromSupabase').catch(() => []),
            withTimeout(loadCheckInHistoryFromSupabase(), 10000, 'loadCheckInHistoryFromSupabase').catch(() => []),
            withTimeout(loadCategoryHistoryFromSupabase(), 10000, 'loadCategoryHistoryFromSupabase').catch(() => []),
          ]);

          return {
            results,
            journalEntries,
            dailyInsights,
            onboardingState,
            onboardingAnswers,
            sparkCompletions: (onboardingState?.spark_completions && typeof onboardingState.spark_completions === 'object')
              ? onboardingState.spark_completions
              : {},
            checkInHistory: checkInHistory || [],
            categoryHistory: categoryHistory || [],
          };
        } catch (error) {
          devLog.error('fetchSupabaseUserData: Failed to load user data', error);
          return EMPTY_SUPABASE_USER_DATA;
        }
      }),
      30000, // 30s timeout when Supabase is slow
      'fetchSupabaseUserData'
    );
  } catch (error) {
    // Explicitly catch timeout errors and return empty data
    if (error instanceof Error && error.message.includes('timed out')) {
      devLog.warn('fetchSupabaseUserData: Operation timed out, returning empty data');
      return EMPTY_SUPABASE_USER_DATA;
    }
    devLog.error('fetchSupabaseUserData: Unexpected error', error);
    return EMPTY_SUPABASE_USER_DATA;
  }
}

