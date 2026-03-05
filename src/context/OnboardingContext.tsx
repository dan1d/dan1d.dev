"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "dan1d-onboarding-dismissed";

interface OnboardingContextValue {
  /** null = still checking localStorage, false = not dismissed, true = dismissed */
  ready: boolean | null;
  dismiss: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  ready: null,
  dismiss: () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Start as null (unknown) — means "still checking, don't render modal yet"
  const [ready, setReady] = useState<boolean | null>(null);

  // Check localStorage after mount — avoids SSR hydration mismatch
  useEffect(() => {
    setReady(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setReady(true);
  }, []);

  return (
    <OnboardingContext.Provider value={{ ready, dismiss }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
