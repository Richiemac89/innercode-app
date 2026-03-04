import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, UserProfile } from '../lib/supabase';
import { fetchSupabaseUserData, SupabaseUserData, EMPTY_SUPABASE_USER_DATA, processOfflineQueue, syncLocalToSupabase, syncSupabaseToLocal, getGoalsFromLocalStorage, setGoalsInLocalStorage } from '../lib/supabaseData';
import { devLog } from '../utils/devLog';
import { safeGetItem, safeSetItem, safeRemoveItem, getSafeLocalStorage } from '../utils/helpers';

type HydrationStatus = 'idle' | 'cache' | 'remote' | 'error';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  syncComplete: boolean;
  hydrationStatus: HydrationStatus;
  userData: SupabaseUserData;
  refreshUserData: () => Promise<SupabaseUserData>;
  signUp: (email: string, password: string, firstName: string, lastName: string, country: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  /** Synchronous clear of all app + Supabase auth data and redirect to /. Use when async signOut may hang. */
  forceLogoutAndRedirect: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readLocalSupabaseUserData(): SupabaseUserData | null {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const resultsRaw = storage.getItem('innercode_results');
    const journalRaw = storage.getItem('innercode_journal');
    const insightsRaw = storage.getItem('innercode_daily_insights');
    const onboardingStateRaw = storage.getItem('innercode_state_v1');
    const hasSeenResultsRaw = storage.getItem('innercode_hasSeenResults');
    const sparkCompletionsRaw = storage.getItem('innercode_daily_actions');

    const results = resultsRaw ? JSON.parse(resultsRaw) : null;

    const parsedJournal = journalRaw ? JSON.parse(journalRaw) : [];
    const journalEntries = Array.isArray(parsedJournal) ? parsedJournal : [];

    let dailyInsights: any[] = [];
    if (insightsRaw) {
      try {
        const parsedInsights = JSON.parse(insightsRaw);
        dailyInsights = Array.isArray(parsedInsights?.insights)
          ? parsedInsights.insights
          : Array.isArray(parsedInsights)
            ? parsedInsights
            : [];
      } catch (error) {
        devLog.error('Failed to parse local daily insights cache', error);
      }
    }

    let onboardingState: any = null;
    if (onboardingStateRaw) {
      try {
        const parsedState = JSON.parse(onboardingStateRaw);
        if (parsedState && typeof parsedState === 'object') {
          onboardingState = {
            messages: parsedState.messages ?? [],
            step: parsedState.step ?? 0,
            selected_categories: parsedState.selectedCategories ?? [],
            completed_categories: parsedState.completedCategories ?? [],
            category_scores: parsedState.categoryScores ?? {},
            category_phases: parsedState.categoryPhases ?? {},
            has_seen_results: hasSeenResultsRaw === 'true',
          };
        }
      } catch (error) {
        devLog.error('Failed to parse local onboarding state cache', error);
      }
    } else if (hasSeenResultsRaw === 'true') {
      onboardingState = { has_seen_results: true };
    }

    let sparkCompletions: Record<string, string[]> = {};
    if (sparkCompletionsRaw) {
      try {
        const parsedCompletions = JSON.parse(sparkCompletionsRaw);
        if (parsedCompletions && typeof parsedCompletions === 'object') {
          sparkCompletions = parsedCompletions;
        }
      } catch (error) {
        devLog.error('Failed to parse local spark completions cache', error);
      }
    }

    const hasAnyData =
      !!results ||
      journalEntries.length > 0 ||
      dailyInsights.length > 0 ||
      !!onboardingState ||
      Object.keys(sparkCompletions).length > 0;

    if (!hasAnyData) {
      return null;
    }

    return {
      results,
      journalEntries,
      dailyInsights,
      onboardingState,
      onboardingAnswers: [],
      sparkCompletions,
      checkInHistory: [],
      categoryHistory: [],
      goals: getGoalsFromLocalStorage(),
    };
  } catch (error) {
    devLog.error('Failed to read local cache for Supabase fallback', error);
    return null;
  }
}

const initialPendingVerification = safeGetItem('innercode_pendingVerification') === 'true';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncComplete, setSyncComplete] = useState(false);
  const [hydrationStatus, setHydrationStatus] = useState<HydrationStatus>('idle');
  const [userData, setUserData] = useState<SupabaseUserData>(EMPTY_SUPABASE_USER_DATA);
  const hasSyncedInitialData = useRef(false);
  const hasPendingVerification = useRef(initialPendingVerification);

  const cacheUserDataLocally = useCallback((data: SupabaseUserData | null) => {
    try {
      if (!data) {
        safeRemoveItem('innercode_results');
        safeRemoveItem('innercode_journal');
        safeRemoveItem('innercode_daily_insights');
        safeRemoveItem('innercode_state_v1');
        safeRemoveItem('innercode_hasSeenResults');
        safeRemoveItem('innercode_pendingReveal');
        safeRemoveItem('innercode_daily_actions');
        safeRemoveItem('innercode_goals');
        return;
      }

      const { results, journalEntries, dailyInsights, onboardingState, sparkCompletions, goals } = data;

      // CRITICAL FIX: Only update localStorage if we have data
      // Don't remove existing data if remote is empty (it might not have synced yet)
      if (results) {
        safeSetItem('innercode_results', JSON.stringify(results));
      }
      // Don't remove if results is null - preserve existing localStorage data

      // CRITICAL FIX: Always merge journal entries, never remove
      // Even if remote is empty, preserve local entries
      if (journalEntries.length > 0) {
        safeSetItem('innercode_journal', JSON.stringify(journalEntries));
      } else {
        // Don't remove - check if local has data first
        const localJournal = safeGetItem('innercode_journal');
        if (!localJournal) {
          // Only remove if local is also empty
          safeRemoveItem('innercode_journal');
        }
        // Otherwise, keep local data
      }

      if (dailyInsights.length > 0) {
        safeSetItem('innercode_daily_insights', JSON.stringify({ insights: dailyInsights }));
      } else {
        safeRemoveItem('innercode_daily_insights');
      }

      // CRITICAL FIX: Preserve spark completions, don't remove if remote is empty
      // Local data might not have synced yet
      if (sparkCompletions && Object.keys(sparkCompletions).length > 0) {
        safeSetItem('innercode_daily_actions', JSON.stringify(sparkCompletions));
      } else {
        // Don't remove - check if local has data first
        const localSparkCompletions = safeGetItem('innercode_daily_actions');
        if (!localSparkCompletions) {
          // Only remove if local is also empty
          safeRemoveItem('innercode_daily_actions');
        }
        // Otherwise, keep local data
      }

      if (goals && goals.length > 0) {
        setGoalsInLocalStorage(goals);
      }

      if (onboardingState) {
        const stateObj = {
          messages: onboardingState.messages ?? [],
          step: onboardingState.step ?? 0,
          selected_categories: onboardingState.selected_categories ?? [],
          completed_categories: onboardingState.completed_categories ?? [],
          category_scores: onboardingState.category_scores ?? {},
          category_phases: onboardingState.category_phases ?? {},
          has_seen_results: onboardingState.has_seen_results ?? false,
        };

        const hasOnboardingProgress =
          stateObj.has_seen_results ||
          (Array.isArray(stateObj.selected_categories) && stateObj.selected_categories.length > 0) ||
          (Array.isArray(stateObj.completed_categories) && stateObj.completed_categories.length > 0) ||
          (Array.isArray(stateObj.messages) && stateObj.messages.length > 0) ||
          (typeof stateObj.step === 'number' && stateObj.step > 0);

        if (hasOnboardingProgress) {
          safeSetItem('innercode_state_v1', JSON.stringify(stateObj));

          if (stateObj.has_seen_results) {
            safeSetItem('innercode_hasSeenResults', 'true');
          } else {
            safeRemoveItem('innercode_hasSeenResults');
          }
        }
      } else {
        safeRemoveItem('innercode_state_v1');
        safeRemoveItem('innercode_hasSeenResults');
      }

      safeRemoveItem('innercode_pendingReveal');
    } catch (error) {
      devLog.error('Failed to cache Supabase user data locally', error);
    }
  }, []);

  const clearCachedUserData = useCallback(() => {
    cacheUserDataLocally(null);
  }, [cacheUserDataLocally]);

  const markPendingVerification = useCallback(() => {
    hasPendingVerification.current = true;
    safeSetItem('innercode_pendingVerification', 'true');
  }, []);

  const clearPendingVerification = useCallback(() => {
    if (!hasPendingVerification.current) {
      return;
    }
    hasPendingVerification.current = false;
    safeRemoveItem('innercode_pendingVerification');
  }, []);

  const loadUserData = useCallback(async (): Promise<SupabaseUserData> => {
    // CRITICAL FIX: Only reset syncComplete if it's not already set
    // This prevents clearing syncComplete when called from background after initial load
    setSyncComplete((prev) => {
      // Only reset if we're starting fresh (prev is false)
      // If it's already true, keep it true (data is loading in background)
      return prev ? prev : false;
    });
    setHydrationStatus('idle');
    const localSnapshot = readLocalSupabaseUserData();
    if (localSnapshot) {
      setUserData(localSnapshot);
      setHydrationStatus('cache');
    }
    try {
      let data = await fetchSupabaseUserData();

      // Prefer remote goals; fall back to local if remote is empty (e.g. before column exists or offline)
      data = { ...data, goals: (data.goals?.length ? data.goals : getGoalsFromLocalStorage()) };

      const hasRemoteData =
        !!data.results ||
        data.journalEntries.length > 0 ||
        data.dailyInsights.length > 0 ||
        !!data.onboardingState ||
        data.onboardingAnswers.length > 0 ||
        Object.keys(data.sparkCompletions ?? {}).length > 0;

      if (!hasRemoteData && typeof window !== 'undefined') {
        const hasLocalResults = !!safeGetItem('innercode_results');
        const hasLocalState = !!safeGetItem('innercode_state_v1');
        const hasLocalJournal = !!safeGetItem('innercode_journal');
        const hasLocalInsights = !!safeGetItem('innercode_daily_insights');

        if (hasLocalResults || hasLocalState || hasLocalJournal || hasLocalInsights) {
          devLog.log('No remote data detected, attempting to sync local cache to Supabase');
          try {
            await syncLocalToSupabase();
            data = await fetchSupabaseUserData();

            const hasRemoteAfterSync =
              !!data.results ||
              data.journalEntries.length > 0 ||
              data.dailyInsights.length > 0 ||
              !!data.onboardingState ||
              data.onboardingAnswers.length > 0 ||
              Object.keys(data.sparkCompletions ?? {}).length > 0;

            if (!hasRemoteAfterSync) {
              devLog.warn('Remote data still empty after sync; hydrating from local cache');
              const localFallback = readLocalSupabaseUserData();
              const fallbackData = localFallback ?? EMPTY_SUPABASE_USER_DATA;
              setUserData(fallbackData);
              cacheUserDataLocally(localFallback ?? null);
              if (localFallback?.results || localFallback?.onboardingState) {
                clearPendingVerification();
              }
              setSyncComplete(true);
              setHydrationStatus('cache');
              return fallbackData;
            }
          } catch (syncError) {
            devLog.error('Failed to sync local cache to Supabase before hydration', syncError);
            const localFallback = readLocalSupabaseUserData();
            if (localFallback) {
              devLog.log('Applying local cache fallback after sync failure');
              setUserData(localFallback);
              cacheUserDataLocally(localFallback);
              if (localFallback.results || localFallback.onboardingState) {
                clearPendingVerification();
              }
              setSyncComplete(true);
              setHydrationStatus('cache');
              return localFallback;
            }
            const emptyData = EMPTY_SUPABASE_USER_DATA;
            setUserData(emptyData);
            cacheUserDataLocally(null);
            setSyncComplete(true);
            setHydrationStatus('error');
            return emptyData;
          }
        }
      }

      const hasDataAfterSync =
        !!data.results ||
        data.journalEntries.length > 0 ||
        data.dailyInsights.length > 0 ||
        !!data.onboardingState ||
        data.onboardingAnswers.length > 0;

      let finalData = data;
      if (!hasDataAfterSync) {
        const localFallback = readLocalSupabaseUserData();
        if (localFallback) {
          devLog.log('Using local cache as fallback while Supabase data initializes');
          finalData = localFallback;
        } else {
          finalData = EMPTY_SUPABASE_USER_DATA;
        }
      }

      setUserData(finalData);
      cacheUserDataLocally(finalData);
      
      // Immediately sync check-in data to localStorage so getCheckInHistorySync() can read it
      if (finalData.checkInHistory && finalData.checkInHistory.length > 0) {
        safeSetItem('innercode_checkins', JSON.stringify(finalData.checkInHistory));
      }
      if (finalData.categoryHistory && finalData.categoryHistory.length > 0) {
        safeSetItem('innercode_category_history', JSON.stringify(finalData.categoryHistory));
      }
      
      devLog.log('User data hydration complete', {
        source: finalData === data ? 'supabase' : 'local-fallback',
      });
      processOfflineQueue().catch((error) => {
        devLog.error('Failed to process offline queue after sync', error);
      });
      if (finalData.results || finalData.onboardingState) {
        clearPendingVerification();
      }
      setHydrationStatus(finalData === data ? 'remote' : 'cache');
      return finalData;
    } catch (error) {
      devLog.error('Failed to load Supabase user data', error);
      
      // Check if it's a timeout error
      const isTimeout = error instanceof Error && error.message.includes('timed out');
      
      // Use local cache if available, even on timeout
      const localFallback = readLocalSupabaseUserData();
      if (localFallback) {
        devLog.log('Using local cache after timeout/error');
        setUserData(localFallback);
        cacheUserDataLocally(localFallback);
        
        // Sync check-in data to localStorage from local cache
        if (localFallback.checkInHistory && localFallback.checkInHistory.length > 0) {
          safeSetItem('innercode_checkins', JSON.stringify(localFallback.checkInHistory));
        }
        if (localFallback.categoryHistory && localFallback.categoryHistory.length > 0) {
          safeSetItem('innercode_category_history', JSON.stringify(localFallback.categoryHistory));
        }
        
        if (localFallback.results || localFallback.onboardingState) {
          clearPendingVerification();
        }
        setSyncComplete(true);
        setHydrationStatus('cache');
        return localFallback;
      }
      
      setUserData(EMPTY_SUPABASE_USER_DATA);
      cacheUserDataLocally(null);
      setHydrationStatus('error'); // Explicitly set to error
      setSyncComplete(true); // Ensure syncComplete is set even on error
      return EMPTY_SUPABASE_USER_DATA;
    } finally {
      // CRITICAL FIX: Ensure hydrationStatus is never left as 'idle'
      // If we reach here and status is still 'idle', something went wrong
      setSyncComplete(true);
      // Double-check hydrationStatus is set - if still idle, set to error as fallback
      setHydrationStatus((prev) => {
        if (prev === 'idle') {
          devLog.warn('loadUserData: hydrationStatus was still idle in finally block, setting to error');
          return 'error';
        }
        return prev;
      });
    }
  }, [cacheUserDataLocally, clearPendingVerification]);

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    getSupabaseClient()
      .then((supabase) => {
        if (!isMounted) {
          return;
        }

        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (!isMounted) {
            return;
          }

          setSession(session);
          setUser(session?.user ?? null);

          // CRITICAL FIX: Set loading to false BEFORE async operations
          // This ensures route initialization can proceed even if loadUserData() takes time
          setLoading(false);

          if (session?.user) {
            fetchUserProfile(session.user.id);
            
            // CRITICAL FIX: Set syncComplete immediately if we have local cache
            // This allows route initialization to proceed while remote data loads
            const localSnapshot = readLocalSupabaseUserData();
            if (localSnapshot) {
              setUserData(localSnapshot);
              setSyncComplete(true);
              setHydrationStatus('cache');
              devLog.log('Using local cache for immediate route initialization');
            }
            
            if (!hasSyncedInitialData.current) {
              try {
                await syncLocalToSupabase();
                await syncSupabaseToLocal();
                hasSyncedInitialData.current = true;
              } catch (error) {
                devLog.error('Initial syncLocalToSupabase failed during session hydration', error);
              }
            }
            
            // Load user data in background to update with remote data
            // But don't block - we already set syncComplete if local cache exists
            loadUserData()
              .then(() => {
                // Data loaded successfully - syncComplete already set by loadUserData
                devLog.log('User data loaded successfully from remote');
              })
              .catch((error) => {
                devLog.error('loadUserData failed during initial session hydration', error);
                // Ensure syncComplete is set even on error (if not already set)
                // Ensure syncComplete is set even on error (if not already set)
                setSyncComplete((prev) => prev ? prev : true);
                setHydrationStatus((prev) => prev === 'idle' ? 'error' : prev);
              });
            
            clearPendingVerification();
          } else {
            hasSyncedInitialData.current = false;
            setUserProfile(null);
            if (!hasPendingVerification.current) {
              setUserData(EMPTY_SUPABASE_USER_DATA);
              clearCachedUserData();
            } else {
              devLog.log('Skipping cache clear – awaiting email verification');
            }
            setSyncComplete(true);
            // CRITICAL FIX: Set hydrationStatus even when no user to prevent loading screen hang
            setHydrationStatus('cache');
          }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          devLog.log('Auth event:', event);

          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            fetchUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }

          // CRITICAL FIX: Set loading to false BEFORE async operations
          // This ensures route initialization can proceed even if loadUserData() takes time
          setLoading(false);

          if (event === 'SIGNED_IN' && session?.user) {
            // CRITICAL FIX: Set syncComplete immediately if we have local cache
            const localSnapshot = readLocalSupabaseUserData();
            if (localSnapshot) {
              setUserData(localSnapshot);
              setSyncComplete(true);
              setHydrationStatus('cache');
              devLog.log('Using local cache for immediate route initialization after SIGNED_IN');
            }
            
            if (!hasSyncedInitialData.current) {
              try {
                await syncLocalToSupabase();
                await syncSupabaseToLocal();
                hasSyncedInitialData.current = true;
              } catch (error) {
                devLog.error('syncLocalToSupabase failed on SIGNED_IN event', error);
              }
            }
            
            // Load user data in background to update with remote data
            // But don't block - we already set syncComplete if local cache exists
            loadUserData()
              .then(() => {
                devLog.log('User data loaded successfully after SIGNED_IN');
              })
              .catch((error) => {
                devLog.error('loadUserData failed on SIGNED_IN event', error);
                // Ensure syncComplete is set even on error (if not already set)
                // Ensure syncComplete is set even on error (if not already set)
                setSyncComplete((prev) => prev ? prev : true);
                setHydrationStatus((prev) => prev === 'idle' ? 'error' : prev);
              });
            
            clearPendingVerification();
          } else if (event === 'SIGNED_OUT' || !session?.user) {
            hasSyncedInitialData.current = false;
            if (!hasPendingVerification.current) {
              setUserData(EMPTY_SUPABASE_USER_DATA);
              clearCachedUserData();
            } else {
              devLog.log('Skipping cache clear on SIGNED_OUT – awaiting verification');
            }
            setSyncComplete(true);
          }
        });

        authSubscription = subscription;
      })
      .catch((error) => {
        devLog.error('Failed to initialize Supabase auth listeners', error);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, [loadUserData, clearCachedUserData, syncLocalToSupabase, clearPendingVerification, syncSupabaseToLocal]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => {
      processOfflineQueue().catch((error) => {
        devLog.error('Failed to process offline queue on reconnect', error);
      });
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      devLog.error('Error fetching user profile:', error);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    country: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const supabase = await getSupabaseClient();
      devLog.log('SignUp: Starting signup process...');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            country,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        devLog.error('SignUp: Auth error:', error);
        return { error };
      }

      devLog.log('SignUp: User created:', data.user?.id);

      markPendingVerification();

      // Create user profile (try, but don't fail signup if it doesn't work)
      if (data.user) {
        try {
          const timezone = getTimezoneFromCountry(country);
          const { error: profileError } = await supabase
            .from('users_profile')
            .insert([
              {
                id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                country,
                timezone,
              },
            ]);

          if (profileError) {
            devLog.error('SignUp: Profile creation error:', profileError);
            devLog.warn('SignUp: Continuing without profile - you may need to run supabase-setup.sql');
          } else {
            devLog.log('SignUp: Profile created successfully');
          }
        } catch (profileErr) {
          devLog.error('SignUp: Profile creation failed:', profileErr);
          devLog.warn('SignUp: Table may not exist. Run supabase-setup.sql in Supabase SQL Editor');
          // Continue anyway - user account is created, profile can be added later
        }
      }

      devLog.log('SignUp: Complete! Email verification required:', !data.user?.email_confirmed_at);
      return { error: null };
    } catch (error) {
      devLog.error('SignUp: Unexpected error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // Note: Data sync happens automatically in onAuthStateChange handler for SIGNED_IN event
    // No need to sync here to avoid duplication
    
    return { error };
  };

  const signOut = async () => {
    hasSyncedInitialData.current = false;
    clearPendingVerification();
    try {
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      devLog.error('Supabase signOut failed', error);
    } finally {
      try {
        setUserProfile(null);
        setUserData(EMPTY_SUPABASE_USER_DATA);
        clearCachedUserData();

        const keysToClear = [
          'innercode_state_v1',
          'innercode_userName',
          'innercode_selectedCategories',
          'innercode_completedCategories',
          'innercode_categoryScores',
          'innercode_journal',
          'innercode_results',
          'innercode_hasSeenResults',
          'innercode_daily_insights',
          'innercode_onboarding_answers_synced_v1',
          'innercode_onboardingCompletedAt',
          'innercode_lastActiveRoute',
          'innercode_pendingVerification',
          'innercode_goals',
          'innercode_daily_actions',
          'innercode_checkins',
          'innercode_category_history',
        ];
        keysToClear.forEach((key) => {
          try {
            safeRemoveItem(key);
          } catch (err) {
            devLog.error('Failed to clear cached key on sign out', { key, error: err });
          }
        });

        // Clear Supabase auth session from localStorage (keys like sb-<project>-auth-token)
        // so the next page load doesn't restore the session
        const storage = getSafeLocalStorage();
        if (storage) {
          try {
            const keysToRemove: string[] = [];
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key && key.startsWith('sb-')) keysToRemove.push(key);
            }
            keysToRemove.forEach((key) => storage.removeItem(key));
          } catch (err) {
            devLog.error('Failed to clear Supabase auth keys on sign out', err);
          }
        }
      } catch (err) {
        devLog.error('Error clearing state on sign out', err);
      }
      // Always redirect so the user leaves the app even if something above threw
      try {
        window.location.replace(window.location.origin + '/');
      } catch {
        window.location.href = '/';
      }
    }
  };

  /** Synchronous: clear state, clear all app + Supabase keys, redirect. Does not await Supabase. */
  const forceLogoutAndRedirect = useCallback(() => {
    hasSyncedInitialData.current = false;
    clearPendingVerification();
    setUserProfile(null);
    setUserData(EMPTY_SUPABASE_USER_DATA);
    clearCachedUserData();

    const keysToClear = [
      'innercode_state_v1',
      'innercode_userName',
      'innercode_selectedCategories',
      'innercode_completedCategories',
      'innercode_categoryScores',
      'innercode_journal',
      'innercode_results',
      'innercode_hasSeenResults',
      'innercode_daily_insights',
      'innercode_onboarding_answers_synced_v1',
      'innercode_onboardingCompletedAt',
      'innercode_lastActiveRoute',
      'innercode_pendingVerification',
      'innercode_goals',
      'innercode_daily_actions',
      'innercode_checkins',
      'innercode_category_history',
    ];
    keysToClear.forEach((key) => {
      try {
        safeRemoveItem(key);
      } catch (_) {}
    });

    const storage = getSafeLocalStorage();
    if (storage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key && key.startsWith('sb-')) keysToRemove.push(key);
        }
        keysToRemove.forEach((key) => storage.removeItem(key));
      } catch (_) {}
    }

    try {
      window.location.replace(window.location.origin + '/');
    } catch {
      window.location.href = '/';
    }
  }, [clearCachedUserData, clearPendingVerification]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('users_profile')
      .update(updates)
      .eq('id', user.id);

    if (!error && userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }
  };

  const value = {
      user,
      session,
      userProfile,
      loading,
      syncComplete,
      hydrationStatus,
      userData,
    refreshUserData: loadUserData,
    signUp,
    signIn,
    signOut,
    forceLogoutAndRedirect,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function to get timezone from country
function getTimezoneFromCountry(country: string): string {
  const timezoneMap: Record<string, string> = {
    'United States': 'America/New_York',
    'United Kingdom': 'Europe/London',
    'Canada': 'America/Toronto',
    'Australia': 'Australia/Sydney',
    'Germany': 'Europe/Berlin',
    'France': 'Europe/Paris',
    'Spain': 'Europe/Madrid',
    'Italy': 'Europe/Rome',
    'Netherlands': 'Europe/Amsterdam',
    'Belgium': 'Europe/Brussels',
    'Switzerland': 'Europe/Zurich',
    'Austria': 'Europe/Vienna',
    'Sweden': 'Europe/Stockholm',
    'Norway': 'Europe/Oslo',
    'Denmark': 'Europe/Copenhagen',
    'Finland': 'Europe/Helsinki',
    'Poland': 'Europe/Warsaw',
    'Portugal': 'Europe/Lisbon',
    'Greece': 'Europe/Athens',
    'Ireland': 'Europe/Dublin',
    'New Zealand': 'Pacific/Auckland',
    'Japan': 'Asia/Tokyo',
    'China': 'Asia/Shanghai',
    'India': 'Asia/Kolkata',
    'Singapore': 'Asia/Singapore',
    'Hong Kong': 'Asia/Hong_Kong',
    'South Korea': 'Asia/Seoul',
    'Brazil': 'America/Sao_Paulo',
    'Mexico': 'America/Mexico_City',
    'Argentina': 'America/Argentina/Buenos_Aires',
    'South Africa': 'Africa/Johannesburg',
    'UAE': 'Asia/Dubai',
    'Saudi Arabia': 'Asia/Riyadh',
    'Israel': 'Asia/Jerusalem',
    'Turkey': 'Europe/Istanbul',
    'Russia': 'Europe/Moscow',
  };

  return timezoneMap[country] || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

