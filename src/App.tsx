import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { GlobalStyles } from "./components/GlobalStyles";
import { Toast } from "./components/Toast";
import { AnalyzingOverlay } from "./components/AnalyzingOverlay";
import { FloatingMenu } from "./components/FloatingMenu";
import { Landing } from "./pages/Landing";
import { NewLanding } from "./pages/NewLanding";
import { WhatIsInnerCode } from "./pages/WhatIsInnerCode";
import { NameCollection } from "./pages/NameCollection";
import { SignUp } from "./pages/SignUp";
import { Login } from "./pages/Login";
import { VerifyEmail } from "./pages/VerifyEmail";
import { WelcomeBack } from "./pages/WelcomeBack";
import { Dashboard } from "./pages/Dashboard";
import { Instructions } from "./pages/Instructions";
import { HowToUseInny } from "./pages/HowToUseInny";
import { CategorySelection } from "./pages/CategorySelection";
import { EnhancedOnboarding } from "./pages/EnhancedOnboarding";
import { Results } from "./pages/Results";
import { Journal } from "./pages/Journal";
import { AICoach } from "./pages/AICoach";
import { JournalCalendar } from "./pages/JournalCalendar";
import { QuickCheckIn } from "./pages/QuickCheckIn";
import { Settings } from "./pages/Settings";
import { Goals } from "./pages/Goals";
import { PROMPTS } from "./constants/prompts";
import { CATEGORY_ICONS } from "./constants/categories";
import { VALUE_ICONS } from "./constants/values";
import { Route, Msg, JournalEntry, ResultsData, OnboardingAnswer } from "./types";
import {
  useTimeoutManager,
  objFromEntries,
  wc,
  getCurrentTime,
  getSafeLocalStorage,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
} from "./utils/helpers";
import { reflectAnswer } from "./utils/valueDetection";
import { computeResults } from "./utils/results";
import { useAuth } from "./contexts/AuthContext";
import { getSupabaseClient } from "./lib/supabase";
import { upsertOnboardingAnswerToSupabase, processOfflineQueue, saveOnboardingStateToSupabase, saveSparkCompletionsToSupabase } from "./lib/supabaseData";
import { devLog } from "./utils/devLog";
import { FEATURES } from "./constants/featureFlags";
import { getAreasForCheckIn, getCheckInHistorySync, shouldShowCheckIn } from "./utils/checkInLogic";
import { extractOnboardingAnswers, buildJournalSummary, formatOnboardingAnswersFromSupabase, buildGoalsSummary } from "./utils/contextBuilders";
import { getGoalsUnlockProgress } from "./utils/goalUnlock";

export default function App() {
  const {
    user,
    loading: authLoading,
    syncComplete,
    hydrationStatus,
    signUp,
    signIn,
    signOut,
    userData,
    userProfile,
    refreshUserData,
  } = useAuth();

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }
    return !navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isOffline) {
      processOfflineQueue().catch((error) => {
        devLog.error('Failed to process offline queue in App', error);
      });
    }
  }, [isOffline]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const bannerId = 'innercode-offline-banner';
    let banner = document.getElementById(bannerId);

    if (isOffline) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = bannerId;
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '9999';
        banner.style.background = '#f97316';
        banner.style.color = '#ffffff';
        banner.style.padding = '10px 16px';
        banner.style.textAlign = 'center';
        banner.style.fontSize = '14px';
        banner.style.fontWeight = '600';
        banner.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
        banner.textContent = 'You appear to be offline. We\'ll sync your changes when you reconnect.';
        document.body.appendChild(banner);
      }
    } else if (banner) {
      banner.remove();
    }

    return () => {
      const existing = document.getElementById(bannerId);
      if (existing) {
        existing.remove();
      }
    };
  }, [isOffline]);

  // New onboarding flow state
  const [userName, setUserName] = useState<string>(() => {
    const storage = getSafeLocalStorage();
    return storage?.getItem('innercode_userName') || '';
  });
  const [pendingReveal, setPendingReveal] = useState<boolean>(false);
  const revealAcknowledgedRef = useRef(false);

  // Check if user has started or completed onboarding
  const getInitialRoute = (): Route => {
    if (typeof window === 'undefined') {
      return 'newLanding';
    }

    // CRITICAL FIX: Restore last active route if available (for refresh/lock-unlock scenarios)
    const lastActiveRoute = safeGetItem('innercode_lastActiveRoute');
    if (lastActiveRoute && typeof lastActiveRoute === 'string') {
      const validRoutes: Route[] = [
        'dashboard', 'journal', 'journalCalendar', 'aiCoach', 
        'results', 'settings', 'instructions', 'howToUseInny', 'quickCheckIn', 'goals'
      ];
      if (validRoutes.includes(lastActiveRoute as Route)) {
        // Only restore if user is authenticated and has completed onboarding
        if (user?.email_confirmed_at) {
          const hasResults = !!userData.results || !!safeGetItem('innercode_results');
          const hasSeenResults = !!userData.onboardingState?.has_seen_results || 
                                 safeGetItem('innercode_hasSeenResults') === 'true';
          if (hasResults && hasSeenResults) {
            devLog.log('Restoring last active route:', lastActiveRoute);
            return lastActiveRoute as Route;
          }
        }
      }
    }

    const searchParams = new URLSearchParams(window.location.search);
    const verifyEmailToken = searchParams.get('verify');

    const rawHash = typeof window !== 'undefined' && window.location.hash ? window.location.hash : '';
    const normalizedHash = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
    const hashParams = new URLSearchParams(normalizedHash);
    const hashAuthType = hashParams.get('type');
    const hasAuthCallback =
      hashParams.has('access_token') ||
      hashParams.has('refresh_token') ||
      hashParams.has('code');

    const localResults = safeGetItem('innercode_results');
    const localSeen = safeGetItem('innercode_hasSeenResults') === 'true';
    const awaitingReveal = pendingReveal || (!!localResults && !localSeen);

    if (
      verifyEmailToken ||
      hasAuthCallback ||
      hashAuthType === 'signup' ||
      hashAuthType === 'magiclink'
    ) {
      if (!user?.email_confirmed_at) {
        return 'verifyEmail';
      }
      
      // CRITICAL FIX: When there's an auth callback (email verification link clicked),
      // always route to verifyEmail first to let onVerified handler run and properly
      // set the route after data is loaded. This ensures data is synced before routing.
      if (hasAuthCallback || hashAuthType === 'signup' || hashAuthType === 'magiclink') {
        // Check if we have enough data to make a routing decision
        // If data isn't loaded yet, route to verifyEmail to let onVerified handle it
        const hasRemoteResults = !!userData.results;
        const hasRemoteSeen = !!userData.onboardingState?.has_seen_results;
        const localSeenResults = safeGetItem('innercode_hasSeenResults') === 'true';
        const hasResultsState = !!results;
        const hasResults = hasRemoteResults || !!localResults || hasResultsState;
        const hasSeenResults = hasRemoteSeen || localSeenResults;
        
        // If we have data loaded, we can make a routing decision
        if (syncComplete && (hasRemoteResults || hasRemoteSeen || hasResultsState || !!localResults)) {
          // Data is loaded - check if user has results but hasn't seen them
          if (hasResults && !hasSeenResults) {
            return 'welcomeBack';
          }
          // Otherwise use the existing logic
          return awaitingReveal ? 'welcomeBack' : (localSeen ? 'dashboard' : 'results');
        }
        
        // Data not loaded yet - route to verifyEmail to let onVerified handler
        // refresh data and set the correct route
        return 'verifyEmail';
      }
      
      // For verifyEmailToken (legacy), use the existing logic
      const hasRemoteResults = !!userData.results;
      const hasRemoteSeen = !!userData.onboardingState?.has_seen_results;
      const localSeenResults = safeGetItem('innercode_hasSeenResults') === 'true';
      const hasResultsState = !!results;
      const hasResults = hasRemoteResults || !!localResults || hasResultsState;
      const hasSeenResults = hasRemoteSeen || localSeenResults;
      
      // If user has results but hasn't seen them, route to welcomeBack
      if (hasResults && !hasSeenResults) {
        return 'welcomeBack';
      }
      
      // Otherwise use the existing logic
      return awaitingReveal ? 'welcomeBack' : (localSeen ? 'dashboard' : 'results');
    }

    if (!user) {
      if (awaitingReveal) {
        return 'welcomeBack';
      }
      // CRITICAL FIX: Never return protected routes without authentication
      // Even if localStorage has data, require authentication
      if (localSeen) {
        // User has local data but not authenticated - redirect to landing
        return 'newLanding';
      }
      return 'newLanding';
    }

    if (!user.email_confirmed_at) {
      return 'verifyEmail';
    }

    const localSeenResults = safeGetItem('innercode_hasSeenResults') === 'true';
    const hasRemoteResults = !!userData.results;
    const hasRemoteSeen = !!userData.onboardingState?.has_seen_results;
    const hasResults =
      hydrationStatus === 'remote'
        ? hasRemoteResults
        : hasRemoteResults || (!!results && hydrationStatus === 'cache');
    const hasSeenResults =
      hydrationStatus === 'remote'
        ? hasRemoteSeen
        : hasRemoteSeen || (hasResults && localSeenResults);

    if (awaitingReveal && hasResults && !hasSeenResults) {
      return 'welcomeBack';
    }

    if (hasSeenResults || localSeen) {
      return 'dashboard';
    }

    if (hasResults || awaitingReveal) {
      return 'welcomeBack';
    }

    const onboardingState = userData.onboardingState;
    const hasOnboardingProgress = !!(
      onboardingState &&
      ((Array.isArray(onboardingState.messages) && onboardingState.messages.length > 0) || onboardingState.step > 0)
    );

    if (hasOnboardingProgress) {
      return 'onboarding';
    }

    return 'dashboard';
  };

  const [route, setRoute] = useState<Route>('newLanding');
  const hasInitializedRoute = useRef(false);

  // CRITICAL FIX: Wait for auth and sync to complete before determining route
  // This prevents race condition where route is set before userData is loaded
  // Also add delay to allow iOS password prompt to be dismissed
  useEffect(() => {
    if (hasInitializedRoute.current) {
      return;
    }
    
    // Wait for auth and data to load before determining route
    if (authLoading || !syncComplete) {
      devLog.log('Waiting for auth/sync before initializing route', { authLoading, syncComplete });
      return;
    }
    
    // CRITICAL: Add delay to allow iOS password prompt to appear and be dismissed
    // This prevents race condition where route is set while prompt is showing
    const initTimeout = setTimeout(() => {
      try {
        const initialRoute = getInitialRoute();
        devLog.log('Initializing route:', initialRoute);
        setRoute((prev) => (prev === initialRoute ? prev : initialRoute));
        hasInitializedRoute.current = true;
      } catch (error) {
        devLog.error('Failed to determine initial route', error);
        hasInitializedRoute.current = true;
      }
    }, 300); // 300ms delay to allow password prompt to be dismissed
    
    return () => {
      clearTimeout(initTimeout);
    };
  }, [authLoading, syncComplete, user, userData, hydrationStatus]);

  // CRITICAL FIX: Re-check route when page regains focus (after password prompt dismissal)
  // This handles cases where route initialization was interrupted by iOS password prompt
  useEffect(() => {
    const handleFocus = () => {
      // Small delay to ensure prompt is fully dismissed
      setTimeout(() => {
        // If route hasn't been initialized yet, try again
        if (!hasInitializedRoute.current && syncComplete && !authLoading) {
          devLog.log('Page regained focus - re-checking route initialization');
          try {
            const initialRoute = getInitialRoute();
            setRoute((prev) => {
              if (prev !== initialRoute) {
                devLog.log('Updating route after focus:', initialRoute);
                return initialRoute;
              }
              return prev;
            });
            hasInitializedRoute.current = true;
          } catch (error) {
            devLog.error('Failed to determine initial route on focus', error);
            hasInitializedRoute.current = true;
          }
        } else if (hasInitializedRoute.current && syncComplete && !authLoading) {
          // Route already initialized, but check if we need to restore saved route
          const lastActiveRoute = safeGetItem('innercode_lastActiveRoute');
          if (lastActiveRoute && lastActiveRoute !== route) {
            const validRoutes: Route[] = [
              'dashboard', 'journal', 'journalCalendar', 'aiCoach', 
              'results', 'settings', 'instructions', 'howToUseInny', 'quickCheckIn', 'goals'
            ];
            if (validRoutes.includes(lastActiveRoute as Route) && user?.email_confirmed_at) {
              const hasResults = !!userData.results || !!safeGetItem('innercode_results');
              const hasSeenResults = !!userData.onboardingState?.has_seen_results || 
                                     safeGetItem('innercode_hasSeenResults') === 'true';
              if (hasResults && hasSeenResults) {
                devLog.log('Restoring route after focus:', lastActiveRoute);
                setRoute(lastActiveRoute as Route);
              }
            }
          }
        }
      }, 500); // 500ms delay to allow prompt to fully dismiss
    };

    window.addEventListener('focus', handleFocus);
    // Also trigger on initial load after a delay (in case prompt appears immediately)
    const initialDelay = setTimeout(handleFocus, 1000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(initialDelay);
    };
  }, [syncComplete, authLoading, route, user, userData]);

  // CRITICAL FIX: Re-check route when page becomes visible (after password prompt)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && syncComplete && !authLoading) {
        // Small delay to ensure prompt is dismissed
        setTimeout(() => {
          if (!hasInitializedRoute.current) {
            devLog.log('Page became visible - initializing route');
            try {
              const initialRoute = getInitialRoute();
              setRoute((prev) => {
                if (prev !== initialRoute) {
                  devLog.log('Updating route after visibility change:', initialRoute);
                  return initialRoute;
                }
                return prev;
              });
              hasInitializedRoute.current = true;
            } catch (error) {
              devLog.error('Failed to determine initial route on visibility change', error);
              hasInitializedRoute.current = true;
            }
          }
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [syncComplete, authLoading, user, userData]);

  // CRITICAL FIX: Refresh data from Supabase when page becomes visible
  // But only if enough time has passed since last refresh to avoid excessive calls
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    let lastRefreshTime = 0;
    const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && syncComplete && !authLoading) {
        const now = Date.now();
        const timeSinceLastRefresh = now - lastRefreshTime;
        
        // Only refresh if enough time has passed
        if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
          return;
        }
        
        // Clear any existing timeout
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        
        // Small delay to avoid interfering with initial load
        refreshTimeout = setTimeout(() => {
          devLog.log('Page became visible - refreshing data from Supabase for cross-device sync');
          lastRefreshTime = Date.now();
          // Refresh user data to get latest from Supabase
          refreshUserData().catch((error) => {
            devLog.error('Failed to refresh user data on visibility change', error);
          });
        }, 2000); // 2 second delay to avoid race conditions
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [user, syncComplete, authLoading, refreshUserData]);

  const [isInOnboardingFlow, setIsInOnboardingFlow] = useState(false);
  const [showExpansionSuccess, setShowExpansionSuccess] = useState(false);
  const isInitialMount = useRef(true);
  const lastHydratedUserId = useRef<string | null>(null);

  const resolveRouteForCache = useCallback((targetRoute: Route): Route | null => {
    if (targetRoute === 'verifyEmail') {
      return null;
    }

    if (targetRoute === 'newLanding') {
      const hasLocalResults = !!safeGetItem('innercode_results');
      if (hasLocalResults) {
        const localSeen = safeGetItem('innercode_hasSeenResults') === 'true';
        return pendingReveal || !localSeen ? 'welcomeBack' : 'dashboard';
      }
    }

    return targetRoute;
  }, []);

  type PersistedSnapshotArgs = {
    route: Route | string;
    messages: Msg[];
    step: number;
    input: string;
    categoryScores: Record<string, number>;
    selectedCategories: string[];
    completedCategories: string[];
    categoryPhases: Record<string, import("./types").CategoryPhase>;
    ratingCategory: string | null;
    expansionPrompts: import("./types").Prompt[];
  };

  const buildPersistedStateSnapshot = useCallback(
    ({
      route,
      messages,
      step,
      input,
      categoryScores,
      selectedCategories,
      completedCategories,
      categoryPhases,
      ratingCategory,
      expansionPrompts,
    }: PersistedSnapshotArgs) => {
      const hasProgress =
        (Array.isArray(messages) && messages.length > 0) ||
        (Array.isArray(selectedCategories) && selectedCategories.length > 0) ||
        (Array.isArray(completedCategories) && completedCategories.length > 0) ||
        (typeof step === 'number' && step > 0) ||
        (ratingCategory !== null && ratingCategory !== undefined) ||
        (Array.isArray(expansionPrompts) && expansionPrompts.length > 0);

      if (!hasProgress) {
        return null;
      }

      return {
        route,
        messages,
        step,
        input,
        categoryScores,
        selectedCategories,
        completedCategories,
        categoryPhases,
        ratingCategory,
        expansionPrompts,
        // Supabase-style duplicates for compatibility
        selected_categories: selectedCategories,
        completed_categories: completedCategories,
        category_scores: categoryScores,
        category_phases: categoryPhases,
        rating_category: ratingCategory,
        expansion_prompts: expansionPrompts,
      };
    },
    []
  );

  const [hydratingAfterVerification, setHydratingAfterVerification] = useState(false);

  useEffect(() => {
    const confirmed = !!user?.email_confirmed_at;
    const remoteSeen = !!userData.onboardingState?.has_seen_results;
    const storage = getSafeLocalStorage();
    const localSeen = storage ? storage.getItem('innercode_hasSeenResults') === 'true' : false;

    if (!confirmed) {
      if (pendingReveal) {
        setPendingReveal(false);
      }
      revealAcknowledgedRef.current = false;
      if (typeof window !== 'undefined') {
        const storage = getSafeLocalStorage();
        storage?.removeItem('innercode_pendingReveal');
      }
      return;
    }

    if (remoteSeen || localSeen) {
      if (pendingReveal) {
        setPendingReveal(false);
      }
      revealAcknowledgedRef.current = false;
      if (typeof window !== 'undefined') {
        const storage = getSafeLocalStorage();
        storage?.removeItem('innercode_pendingReveal');
        storage?.setItem('innercode_hasSeenResults', 'true');
      }
      return;
    }

    if (!pendingReveal && userData.results && !revealAcknowledgedRef.current) {
      setPendingReveal(true);
      if (typeof window !== 'undefined') {
        const storage = getSafeLocalStorage();
        storage?.setItem('innercode_pendingReveal', 'true');
        storage?.removeItem('innercode_hasSeenResults');
      }
    }
  }, [pendingReveal, user?.email_confirmed_at, userData.onboardingState?.has_seen_results, userData.results]);

  // Update route when authentication state changes (but not during onboarding flow or when on specific screens)
  useEffect(() => {
    // Wait for auth to finish loading AND for sync to complete
    if (authLoading) {
      devLog.log('Auth still loading - waiting');
      return;
    }
    
    if (hydratingAfterVerification) {
      devLog.log('Hydrating after verification - deferring route evaluation');
      return;
    }
    
    if (!syncComplete) {
      devLog.log('Sync not complete - waiting for data to load from Supabase');
      return;
    }
    
    // CRITICAL FIX: Don't override routes that are managed by onVerified handler
    // When onVerified sets a route, we need to respect it and not override immediately
    if (route === 'verifyEmail' || route === 'welcomeBack') {
      // Check if we just finished hydrating after verification
      // If so, don't override - let onVerified handler manage the route
      const pendingRevealLocal = safeGetItem('innercode_pendingReveal') === 'true';
      if (pendingRevealLocal || route === 'welcomeBack') {
        devLog.log('Route is verifyEmail or welcomeBack - not overriding (managed by onVerified)');
        return;
      }
    }
    
    // On initial mount with authenticated user, re-evaluate route after data sync
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If user is authenticated, re-evaluate route (Supabase data has now synced)
      if (user) {
        devLog.log('Initial mount with authenticated user - re-evaluating route after sync');
        const newRoute = getInitialRoute();
        if (newRoute !== route) {
          devLog.log('Updating route from:', route, 'to:', newRoute);
          setRoute(newRoute);
        }
      } else {
        devLog.log('Initial mount without authenticated user - keeping initial route');
      }
      return;
    }
    
    // Check if user has completed onboarding
    const storage = getSafeLocalStorage();
    const localHasSeenResults = storage ? storage.getItem('innercode_hasSeenResults') === 'true' : false;
    const hasResults =
      !!userData.results ||
      (!!results && (syncComplete || hydrationFallbackTriggered));
    const hasSeenResults =
      !!userData.onboardingState?.has_seen_results ||
      (hasResults && localHasSeenResults);
    const isCompletedUser = hasResults && hasSeenResults;
    
    // Routes that should always be protected from auth state changes
    const alwaysProtectedRoutes = [
      'results', 
      'welcomeBack',
      'verifyEmail', // Protect verifyEmail route so onVerified handler can manage it
      'signup', 
      'analyzing', 
    ];
    
    // Routes that should be protected for completed users only
    const completedUserRoutes = [
      'dashboard', 
      'journal', 
      'journalCalendar', 
      'aiCoach',
      'instructions',
      'howToUseInny',
      'settings',
    ];
    
    // Decide if current route should be protected
    const isProtected = alwaysProtectedRoutes.includes(route) || 
                        isInOnboardingFlow ||
                        (isCompletedUser && completedUserRoutes.includes(route));
    
    if (!isProtected) {
      const newRoute = getInitialRoute();
      devLog.log('Auth state changed, updating route from:', route, 'to:', newRoute);
      setRoute(newRoute);
    } else {
      devLog.log('Auth state changed but route is protected:', route);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, syncComplete, hydratingAfterVerification]);
  

  // Onboarding chat state - load from localStorage immediately
  const [onboardingAnswerRecords, setOnboardingAnswerRecords] = useState<OnboardingAnswer[]>([]);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState<number>(0);
  const [input, setInput] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [expansionPrompts, setExpansionPrompts] = useState<import("./types").Prompt[]>([]);

  // Categories
  const categories = useMemo(() => {
    const seen = new Set<string>();
    return PROMPTS.map((p) => p.category).filter((c) =>
      seen.has(c) ? false : (seen.add(c), true)
    );
  }, []);
  
  // Track which categories user has selected and completed - load from localStorage immediately
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const storage = getSafeLocalStorage();
    if (!storage) {
      return [];
    }
    try {
      const raw = storage.getItem('innercode_state_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Check both camelCase and snake_case for compatibility
      const categories = parsed.selectedCategories || parsed.selected_categories || [];
      return Array.isArray(categories) ? categories : [];
    } catch {
      return [];
    }
  });
  
  const [completedCategories, setCompletedCategories] = useState<string[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const storage = getSafeLocalStorage();
    if (!storage) {
      return [];
    }
    try {
      const raw = storage.getItem('innercode_state_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      // Check both camelCase and snake_case for compatibility
      const categories = parsed.completedCategories || parsed.completed_categories || [];
      return Array.isArray(categories) ? categories : [];
    } catch {
      return [];
    }
  });
  
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') {
      return objFromEntries(categories.map((c) => [c, 5]));
    }
    const storage = getSafeLocalStorage();
    if (!storage) {
      return objFromEntries(categories.map((c) => [c, 5]));
    }
    try {
      const raw = storage.getItem('innercode_state_v1');
      if (!raw) return objFromEntries(categories.map((c) => [c, 5]));
      const parsed = JSON.parse(raw);
      const scores = parsed.categoryScores || parsed.category_scores || {};
      if (scores && typeof scores === 'object') {
        // Merge with defaults for any missing categories
        const defaultScores = objFromEntries(categories.map((c) => [c, 5]));
        return { ...defaultScores, ...scores };
      }
      return objFromEntries(categories.map((c) => [c, 5]));
    } catch {
      return objFromEntries(categories.map((c) => [c, 5]));
    }
  });
  const [categoryPhases, setCategoryPhases] = useState<Record<string, import("./types").CategoryPhase>>({});
  const [ratingCategory, setRatingCategory] = useState<string | null>(null);

  const [results, setResults] = useState<ResultsData | null>(null);

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    const storage = getSafeLocalStorage();
    if (!storage) {
      return [];
    }
    try {
      const raw = storage.getItem('innercode_journal');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
        const storage = getSafeLocalStorage();
        storage?.setItem("innercode_journal", JSON.stringify(journalEntries));
  }, [journalEntries]);

  const [sparkCompletions, setSparkCompletions] = useState<Record<string, string[]>>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    const storage = getSafeLocalStorage();
    if (!storage) {
      return {};
    }
    try {
      const raw = storage.getItem('innercode_daily_actions');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!syncComplete) {
      return;
    }

    const storage = getSafeLocalStorage();

    // CRITICAL FIX: Preserve local results if remote is null/undefined
    // Only update if remote has data, otherwise keep local state
    if (userData.results) {
      setResults(userData.results);
    } else {
      // Remote doesn't have results - preserve local state
      // Don't clear results, they might not have synced yet
      const localResults = safeGetItem('innercode_results');
      if (localResults && !results) {
        try {
          const parsed = JSON.parse(localResults);
          if (parsed && typeof parsed === 'object') {
            setResults(parsed);
          }
        } catch (e) {
          // Parse failed, keep current state
        }
      }
    }
    
    // CRITICAL FIX: Always merge journal entries, never clear them
    // Always check localStorage directly, not just state, to ensure data preservation
    const remoteJournalEntries = Array.isArray(userData.journalEntries) ? userData.journalEntries : [];
    const localJournalRaw = storage?.getItem('innercode_journal');
    let localJournalEntries: JournalEntry[] = [];
    if (localJournalRaw) {
      try {
        const parsed = JSON.parse(localJournalRaw);
        if (Array.isArray(parsed)) {
          localJournalEntries = parsed;
        }
      } catch (e) {
        devLog.error('Failed to parse local journal entries', e);
      }
    }

    const remoteHasEntries = remoteJournalEntries.length > 0;
    const localHasEntries = localJournalEntries.length > 0;
    const stateHasEntries = journalEntries.length > 0;

    if (remoteHasEntries || localHasEntries || stateHasEntries) {
      // Merge: remote (highest priority), then local, then current state
      const mergedMap = new Map<string, JournalEntry>();
      
      // Add remote entries first (they take precedence for duplicates)
      remoteJournalEntries.forEach((entry) => {
        mergedMap.set(entry.id, entry);
      });
      
      // Add local entries that aren't in remote
      localJournalEntries.forEach((entry) => {
        if (!mergedMap.has(entry.id)) {
          mergedMap.set(entry.id, entry);
        }
      });
      
      // Add current state entries that aren't in remote or local
      journalEntries.forEach((entry) => {
        if (!mergedMap.has(entry.id)) {
          mergedMap.set(entry.id, entry);
        }
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.createdAt - a.createdAt);
      
      if (merged.length > 0) {
        setJournalEntries(merged);
        storage?.setItem('innercode_journal', JSON.stringify(merged));
        devLog.log('Journal entries merged:', {
          state: journalEntries.length,
          local: localJournalEntries.length,
          remote: remoteJournalEntries.length,
          merged: merged.length
        });
      }
    } else {
      // No entries anywhere - ensure localStorage is cleared if it's empty
      const finalCheck = storage?.getItem('innercode_journal');
      if (!finalCheck) {
        storage?.removeItem('innercode_journal');
        if (journalEntries.length > 0) {
          setJournalEntries([]);
        }
      } else {
        // Final check: try to recover from localStorage
        try {
          const parsed = JSON.parse(finalCheck);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setJournalEntries(parsed);
            devLog.log('Recovered journal entries from localStorage on final check');
          }
        } catch (e) {
          devLog.error('Failed to parse localStorage on final check', e);
        }
      }
    }

    if (Array.isArray(userData.onboardingAnswers)) {
      setOnboardingAnswerRecords(userData.onboardingAnswers);
    } else {
      setOnboardingAnswerRecords([]);
    }

    const remoteSparkCompletions =
      (userData.onboardingState?.spark_completions && typeof userData.onboardingState.spark_completions === 'object'
        ? userData.onboardingState.spark_completions
        : userData.sparkCompletions) ?? {};

    // CRITICAL FIX: Always check localStorage directly, not just state
    // State might be empty during refresh even if localStorage has data
    const localCompletionsRaw = storage?.getItem('innercode_daily_actions');
    let localSparkCompletions: Record<string, string[]> = {};
    if (localCompletionsRaw) {
      try {
        const parsed = JSON.parse(localCompletionsRaw);
        if (parsed && typeof parsed === 'object') {
          localSparkCompletions = parsed;
        }
      } catch (e) {
        devLog.error('Failed to parse local spark completions', e);
      }
    }

    const remoteHasCompletions = Object.keys(remoteSparkCompletions).length > 0;
    const localHasCompletions = Object.keys(localSparkCompletions).length > 0;
    const stateHasCompletions = Object.keys(sparkCompletions).length > 0;

    // CRITICAL FIX: Always preserve localStorage data
    // Even if remote and state are empty, localStorage is the source of truth
    if (localHasCompletions) {
      // localStorage has data - always use it
      const merged = { 
        ...localSparkCompletions,  // localStorage first (source of truth)
        ...remoteSparkCompletions,  // Then remote (takes precedence for conflicts)
        ...sparkCompletions  // Then state (shouldn't override, but included for completeness)
      };
      
      setSparkCompletions(merged);
      storage?.setItem('innercode_daily_actions', JSON.stringify(merged));
      devLog.log('Spark completions loaded from localStorage:', Object.keys(merged).length, 'days');
    } else if (remoteHasCompletions || stateHasCompletions) {
      // No localStorage data, but remote or state has data
      const merged = { 
        ...remoteSparkCompletions,
        ...sparkCompletions
      };
      
      if (Object.keys(merged).length > 0) {
        setSparkCompletions(merged);
        storage?.setItem('innercode_daily_actions', JSON.stringify(merged));
        devLog.log('Spark completions merged from remote/state:', Object.keys(merged).length, 'days');
      }
    } else {
      // All sources empty - double-check localStorage before clearing
      const finalCheck = storage?.getItem('innercode_daily_actions');
      if (!finalCheck) {
        storage?.removeItem('innercode_daily_actions');
        if (Object.keys(sparkCompletions).length > 0) {
          setSparkCompletions({});
        }
      } else {
        // localStorage has data but we didn't detect it - recover it
        try {
          const parsed = JSON.parse(finalCheck);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setSparkCompletions(parsed);
            devLog.log('Recovered spark completions from localStorage on final check');
          }
        } catch (e) {
          devLog.error('Failed to parse localStorage on final check', e);
        }
      }
    }

    const onboardingState = userData.onboardingState;

    if (onboardingState) {
      setMessages(Array.isArray(onboardingState.messages) ? onboardingState.messages : []);
      setStep(typeof onboardingState.step === 'number' ? onboardingState.step : 0);
      setInput("");
      setSelectedCategories(Array.isArray(onboardingState.selected_categories) ? onboardingState.selected_categories : []);
      setCompletedCategories(Array.isArray(onboardingState.completed_categories) ? onboardingState.completed_categories : []);

      const scoreSource = onboardingState.category_scores && typeof onboardingState.category_scores === 'object'
        ? onboardingState.category_scores
        : {};
      const hydratedScores = objFromEntries(
        categories.map((category) => [category, typeof scoreSource?.[category] === 'number' ? scoreSource[category] : 5])
      );
      setCategoryScores(hydratedScores);

      setCategoryPhases(onboardingState.category_phases ?? {});
      setRatingCategory(null);
    } else {
      // CRITICAL FIX: Before clearing, check localStorage if sync is not complete
      // Only clear if sync is complete AND no local data exists
      if (!syncComplete) {
        // Data still loading - preserve existing state
        const localState = safeGetItem('innercode_state_v1');
        if (localState) {
          try {
            const parsed = JSON.parse(localState);
            // Check both camelCase and snake_case for compatibility
            const completedCats = parsed.completedCategories || parsed.completed_categories || [];
            if (Array.isArray(completedCats) && completedCats.length > 0) {
              // Use local state temporarily until remote loads
              setCompletedCategories(completedCats);
              setSelectedCategories(parsed.selectedCategories || parsed.selected_categories || []);
              setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
              setStep(typeof parsed.step === 'number' ? parsed.step : 0);
              
              const scoreSource = (parsed.categoryScores || parsed.category_scores) && typeof (parsed.categoryScores || parsed.category_scores) === 'object'
                ? (parsed.categoryScores || parsed.category_scores)
                : {};
              const hydratedScores = objFromEntries(
                categories.map((category) => [category, typeof scoreSource?.[category] === 'number' ? scoreSource[category] : 5])
              );
              setCategoryScores(hydratedScores);
              setCategoryPhases((parsed.categoryPhases || parsed.category_phases) ?? {});
              setRatingCategory(null);
              return; // Don't clear state
            }
          } catch (e) {
            // Parse failed, continue with clearing
          }
        }
        // If no local state, preserve existing state until sync completes
        return;
      }
      
      // Sync is complete - check if local data exists before clearing
      const localState = safeGetItem('innercode_state_v1');
      if (localState) {
        try {
          const parsed = JSON.parse(localState);
          // Check both camelCase and snake_case for compatibility
          const completedCats = parsed.completedCategories || parsed.completed_categories || [];
          if (Array.isArray(completedCats) && completedCats.length > 0) {
            // Use local state even though remote is empty
            setCompletedCategories(completedCats);
            setSelectedCategories(parsed.selectedCategories || parsed.selected_categories || []);
            setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
            setStep(typeof parsed.step === 'number' ? parsed.step : 0);
            
            const scoreSource = (parsed.categoryScores || parsed.category_scores) && typeof (parsed.categoryScores || parsed.category_scores) === 'object'
              ? (parsed.categoryScores || parsed.category_scores)
              : {};
            const hydratedScores = objFromEntries(
              categories.map((category) => [category, typeof scoreSource?.[category] === 'number' ? scoreSource[category] : 5])
            );
            setCategoryScores(hydratedScores);
            setCategoryPhases((parsed.categoryPhases || parsed.category_phases) ?? {});
            setRatingCategory(null);
            return; // Don't clear state
          }
        } catch (e) {
          // Parse failed, continue with clearing
        }
      }
      
      // Both remote and local are empty - clear state
      setMessages([]);
      setStep(0);
      setInput("");
      setSelectedCategories([]);
      setCompletedCategories([]);
      setCategoryScores(objFromEntries(categories.map((c) => [c, 5])));
      setCategoryPhases({});
      setRatingCategory(null);
    }

    setExpansionPrompts([]);
  }, [userData, syncComplete, categories]);

  useEffect(() => {
    if (userProfile?.first_name) {
      setUserName(userProfile.first_name);
    } else if (!user) {
      // Preserve localStorage value if userProfile hasn't loaded yet
      const storage = getSafeLocalStorage();
      const savedName = storage?.getItem('innercode_userName');
      if (!savedName) {
        setUserName("");
      }
    }
  }, [userProfile?.first_name, user]);

  const onboardingAnswers = useMemo(() => {
    const remoteAnswers = formatOnboardingAnswersFromSupabase(onboardingAnswerRecords);
    if (remoteAnswers.length > 0) {
      return remoteAnswers;
    }
    return extractOnboardingAnswers(messages);
  }, [onboardingAnswerRecords, messages]);

  const journalInsights = useMemo(
    () => buildJournalSummary(journalEntries),
    [journalEntries]
  );

  const journalSummary = journalInsights.summaryText;
  const recentJournalEntries = journalInsights.recentEntries;

  const goalsUnlockProgress = useMemo(
    () =>
      getGoalsUnlockProgress(
        completedCategories,
        categories.length,
        journalEntries.length,
        sparkCompletions
      ),
    [completedCategories, categories.length, journalEntries.length, sparkCompletions]
  );
  const goalsUnlocked = goalsUnlockProgress.unlocked;
  const goals = userData.goals ?? [];

  // Persist results to localStorage and Supabase
  useEffect(() => {
    if (results) {
      const storage = getSafeLocalStorage();
      storage?.setItem("innercode_results", JSON.stringify(results));
      
      // Also save to Supabase for cross-device sync
      if (user) {
        import('./lib/supabaseData').then(({ saveResultsToSupabase }) => {
          saveResultsToSupabase(results).catch((error: unknown) => {
            devLog.error('Failed to save results to Supabase:', error);
          });
        });
      }
    }
  }, [results, user]);

  // Persist userName
  useEffect(() => {
    if (userName) {
      const storage = getSafeLocalStorage();
      storage?.setItem("innercode_userName", userName);
    }
  }, [userName]);

  function addJournalEntry(e: Omit<JournalEntry, "id" | "createdAt">) {
    const entryId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const entry: JournalEntry = {
      id: entryId,
      createdAt: Date.now(),
      text: String(e.text || ""),
      categories: Array.isArray(e.categories) ? e.categories.map(String) : [],
      values: Array.isArray(e.values) ? e.values.map(String) : [],
      gratitude: Array.isArray(e.gratitude) ? e.gratitude.map(String) : [],
      mood: e.mood ? String(e.mood) : undefined,
      suggestionRef: e.suggestionRef ? String(e.suggestionRef) : undefined,
      goalRef: e.goalRef ? { goalId: e.goalRef.goalId, snippet: e.goalRef.snippet } : undefined,
    };
    setJournalEntries((prev: JournalEntry[]) => {
      const updated = [entry, ...prev];
      
      // Recompute results with journal entries included
      if (results) {
        // Combine onboarding answers with journal texts
        const onboardingAnswers = messages
          .filter((m) => m.sender === "you")
          .map((m) => m.text);
        const journalTexts = updated.map((j) => j.text);
        const allAnswers = [...onboardingAnswers, ...journalTexts];
        
        // Preserve existing value scores
        const previousValueScores = results.valueEntries 
          ? Object.fromEntries(results.valueEntries) 
          : undefined;
        
        const computed = computeResults(allAnswers, categoryScores, previousValueScores);
        setResults(computed);
        
        devLog.log('Results updated from journal entry:', {
          journalCount: updated.length,
          totalAnswers: allAnswers.length,
        });
      }
      
      return updated;
    });

    if (user) {
      import('./lib/supabaseData')
        .then(({ saveJournalEntryToSupabase }) => saveJournalEntryToSupabase(entry))
        .then((result) => {
          if (result?.error) {
            devLog.error('Failed to save journal entry to Supabase immediately:', result.error);
          }
        })
        .catch((error) => {
          devLog.error('Failed to save journal entry to Supabase immediately:', error);
        });
    }
  }

  const { later } = useTimeoutManager();

  const handleRevealResults = useCallback(() => {
    revealAcknowledgedRef.current = true;
    setPendingReveal(true);
    const storage = getSafeLocalStorage();
    storage?.setItem('innercode_pendingReveal', 'true');
    storage?.removeItem('innercode_hasSeenResults');
    setRoute('results');
  }, [route]);

  const persistSparkCompletions = useCallback(
    async (completions: Record<string, string[]>) => {
      // CRITICAL: Always preserve existing localStorage data if new data is empty
      const storage = getSafeLocalStorage();
      const existing = storage?.getItem('innercode_daily_actions');
      
      if (Object.keys(completions).length > 0) {
        // New data exists - use it
        setSparkCompletions(completions);
        storage?.setItem('innercode_daily_actions', JSON.stringify(completions));
      } else if (existing) {
        // New data is empty but localStorage has data - preserve localStorage
        try {
          const parsed = JSON.parse(existing);
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            setSparkCompletions(parsed);
            // Don't clear localStorage - keep existing data
            return;
          }
        } catch (e) {
          // Parse failed, continue with clearing
        }
        storage?.removeItem('innercode_daily_actions');
      } else {
        // Both are empty - safe to clear
        setSparkCompletions({});
        storage?.removeItem('innercode_daily_actions');
      }

      try {
        await saveSparkCompletionsToSupabase(completions);
      } catch (error) {
        devLog.error('Failed to persist spark completions to Supabase', error);
      }
    },
    []
  );

  const finalizeReveal = useCallback(async () => {
    if (!pendingReveal) {
      return;
    }

    setPendingReveal(false);
    revealAcknowledgedRef.current = false;
    const storage = getSafeLocalStorage();
    storage?.removeItem('innercode_pendingReveal');
    storage?.setItem('innercode_hasSeenResults', 'true');

    try {
      await saveOnboardingStateToSupabase({
        messages,
        step,
        selectedCategories,
        completedCategories,
        categoryScores,
        categoryPhases,
        hasSeenResults: true,
        sparkCompletions,
      });
      await refreshUserData().catch((error) => {
        devLog.error('Failed to refresh user data after marking results seen', error);
      });
    } catch (error) {
      devLog.error('Failed to update has_seen_results in Supabase', error);
    }
  }, [
    pendingReveal,
    messages,
    step,
    selectedCategories,
    completedCategories,
    categoryScores,
    categoryPhases,
    refreshUserData,
  ]);

  // Filter prompts based on selected categories and essential flag
  const activePrompts = useMemo(() => {
    // If we have expansion prompts, use those instead
    if (expansionPrompts.length > 0) {
      return expansionPrompts;
    }
    
    if (selectedCategories.length === 0) {
      return PROMPTS; // Fallback to all prompts if none selected
    }
    return PROMPTS.filter(
      (p) => selectedCategories.includes(p.category) && p.essential && (p.phase === 1 || p.phase === undefined)
    );
  }, [selectedCategories, expansionPrompts]);

  // index of last prompt in each category (based on active prompts)
  const lastIndexOfCategory: Record<string, number> = useMemo(() => {
    const map: Record<string, number> = {};
    activePrompts.forEach((p, i) => (map[p.category] = i));
    return map;
  }, [activePrompts]);

  const currentCategory =
    activePrompts[Math.min(step, activePrompts.length - 1)]?.category ?? categories[0];

  // Immediately save route to localStorage whenever it changes (mobile-friendly)
  useEffect(() => {
    const routeForCache = resolveRouteForCache(route);
    if (!routeForCache) {
      return;
    }
    try {
      const storage = getSafeLocalStorage();
      if (!storage) {
        return;
      }
      storage.setItem('innercode_lastActiveRoute', routeForCache);
      devLog.log('Route changed to:', routeForCache, '- saved to localStorage');
    } catch (e) {
      devLog.error('Failed to save route:', e);
    }
  }, [route, resolveRouteForCache]);

  // Force-save state when page visibility changes (mobile app suspend/resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        try {
          const routeForCache = resolveRouteForCache(route);
          const snapshot = buildPersistedStateSnapshot({
            route: routeForCache ?? route,
            messages,
            step,
            input,
            categoryScores,
            selectedCategories,
            completedCategories,
            categoryPhases,
            ratingCategory,
            expansionPrompts,
          });
          if (!snapshot) {
            return;
          }
          const storage = getSafeLocalStorage();
          if (!storage) {
            return;
          }
          storage.setItem("innercode_state_v1", JSON.stringify(snapshot));
          if (routeForCache) {
            storage.setItem('innercode_lastActiveRoute', routeForCache);
            devLog.log('Page hidden - force-saved route:', routeForCache);
          }
        } catch (e) {
          devLog.error('Failed to save on visibility change:', e);
        }
      }
    };

    const handleBeforeUnload = () => {
      try {
        const routeForCache = resolveRouteForCache(route);
        const snapshot = buildPersistedStateSnapshot({
          route: routeForCache ?? route,
          messages,
          step,
          input,
          categoryScores,
          selectedCategories,
          completedCategories,
          categoryPhases,
          ratingCategory,
          expansionPrompts,
        });
        if (!snapshot) {
          return;
        }
        const storage = getSafeLocalStorage();
        if (!storage) {
          return;
        }
        storage.setItem("innercode_state_v1", JSON.stringify(snapshot));
        if (routeForCache) {
          storage.setItem('innercode_lastActiveRoute', routeForCache);
          devLog.log('Before unload - force-saved route:', routeForCache);
        }
      } catch (e) {
        devLog.error('Failed to save on beforeunload:', e);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [route, messages, step, input, categoryScores, selectedCategories, completedCategories, ratingCategory, expansionPrompts, categoryPhases, resolveRouteForCache, buildPersistedStateSnapshot]);

  /** Save on changes - with mobile-friendly persistence */
  useEffect(() => {
    const routeForCache = resolveRouteForCache(route);
    const snapshot = buildPersistedStateSnapshot({
      route: routeForCache ?? route,
      messages,
      step,
      input,
      categoryScores,
      selectedCategories,
      completedCategories,
      categoryPhases,
      ratingCategory,
      expansionPrompts,
    });

    if (!snapshot) {
      return;
    }

    const storage = getSafeLocalStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem("innercode_state_v1", JSON.stringify(snapshot));
    } catch (e) {
      devLog.error("Failed to save state to localStorage:", e);
      // Fallback: try to save individual pieces
      try {
        storage.setItem("innercode_selectedCategories", JSON.stringify(selectedCategories));
        storage.setItem("innercode_completedCategories", JSON.stringify(completedCategories));
        storage.setItem("innercode_categoryScores", JSON.stringify(categoryScores));
      } catch (fallbackError) {
        devLog.error("Fallback save also failed:", fallbackError);
      }
    }
  }, [route, messages, step, input, categoryScores, selectedCategories, completedCategories, ratingCategory, expansionPrompts, categoryPhases, resolveRouteForCache, buildPersistedStateSnapshot]);

  /** Onboarding boot - only initialize if completely empty */
  useEffect(() => {
    if (route !== "onboarding") {
      setExpansionPrompts([]); // Clear expansion prompts when leaving onboarding
      return;
    }
    if (activePrompts.length === 0) return; // Wait for category selection
    
    // Check if this is an expansion (adding new categories)
    const isExpansion = completedCategories.length > 0;
    const newCategories = selectedCategories.filter(
      cat => !completedCategories.includes(cat)
    );
    
    // Check if we have any saved progress from current session
    const hasProgress = messages.length > 0 || step > 0 || ratingCategory !== null;
    
    // For expansion: check if we need to initialize new categories
    const needsExpansionInit = isExpansion && newCategories.length > 0 && expansionPrompts.length === 0;
    
    // Only initialize if:
    // 1. This is an expansion that hasn't been initialized yet, OR
    // 2. This is a fresh start with no existing progress
    if (needsExpansionInit || (!isExpansion && !hasProgress)) {
      
      if (!isExpansion) {
        // Fresh start
        // Start directly with the first question - no intro needed since we have the explanation screen
        setMessages([]);

        later(900, () => {
          const first = activePrompts[0];
          setMessages([
            {
              id: `sec-${first.category}`,
              sender: "system",
              kind: "section",
              text: `${CATEGORY_ICONS[first.category]}  ${first.category}`,
            },
            { id: `q-${first.id}`, sender: "ai", text: first.q },
          ]);
        });
      } else {
        // Expansion
        const newPrompts = PROMPTS.filter(
          p => newCategories.includes(p.category) && p.essential && (p.phase === 1 || p.phase === undefined)
        );
        
        if (newPrompts.length > 0) {
          // Start fresh with new categories only
          const intro = `Let's explore ${newCategories.length} more life area${newCategories.length > 1 ? 's' : ''} 🌟`;
          setMessages([{ id: `expand-intro-${Date.now()}`, sender: "ai", text: intro }]);
          setStep(0); // Reset step to start fresh
          
          // Set the expansion prompts to only include new categories
          setExpansionPrompts(newPrompts);

          later(900, () => {
            const first = newPrompts[0];
            setMessages([
              { id: `expand-intro-${Date.now()}-1`, sender: "ai", text: intro },
              {
                id: `sec-${first.category}-${Date.now()}`,
                sender: "system",
                kind: "section",
                text: `${CATEGORY_ICONS[first.category]}  ${first.category}`,
              },
              { id: `q-${first.id}`, sender: "ai", text: first.q },
            ]);
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, activePrompts.length]);

  function persistOnboardingAnswer(payload: { stepKey: string; question?: string; response: string; category?: string }) {
    const now = Date.now();

    setOnboardingAnswerRecords((prev) => {
      const existing = prev.find((record) => record.stepKey === payload.stepKey);
      const updated: OnboardingAnswer = {
        id: existing?.id ?? `local-${payload.stepKey}`,
        stepKey: payload.stepKey,
        question: payload.question ?? null,
        answer: payload.response,
        category: payload.category ?? null,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      const filtered = prev.filter((record) => record.stepKey !== payload.stepKey);
      return [...filtered, updated];
    });

    void upsertOnboardingAnswerToSupabase(payload).then((result) => {
      if (result?.error) {
        devLog.error('Failed to persist onboarding answer to Supabase:', result.error);
        return;
      }

      const persisted = result?.data;
      if (persisted) {
        setOnboardingAnswerRecords((prev) => {
          const filtered = prev.filter((record) => record.stepKey !== persisted.stepKey);
          return [...filtered, persisted];
        });
      }
    });
  }

  /** Rating selection */
  function selectRating(score: number) {
    if (!ratingCategory) return;

    const updatedScores = { ...categoryScores, [ratingCategory]: score };
    setCategoryScores(updatedScores);
    
    // Add user's rating to chat
    const ratingMessage = { 
      id: `rating-${Date.now()}`, 
      sender: "you" as const, 
      text: `${score}/10` 
    };
    setMessages((prev) => [...prev, ratingMessage]);
    
    persistOnboardingAnswer({
      stepKey: `rating:${ratingCategory}`,
      question: `How would you rate ${ratingCategory}?`,
      response: `${score}/10`,
      category: ratingCategory,
    });

    const updatedCompletedCategories = completedCategories.includes(ratingCategory)
      ? completedCategories
      : [...completedCategories, ratingCategory];

    // Immediately save to localStorage
    try {
      const snapshot = buildPersistedStateSnapshot({
        route: resolveRouteForCache(route) ?? route,
        messages: [...messages, ratingMessage],
        step,
        input: "",
        selectedCategories,
        completedCategories: updatedCompletedCategories,
        categoryScores: updatedScores,
        categoryPhases,
        ratingCategory: null,
        expansionPrompts,
      });
      if (snapshot) {
        safeSetItem("innercode_state_v1", JSON.stringify(snapshot));
      }
    } catch (e) {
      devLog.error("Failed to save rating:", e);
    }
    
    // Mark this category as completed
    if (!completedCategories.includes(ratingCategory)) {
      setCompletedCategories(updatedCompletedCategories);
    }
    
    setRatingCategory(null);

    // Add brief acknowledgment of rating
    later(300, () => {
      const acknowledgments = [
        "Thank you.",
        "Got it.",
        "Noted.",
      ];
      const ack = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
      setMessages((prev) => [...prev, { id: `ack-rating-${Date.now()}`, sender: "ai", text: ack }]);
    });

    // Move to next category
    const currentLastIndex = lastIndexOfCategory[currentCategory];
      const nextIndex = currentLastIndex + 1;
      if (nextIndex < activePrompts.length) {
        const nextPrompt = activePrompts[nextIndex];
        const nextCategory = nextPrompt.category;
        later(700, () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `sec-${nextCategory}-${Date.now()}`,
              sender: "system",
              kind: "section",
              text: `${CATEGORY_ICONS[nextCategory]}  ${nextCategory}`,
            },
            { id: `q-${nextPrompt.id}`, sender: "ai", text: nextPrompt.q },
          ]);
          setStep(nextIndex);
        });
      } else {
        // FINISH → analyzing → results (or dashboard if this was expansion)
      const allAnswers = messages
        .filter((m) => m.sender === "you")
        .map((m) => m.text);
      
      const isExpansion = results !== null; // If results exist, this was an expansion
      
        if (isExpansion) {
          // Expansion complete - update results and go to results page with success message
          setRoute("analyzing");
          later(10000, () => {
            // Include journal entries in analysis
            const journalTexts = journalEntries.map((j) => j.text);
            const allTexts = [...allAnswers, ...journalTexts];
            
            // Preserve existing value scores by passing them to computeResults
            const previousValueScores = results?.valueEntries 
              ? Object.fromEntries(results.valueEntries) 
              : undefined;
            const computed = computeResults(allTexts, updatedScores, previousValueScores);
            setResults(computed);
            
            // 👇 PROGRESSIVE DEEPENING FEATURE START - Mark Phase 1 complete for newly completed categories
            const newlyCompleted = completedCategories.filter(cat => 
              !categoryPhases[cat]?.phase1Complete
            );
            let updatedPhases = { ...categoryPhases };
            if (newlyCompleted.length > 0) {
              newlyCompleted.forEach(cat => {
                if (!updatedPhases[cat]) {
                  updatedPhases[cat] = { phase1Complete: false, phase2Complete: false, phase3Complete: false };
                }
                updatedPhases[cat].phase1Complete = true;
                updatedPhases[cat].phase1Date = Date.now();
              });
              setCategoryPhases(updatedPhases);
            }
            // 👆 PROGRESSIVE DEEPENING FEATURE END
            
            setShowExpansionSuccess(true);
            setRoute("results");
            
            // Save updated onboarding state to Supabase after expansion completes
            // Note: messages state includes the rating message and acknowledgment added earlier
            // Preserve existing spark completions - only include if we have actual data
            const sparkCompletionsToSave = Object.keys(sparkCompletions).length > 0 
              ? sparkCompletions 
              : (userData.onboardingState?.spark_completions && typeof userData.onboardingState.spark_completions === 'object'
                  ? userData.onboardingState.spark_completions
                  : undefined);
            
            saveOnboardingStateToSupabase({
              messages, // Current messages state (includes rating and acknowledgment)
              step,
              selectedCategories,
              completedCategories: updatedCompletedCategories,
              categoryScores: updatedScores,
              categoryPhases: updatedPhases,
              hasSeenResults: true, // User has already seen results
              sparkCompletions: sparkCompletionsToSave,
            }).catch((error) => {
              devLog.error('Failed to save onboarding state after expansion', error);
            });
          });
        } else {
        // Initial onboarding complete - analyze then prompt signup
        setIsInOnboardingFlow(true); // Prevent auto-redirect during signup
        setRoute("analyzing");
        later(10000, () => {
          // Include journal entries in initial analysis
          const journalTexts = journalEntries.map((j) => j.text);
          const allTexts = [...allAnswers, ...journalTexts];
          const computed = computeResults(allTexts, categoryScores);
          setResults(computed);
          
          // 👇 PROGRESSIVE DEEPENING FEATURE START - Mark Phase 1 complete for all completed categories
          const newlyCompleted = completedCategories.filter(cat => 
            !categoryPhases[cat]?.phase1Complete
          );
          if (newlyCompleted.length > 0) {
            const updatedPhases = { ...categoryPhases };
            newlyCompleted.forEach(cat => {
              if (!updatedPhases[cat]) {
                updatedPhases[cat] = { phase1Complete: false, phase2Complete: false, phase3Complete: false };
              }
              updatedPhases[cat].phase1Complete = true;
              updatedPhases[cat].phase1Date = Date.now();
            });
            setCategoryPhases(updatedPhases);
          }
          // 👆 PROGRESSIVE DEEPENING FEATURE END
          
          // Debug logging
          devLog.log('After analyzing (rating path) - user state:', {
            hasUser: !!user,
            emailConfirmed: user?.email_confirmed_at,
            willGoTo: !user ? 'signup' : user.email_confirmed_at ? 'results' : 'verifyEmail'
          });
          
          // Check if user is authenticated - if yes, go to reveal flow/dashboard, if no, go to signup
            if (user && user.email_confirmed_at) {
              devLog.log('Routing to verifyEmail (user authenticated & verified – show pending screen next)');
              setRoute("verifyEmail");
          } else if (user && !user.email_confirmed_at) {
            // User is authenticated but not verified - go to verify email
            devLog.log('Routing to verifyEmail (user authenticated but not verified)');
            setRoute("verifyEmail");
          } else {
            // User is not authenticated - go to signup
            devLog.log('Routing to signup (no user authenticated)');
            setRoute("signup");
          }
        });
      }
    }
  }

  /** Submit answer */
  function submit(text: string, opts?: { fromChip?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || ratingCategory) return;

    const current = activePrompts[step];
    const newMessage = { id: `u-${Date.now()}`, sender: "you" as const, text: trimmed };
    const updatedMessages = [...messages, newMessage];
    
    setMessages(updatedMessages);
    setInput("");

    if (current) {
      persistOnboardingAnswer({
        stepKey: current.id,
        question: current.q,
        response: trimmed,
        category: current.category,
      });
    }

    // Immediately save to localStorage to prevent loss on refresh
    try {
      const snapshot = buildPersistedStateSnapshot({
        route: resolveRouteForCache(route) ?? route,
        messages: updatedMessages,
        step,
        input: "",
        selectedCategories,
        completedCategories,
        categoryScores,
        categoryPhases,
        ratingCategory,
        expansionPrompts,
      });
      if (snapshot) {
        safeSetItem("innercode_state_v1", JSON.stringify(snapshot));
      }
    } catch (e) {
      devLog.error("Failed to immediately save message:", e);
    }

    const isChip = !!opts?.fromChip;
    const words = wc(trimmed);
    const isLong = words >= 30;
    const isShort = !isChip && words <= 3;
    const delay = isLong ? 1200 : 600;

    if (isLong) {
      setShowToast(true);
      later(1700, () => setShowToast(false));
    }

    if (isShort) {
      later(300, () => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ack-${Date.now()}`,
            sender: "ai",
            text: `I hear you. Could you share a bit more? Maybe a story about when this last happened, or how it made you feel.`,
          },
        ]);
      });
      return;
    } else {
      // For normal or long answers, give an empathetic acknowledgment (no questions)
      later(200, () => {
        const { reflection } = reflectAnswer(trimmed);
        
        // Create thoughtful responses - remove any questions from reflections
        let responseText = "";
        
        if (isLong) {
          // Appreciate detailed sharing
          if (reflection) {
            // Remove question from reflection and make it a statement
            const reflectionWithoutQuestion = reflection.replace(/\?\s*$/, '.').replace(/Does that feel accurate\?/i, 'I can sense that in your words.');
            responseText = `Thank you for opening up. ${reflectionWithoutQuestion}`;
          } else {
            responseText = "I really appreciate you sharing that with me. The more you share, the better I can understand what matters to you 💙";
          }
        } else {
          // Normal length - simple validation (never questions)
          const validations = [
            "Thank you for sharing that.",
            "I appreciate your honesty.",
            "That's helpful to know.",
            "I can sense what matters to you here.",
          ];
          responseText = validations[Math.floor(Math.random() * validations.length)];
        }
        
        setMessages((prev) => [
          ...prev,
          { id: `ack-${Date.now()}`, sender: "ai", text: responseText },
        ]);
      });
    }

    // Next step logic
    const isLastInCategory = step === lastIndexOfCategory[current.category];
    const next = step + 1;

    if (isLastInCategory) {
      later(delay, () => {
        setMessages((prev) => [
          ...prev,
          {
            id: `rate-${current.category}-${Date.now()}`,
            sender: "ai",
            text: `Before we continue, how would you rate "${current.category}" right now on a scale of 0–10?\n0 = struggling • 10 = thriving.`,
          },
        ]);
        setRatingCategory(current.category);
      });
      return;
    }

    if (next < activePrompts.length) {
      const nextPrompt = activePrompts[next];
      const prevCategory = current.category;
      const nextCategory = nextPrompt.category;

      later(delay, () => {
        const newMsgs: Msg[] = [];
        if (nextCategory !== prevCategory) {
          newMsgs.push({
            id: `sec-${nextCategory}-${Date.now()}`,
            sender: "system",
            kind: "section",
            text: `${CATEGORY_ICONS[nextCategory]}  ${nextCategory}`,
          });
        }
        newMsgs.push({
          id: `q-${nextPrompt.id}`,
          sender: "ai",
          text: nextPrompt.q,
        });
        setMessages((prev) => [...prev, ...newMsgs]);
        setStep(next);
      });
    } else {
      // Safety: fallback completion path
      later(delay, () => {
        const allAnswers = [
          ...messages.filter((m) => m.sender === "you").map((m) => m.text),
          trimmed,
        ];
        
        const isExpansion = results !== null; // If results exist, this was an expansion
        
        if (isExpansion) {
          // Expansion complete - update results and go to results page with success message
          setRoute("analyzing");
          later(10000, () => {
            // Include journal entries in analysis
            const journalTexts = journalEntries.map((j) => j.text);
            const allTexts = [...allAnswers, ...journalTexts];
            
            // Preserve existing value scores by passing them to computeResults
            const previousValueScores = results?.valueEntries 
              ? Object.fromEntries(results.valueEntries) 
              : undefined;
            const computed = computeResults(allTexts, categoryScores, previousValueScores);
            setResults(computed);
            
            // 👇 PROGRESSIVE DEEPENING FEATURE START - Mark Phase 1 complete for newly completed categories
            const newlyCompleted = completedCategories.filter(cat => 
              !categoryPhases[cat]?.phase1Complete
            );
            let updatedPhases = { ...categoryPhases };
            if (newlyCompleted.length > 0) {
              newlyCompleted.forEach(cat => {
                if (!updatedPhases[cat]) {
                  updatedPhases[cat] = { phase1Complete: false, phase2Complete: false, phase3Complete: false };
                }
                updatedPhases[cat].phase1Complete = true;
                updatedPhases[cat].phase1Date = Date.now();
              });
              setCategoryPhases(updatedPhases);
            }
            // 👆 PROGRESSIVE DEEPENING FEATURE END
            
            setShowExpansionSuccess(true);
            setRoute("results");
            
            // Save updated onboarding state to Supabase after expansion completes
            // Preserve existing spark completions - only include if we have actual data
            const sparkCompletionsToSave = Object.keys(sparkCompletions).length > 0 
              ? sparkCompletions 
              : (userData.onboardingState?.spark_completions && typeof userData.onboardingState.spark_completions === 'object'
                  ? userData.onboardingState.spark_completions
                  : undefined);
            
            saveOnboardingStateToSupabase({
              messages: updatedMessages, // Include the final submitted message
              step,
              selectedCategories,
              completedCategories,
              categoryScores,
              categoryPhases: updatedPhases,
              hasSeenResults: true, // User has already seen results
              sparkCompletions: sparkCompletionsToSave,
            }).catch((error) => {
              devLog.error('Failed to save onboarding state after expansion', error);
            });
          });
        } else {
          // Initial onboarding complete - analyze then prompt signup
          setIsInOnboardingFlow(true); // Prevent auto-redirect during signup
          setRoute("analyzing");
          later(10000, () => {
            // Include journal entries in initial analysis
            const journalTexts = journalEntries.map((j) => j.text);
            const allTexts = [...allAnswers, ...journalTexts];
            const computed = computeResults(allTexts, categoryScores);
            setResults(computed);
            
            // 👇 PROGRESSIVE DEEPENING FEATURE START - Mark Phase 1 complete for all completed categories
            const newlyCompleted = completedCategories.filter(cat => 
              !categoryPhases[cat]?.phase1Complete
            );
            if (newlyCompleted.length > 0) {
              const updatedPhases = { ...categoryPhases };
              newlyCompleted.forEach(cat => {
                if (!updatedPhases[cat]) {
                  updatedPhases[cat] = { phase1Complete: false, phase2Complete: false, phase3Complete: false };
                }
                updatedPhases[cat].phase1Complete = true;
                updatedPhases[cat].phase1Date = Date.now();
              });
              setCategoryPhases(updatedPhases);
            }
            // 👆 PROGRESSIVE DEEPENING FEATURE END
            
            // Debug logging
            devLog.log('After analyzing - user state:', {
              hasUser: !!user,
              emailConfirmed: user?.email_confirmed_at,
              willGoTo: !user ? 'signup' : user.email_confirmed_at ? 'results' : 'verifyEmail'
            });
            
            // Check if user is authenticated - if yes, go to results, if no, go to signup
            if (user && user.email_confirmed_at) {
              // User is already authenticated and verified - go to results
              devLog.log('Routing to results (user authenticated & verified)');
              setRoute("results");
            } else if (user && !user.email_confirmed_at) {
              // User is authenticated but not verified - go to verify email
              devLog.log('Routing to verifyEmail (user authenticated but not verified)');
              setRoute("verifyEmail");
            } else {
              // User is not authenticated - go to signup
              devLog.log('Routing to signup (no user authenticated)');
              setRoute("signup");
            }
          });
        }
      });
    }
  }

  // 👇 PROGRESSIVE DEEPENING FEATURE START
  // Handler for deepening a category to Phase 2 or 3
  const handleDeepenCategory = (category: string) => {
    if (!FEATURES.PROGRESSIVE_DEEPENING) return;
    
    // For now, just show a message - full Phase 2/3 implementation would involve:
    // 1. Filtering prompts by phase
    // 2. Starting new onboarding flow for that phase
    // 3. Marking phase complete when done
    alert(`Deepening ${category} coming soon! This will open Phase 2 questions to explore this area more deeply.`);
  };
  // 👆 PROGRESSIVE DEEPENING FEATURE END

  /** Auth Loading State */
  const routesRequiringHydratedData = useMemo(
    () =>
      new Set<Route>([
        "dashboard",
        "results",
        "journal",
        "journalCalendar",
        "aiCoach",
        "instructions",
        "howToUseInny",
        "settings",
      ]),
    []
  );

  const [hydrationFallbackTriggered, setHydrationFallbackTriggered] = useState(false);
  const [showSkipLoading, setShowSkipLoading] = useState(false);

  useEffect(() => {
    if (hydrationStatus === 'remote' || hydrationStatus === 'cache') {
      if (hydrationFallbackTriggered) {
        setHydrationFallbackTriggered(false);
      }
      if (showSkipLoading) {
        setShowSkipLoading(false);
      }
      return;
    }

    // First fallback after 2.5s
    const fallbackTimeout = setTimeout(() => {
      setHydrationFallbackTriggered(true);
    }, 2500);

    // Show skip option after 5s
    const skipTimeout = setTimeout(() => {
      setShowSkipLoading(true);
    }, 5000);

    return () => {
      clearTimeout(fallbackTimeout);
      clearTimeout(skipTimeout);
    };
  }, [hydrationStatus, hydrationFallbackTriggered, showSkipLoading]);

  // CRITICAL FIX: Aggressive timeout fallback to prevent infinite loading
  // This acts as a failsafe even if other timeouts fail (e.g., on mobile browsers)
  // Detect dev server for shorter timeout
  const isDevServer = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('192.168'));

  useEffect(() => {
    if (hydrationStatus === 'remote' || hydrationStatus === 'cache') {
      return;
    }

    // Shorter timeout on dev server (5s) vs production (8s) due to potential delays
    const timeoutMs = isDevServer ? 5000 : 8000;
    
    const maxTimeout = setTimeout(() => {
      if (hydrationStatus === 'idle' || (hydrationStatus === 'error' && !syncComplete)) {
        devLog.warn(`Maximum hydration timeout reached (${timeoutMs}ms) - forcing fallback`);
        setHydrationFallbackTriggered(true);
        setShowSkipLoading(true);
      }
    }, timeoutMs);

    return () => {
      clearTimeout(maxTimeout);
    };
  }, [hydrationStatus, syncComplete, isDevServer]);

  // CRITICAL FIX: Restore route after hydration completes
  // This handles cases where getInitialRoute() didn't restore the route (e.g., hydration not complete yet)
  // MUST be before early returns to ensure hooks are called in consistent order
  useEffect(() => {
    // Wait for sync to complete
    if (!syncComplete) {
      return;
    }
    
    // Don't restore if we're already on the correct route
    const lastActiveRoute = safeGetItem('innercode_lastActiveRoute');
    if (!lastActiveRoute || lastActiveRoute === route) {
      return;
    }
    
    const validRoutes: Route[] = [
      'dashboard', 'journal', 'journalCalendar', 'aiCoach', 
      'results', 'settings', 'instructions', 'howToUseInny', 'quickCheckIn', 'goals'
    ];
    
    if (!validRoutes.includes(lastActiveRoute as Route)) {
      return;
    }
    
    // Only restore if user is authenticated and has completed onboarding
    if (user?.email_confirmed_at) {
      const hasResults = !!userData.results || !!safeGetItem('innercode_results');
      const hasSeenResults = !!userData.onboardingState?.has_seen_results || 
                             safeGetItem('innercode_hasSeenResults') === 'true';
      if (hasResults && hasSeenResults) {
        devLog.log('Restoring last active route after hydration:', lastActiveRoute);
        setRoute(lastActiveRoute as Route);
      }
    }
  }, [syncComplete, route, user, userData]);

  if (authLoading) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
            <div style={{ fontSize: 18, color: "#6b6b6b" }}>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (hydratingAfterVerification) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
            <div style={{ fontSize: 18, color: "#6b6b6b" }}>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  // CRITICAL FIX: Improved loading screen logic with fallback and skip option
  // Also check syncComplete - if syncComplete is true but hydrationStatus is still 'idle', treat as error/cache
  const isStuckLoading = 
    (hydrationStatus === 'idle' && !syncComplete) || 
    (hydrationStatus === 'idle' && syncComplete && authLoading) || // Still loading auth
    (hydrationStatus === 'error' && !syncComplete);
  
  if (
    isStuckLoading &&
    routesRequiringHydratedData.has(route) &&
    !hydrationFallbackTriggered
  ) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌿</div>
            <div style={{ fontSize: 18, color: "#6b6b6b", marginBottom: showSkipLoading ? 20 : 0 }}>
              Loading...
            </div>
            {showSkipLoading && (
              <button
                onClick={() => {
                  // Force fallback to cache/error state
                  setHydrationFallbackTriggered(true);
                  // Try to load from local cache
                  const storage = getSafeLocalStorage();
                  const localState = safeGetItem('innercode_state_v1');
                  const localResults = safeGetItem('innercode_results');
                  if (localState || localResults) {
                    // If we have local data, we can proceed
                    devLog.log('User skipped loading - using local cache');
                  } else {
                    // No local data - redirect to landing
                    devLog.warn('User skipped loading but no local cache - redirecting to landing');
                    setRoute('newLanding');
                  }
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "2px solid #8B5CF6",
                  background: "#fff",
                  color: "#8B5CF6",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  marginTop: 16,
                }}
              >
                Skip Loading
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  /** Routes */
  if (route === "landing") {
    return (
      <>
        <GlobalStyles />
        <Landing
          onSignUp={() => setRoute("signup")}
          onLogin={() => setRoute("login")}
        />
      </>
    );
  }

  if (route === "newLanding") {
    return (
      <>
        <GlobalStyles />
        <NewLanding
          onGetStarted={() => setRoute("whatIsInnerCode")}
          onLogin={() => setRoute("login")}
        />
      </>
    );
  }

  if (route === "whatIsInnerCode") {
    return (
      <>
        <GlobalStyles />
        <WhatIsInnerCode
          onContinue={() => setRoute("nameCollection")}
          onBack={() => setRoute("newLanding")}
        />
      </>
    );
  }

  if (route === "nameCollection") {
    return (
      <>
        <GlobalStyles />
        <NameCollection
          onContinue={(name) => {
            setUserName(name);
            setRoute("categorySelection");
          }}
          onBack={() => setRoute("newLanding")}
        />
      </>
    );
  }

  if (route === "signup") {
    return (
      <>
        <GlobalStyles />
        <SignUp
          onSignUp={async (email, password, firstName, lastName, country) => {
            const result = await signUp(email, password, firstName, lastName, country);
            // Don't manually set route - let getInitialRoute() handle it
            // It will automatically show verifyEmail page for unverified users
            return result;
          }}
          onBack={() => setRoute("nameCollection")}
          prefillName={userName}
        />
      </>
    );
  }

  if (route === "login") {
    return (
      <>
        <GlobalStyles />
        <Login
          onLogin={async (email, password) => {
            const result = await signIn(email, password);
            if (!result.error) {
              // Will automatically redirect via useEffect when user state updates
            }
            return result;
          }}
          onBack={() => setRoute("newLanding")}
        />
      </>
    );
  }

  if (route === "verifyEmail") {
    // Get email from URL parameter or user object
    const urlParams = new URLSearchParams(window.location.search);
    const verifyEmail = urlParams.get('verify');
    const email = verifyEmail || user?.email || "";
    
    return (
      <>
        <GlobalStyles />
        <VerifyEmail
          email={email}
          onResendEmail={async () => {
            // Resend verification email
            if (user?.email) {
              const supabase = await getSupabaseClient();
              await supabase.auth.resend({
                type: 'signup',
                email: user.email,
              });
            }
          }}
          onLogout={signOut}
          onVerified={async () => {
            const clearAuthParams = () => {
              try {
                if (typeof window !== 'undefined') {
                  const baseUrl = `${window.location.origin}${window.location.pathname}`;
                  window.history.replaceState(null, '', baseUrl);
                }
              } catch (err) {
                devLog.error('Failed to clear auth params from URL', err);
              }
            };

            setHydratingAfterVerification(true);

            let latestData = userData;
            try {
              latestData = await refreshUserData();
            } catch (error) {
              devLog.error('Failed to refresh user data after verification', error);
            } finally {
              setHydratingAfterVerification(false);
            }

            const hasRemoteResults = !!latestData.results;
            const hasRemoteSeenResults = !!latestData.onboardingState?.has_seen_results;

            clearAuthParams();

            if (hasRemoteResults) {
              const storage = getSafeLocalStorage();
              if (hasRemoteSeenResults) {
                setPendingReveal(false);
                storage?.removeItem('innercode_pendingReveal');
                storage?.setItem('innercode_hasSeenResults', 'true');
                setRoute("dashboard");
                return;
              }

              setPendingReveal(true);
              storage?.setItem('innercode_pendingReveal', 'true');
              storage?.removeItem('innercode_hasSeenResults');
              setRoute("welcomeBack");
              return;
            }

            window.location.href = window.location.origin;
          }}
        />
      </>
    );
  }

  if (route === "welcomeBack") {
    return (
      <>
        <GlobalStyles />
        <WelcomeBack
          userName={userName}
          onRevealResults={handleRevealResults}
        />
      </>
    );
  }

  if (route === "dashboard") {
    // CRITICAL FIX: Require authentication for dashboard
    if (!user || !user.email_confirmed_at) {
      // Redirect to landing if not authenticated
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    // Check if user has partial onboarding progress (no results but has started)
    const hasPartialOnboarding = !results && (messages.length > 0 || step > 0);
    const hasCompletedOnboarding = !!results;
    
    // Check if user has selected categories they haven't completed yet
    const hasIncompleteCategories = selectedCategories.some(
      cat => !completedCategories.includes(cat)
    );
    
    const canExpandCategories = completedCategories.length < categories.length;
    
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <Dashboard
          userName={userName}
          userId={user?.id || undefined}
          onViewResults={() => setRoute("results")}
          onJournal={() => setRoute("journal")}
          onAICoach={() => setRoute("aiCoach")}
          onHowItWorks={() => setRoute("instructions")}
          onHowToUseInny={() => setRoute("howToUseInny")}
          onContinueOnboarding={hasIncompleteCategories ? () => setRoute("onboarding") : hasPartialOnboarding ? () => setRoute("onboarding") : undefined}
          onExpandCategories={canExpandCategories ? () => setRoute("categorySelection") : undefined}
          onStartCheckIn={() => setRoute("quickCheckIn")}
          journalEntries={journalEntries}
          categoryScores={categoryScores}
          completedCategories={completedCategories}
          totalCategories={categories.length}
          valueEntries={results?.valueEntries || []}
          hasPartialOnboarding={hasPartialOnboarding}
          hasCompletedOnboarding={hasCompletedOnboarding}
          hasIncompleteCategories={hasIncompleteCategories}
          onboardingAnswers={onboardingAnswers}
          journalSummary={journalSummary}
          recentJournalEntries={recentJournalEntries}
          sparkCompletions={sparkCompletions}
          onSparkCompletionsPersist={persistSparkCompletions}
          goals={goals}
          goalsUnlocked={goalsUnlocked}
          onViewGoals={() => setRoute("goals")}
        />
      </>
    );
  }

  if (route === "instructions") {
    // Check if user is existing (has results or started onboarding)
    const isExistingUser = !!results || messages.length > 0 || step > 0;
    return (
      <>
        <GlobalStyles />
        <Instructions 
          onContinue={() => setRoute("categorySelection")} 
          hideStartButton={isExistingUser}
          onBack={() => setRoute("dashboard")}
        />
      </>
    );
  }

  if (route === "howToUseInny") {
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <HowToUseInny
          onBack={() => setRoute("dashboard")}
          onOpenAICoach={() => setRoute("aiCoach")}
        />
      </>
    );
  }

  if (route === "categorySelection") {
    // isExpanding should be true only if user has COMPLETED categories and wants to add more
    // NOT if they just selected categories but haven't completed onboarding for them yet
    const isExpanding = completedCategories.length > 0;
    const availableCategories = isExpanding 
      ? categories.filter(cat => !selectedCategories.includes(cat))
      : categories;
    
    return (
      <>
        <GlobalStyles />
        {/* Hide menu during initial onboarding, show it during expansion */}
        {isExpanding && <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />}
        <CategorySelection
          categories={availableCategories}
          preselected={isExpanding ? [] : selectedCategories}
          minSelection={isExpanding ? 1 : 3}
          maxSelection={isExpanding ? Math.min(3, availableCategories.length) : 3}
          isExpanding={isExpanding}
          currentProgress={completedCategories.length}
          onBack={!isExpanding ? () => setRoute("nameCollection") : undefined}
          onContinue={(selected) => {
            // Merge new selections with existing ones
            const updatedSelections = isExpanding 
              ? [...selectedCategories, ...selected]
              : selected;
            
            // If this is an expansion, clear old onboarding state to start fresh
            if (isExpanding) {
              setMessages([]);
              setStep(0);
              setRatingCategory(null);
              setExpansionPrompts([]); // Clear so initialization runs
            }
            
            // Save immediately to localStorage (don't wait for useEffect)
            try {
              const snapshot = buildPersistedStateSnapshot({
                route: resolveRouteForCache(route) ?? route,
                messages: isExpanding ? [] : messages,
                step: isExpanding ? 0 : step,
                input,
                selectedCategories: updatedSelections,
                completedCategories,
                categoryScores,
                categoryPhases,
                ratingCategory: isExpanding ? null : ratingCategory,
                expansionPrompts: isExpanding ? [] : expansionPrompts,
              });
              if (snapshot) {
                safeSetItem("innercode_state_v1", JSON.stringify(snapshot));
              }
            } catch (e) {
              devLog.error("Failed to save selectedCategories:", e);
            }
            
            setSelectedCategories(updatedSelections);
            setRoute("onboarding");
          }}
        />
      </>
    );
  }

  if (route === "onboarding") {
    // CRITICAL: Prevent rendering onboarding if user has unseen results
    const hasResults = !!userData.results;
    const hasSeenResults = !!userData.onboardingState?.has_seen_results;
    const isCompletedUser = hasResults && hasSeenResults;
    
    // Check if this is an expansion scenario (user has new categories to complete)
    const newCategories = selectedCategories.filter(
      cat => !completedCategories.includes(cat)
    );
    const hasNewCategoriesToComplete = newCategories.length > 0;
    
    // Only redirect to welcomeBack if:
    // 1. User has completed onboarding AND
    // 2. This is NOT an expansion (no new categories to complete)
    if (isCompletedUser && !hasNewCategoriesToComplete) {
      // Immediately redirect to welcomeBack without rendering onboarding
      setRoute("welcomeBack");
      return null; // Return nothing to prevent flash
    }
    
    // Hide menu during initial onboarding, show during expansion
    const isExpansion = results !== null;
    
    return (
      <>
        <GlobalStyles />
        {isExpansion && <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />}
        <Toast text="Saved ✓" show={showToast} />
        <EnhancedOnboarding
          messages={messages}
          step={step}
          input={input}
          setInput={setInput}
          ratingCategory={ratingCategory}
          onSubmit={submit}
          onSelectRating={selectRating}
          categories={categories}
          activePrompts={activePrompts}
          selectedCategories={selectedCategories}
        />
      </>
    );
  }

  if (route === "analyzing") {
    return (
      <>
        <GlobalStyles />
        <AnalyzingOverlay />
      </>
    );
  }

  if (route === "results" && results) {
    // CRITICAL FIX: Require authentication for results
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <Results
          personalCode={results.personalCode}
          aligned={results.aligned}
          improvement={results.improvement}
          valueEntries={results.valueEntries}
          categoryScores={categoryScores}
          completedCategories={completedCategories}
          totalCategories={categories.length}
          journalEntries={journalEntries}
          suggestions={results.suggestions}
          weakAreaSuggestions={results.weakAreaSuggestions}
          valueStrengthSuggestions={results.valueStrengthSuggestions}
          discoveryAreaSuggestions={results.discoveryAreaSuggestions}
          onOpenJournal={() => setRoute("journal")}
          onRecompute={() => {
            // Recompute results with current data, preserving existing value scores
            const onboardingAnswers = messages
              .filter((m) => m.sender === "you")
              .map((m) => m.text);
            const journalTexts = journalEntries.map((j) => j.text);
            const allAnswers = [...onboardingAnswers, ...journalTexts];
            
            const previousValueScores = results?.valueEntries 
              ? Object.fromEntries(results.valueEntries) 
              : undefined;
            const computed = computeResults(allAnswers, categoryScores, previousValueScores);
            setResults(computed);
          }}
          showExpansionSuccess={showExpansionSuccess}
          onExpansionSuccessComplete={() => setShowExpansionSuccess(false)}
          categoryPhases={categoryPhases}
          onDeepenCategory={handleDeepenCategory}
          pendingReveal={pendingReveal}
          onCelebrationComplete={finalizeReveal}
        />
      </>
    );
  }

  if (route === "journal") {
    // CRITICAL FIX: Require authentication for journal
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <Journal
          onBack={() => setRoute("results")}
          categories={[...categories]}
          categoryIcons={{ ...CATEGORY_ICONS }}
          valuesPool={Object.keys(VALUE_ICONS)}
          valueIcons={VALUE_ICONS}
          entries={journalEntries}
          addEntry={addJournalEntry}
          goals={goals.map((g) => ({ id: g.id, title: g.title }))}
          goalsUnlocked={goalsUnlocked}
        />
      </>
    );
  }

  if (route === "goals") {
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <Goals
          onBack={() => setRoute("dashboard")}
          goals={goals}
          onSaveGoals={(next) => {
            refreshUserData();
          }}
          onAfterSave={() => refreshUserData()}
          unlockProgress={goalsUnlockProgress}
          valueEntries={results?.valueEntries ?? []}
          completedCategories={completedCategories}
          categoryScores={categoryScores}
        />
      </>
    );
  }

  if (route === "aiCoach") {
    // CRITICAL FIX: Require authentication for AI Coach
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <AICoach
          weakAreaSuggestions={results?.weakAreaSuggestions || []}
          valueStrengthSuggestions={results?.valueStrengthSuggestions || []}
          discoveryAreaSuggestions={results?.discoveryAreaSuggestions || []}
          userName={userName}
          categoryScores={categoryScores}
          completedCategories={completedCategories}
          valueEntries={results?.valueEntries || []}
          onboardingAnswers={onboardingAnswers}
          journalSummary={journalSummary}
          recentJournalEntries={recentJournalEntries}
          goalsSummary={buildGoalsSummary(goals)}
          onBack={() => setRoute("dashboard")}
          onJournal={(prompt, suggestion) => {
            // Navigate to journal with pre-filled prompt
            setRoute("journal");
          }}
        />
      </>
    );
  }

  if (route === "journalCalendar") {
    // CRITICAL FIX: Require authentication for journal calendar
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <JournalCalendar
          entries={journalEntries}
          onBack={() => setRoute("results")}
        />
      </>
    );
  }

  // Settings route
  if (route === "settings") {
    // CRITICAL FIX: Require authentication for settings
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    return (
      <>
        <GlobalStyles />
        <FloatingMenu onNav={(r) => setRoute(r)} onLogout={signOut} goalsUnlocked={goalsUnlocked} />
        <Settings
          userName={userName}
          onBack={() => setRoute("dashboard")}
          onLogout={() => void signOut()}
          onResetOnboarding={() => {
            // Clear onboarding data but keep journals
            safeRemoveItem("innercode_results");
            safeRemoveItem("innercode_state_v1");
            safeRemoveItem("innercode_hasSeenResults");
            setResults(null);
            setMessages([]);
            setStep(0);
            setSelectedCategories([]);
            setCompletedCategories([]);
            setCategoryScores(objFromEntries(categories.map((c) => [c, 5])));
            setRoute("instructions");
          }}
          onResetAllData={() => {
            // Call signOut which clears everything and redirects
            signOut();
          }}
        />
      </>
    );
  }

  // 👇 WEEKLY CHECK-IN FEATURE START
  if (route === "quickCheckIn" && FEATURES.WEEKLY_CHECKIN) {
    // CRITICAL FIX: Require authentication for quick check-in
    if (!user || !user.email_confirmed_at) {
      return (
        <>
          <GlobalStyles />
          <NewLanding
            onGetStarted={() => setRoute("whatIsInnerCode")}
            onLogin={() => setRoute("login")}
          />
        </>
      );
    }
    
    const checkInHistory = getCheckInHistorySync();
    const areasToCheck = getAreasForCheckIn(completedCategories, categoryScores, checkInHistory);
    
    return (
      <>
        <GlobalStyles />
        <QuickCheckIn
          areas={areasToCheck}
          currentScores={categoryScores}
          onComplete={async (updatedScores) => {
            setCategoryScores(updatedScores);
            // CRITICAL FIX: Wait for refresh to complete before navigating
            try {
              await refreshUserData();
              // Force a small delay to ensure localStorage is updated
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
              devLog.error('Failed to refresh user data after check-in', error);
            }
            setRoute("dashboard");
          }}
          onBack={() => setRoute("dashboard")}
          onboardingAnswers={onboardingAnswers}
          journalSummary={journalSummary}
          recentJournalEntries={recentJournalEntries}
          goalsSummary={buildGoalsSummary(goals)}
        />
      </>
    );
  }
  // 👆 WEEKLY CHECK-IN FEATURE END

  return (
    <>
      <GlobalStyles />
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Loading…
      </div>
    </>
  );
}

