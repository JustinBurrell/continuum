import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { getOrderedTourSteps } from './tourConfig';

// Build the flat step list for this user.
// isReplay = true → skip all profile setup steps, go straight to tour.
function computeSteps(user, isReplay) {
  const steps = [];

  if (!isReplay) {
    steps.push({ kind: 'profile', key: 'welcome' });
    steps.push({ kind: 'profile', key: 'goal' });
    // Name/username step only for Google OAuth users — their username is auto-generated
    // and needs confirmation. Email/password users explicitly chose their name at signup.
    if (user?.googleId) {
      steps.push({ kind: 'profile', key: 'name' });
    }
    steps.push({ kind: 'profile', key: 'photo-bio' });
    steps.push({ kind: 'profile', key: 'social-links' });
    // Skip notifications if the browser has already granted permission
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      steps.push({ kind: 'profile', key: 'notifications' });
    }
    // Skip Google Drive if the user has already linked their Google account
    if (!user?.googleId) {
      steps.push({ kind: 'profile', key: 'google-drive' });
    }
  }

  const tourSteps = getOrderedTourSteps(user?.onboardingGoal ?? 'not_sure');
  tourSteps.forEach((config, tourIndex) => {
    steps.push({ kind: 'tour', tourStep: config, tourIndex });
  });

  steps.push({ kind: 'done' });

  return steps;
}

export function useOnboarding(isReplay) {
  const { user, updateUser } = useAuth();
  const steps = useMemo(
    () => computeSteps(user, isReplay),
    // Recompute only when goal or googleId changes (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.googleId, user?.onboardingGoal, isReplay]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [stepsSkipped, setStepsSkipped] = useState(0);

  const currentStep = steps[Math.min(currentIndex, steps.length - 1)];
  // Total visible steps (exclude the invisible 'done' sentinel)
  const totalSteps = steps.length - 1;
  const stepNumber = currentIndex + 1;

  // Fire POST /api/auth/me/onboarding/complete exactly once,
  // at the moment the user transitions from the last profile step to the first tour step.
  const maybeCompleteOnboarding = useCallback(async (fromIndex) => {
    if (isReplay || user?.onboardingCompleted) return;
    const nextStep = steps[fromIndex + 1];
    const currentStep = steps[fromIndex];
    if (currentStep?.kind === 'profile' && nextStep?.kind === 'tour') {
      try {
        await api.post('/auth/me/onboarding/complete');
        updateUser({ onboardingCompleted: true });
      } catch (_) { /* non-blocking */ }
    }
  }, [isReplay, user?.onboardingCompleted, steps, updateUser]);

  const advance = useCallback(async (stepName) => {
    await maybeCompleteOnboarding(currentIndex);
    setStepsCompleted(c => c + 1);
    setCurrentIndex(i => Math.min(i + 1, steps.length - 1));
  }, [currentIndex, maybeCompleteOnboarding, steps.length]);

  const skip = useCallback(async (stepName) => {
    await maybeCompleteOnboarding(currentIndex);
    setStepsSkipped(s => s + 1);
    setCurrentIndex(i => Math.min(i + 1, steps.length - 1));
  }, [currentIndex, maybeCompleteOnboarding, steps.length]);

  const completeTour = useCallback(async () => {
    try {
      await api.post('/auth/me/tour/complete');
      updateUser({ tourCompleted: true });
    } catch (_) { /* non-blocking */ }
  }, [updateUser]);

  // X button — fires both completion endpoints regardless of current step
  const exitAll = useCallback(async () => {
    if (!isReplay && !user?.onboardingCompleted) {
      try { await api.post('/auth/me/onboarding/complete'); } catch (_) {}
      updateUser({ onboardingCompleted: true });
    }
    await completeTour();
  }, [isReplay, user?.onboardingCompleted, updateUser, completeTour]);

  return {
    currentStep,
    currentIndex,
    totalSteps,
    stepNumber,
    stepsCompleted,
    stepsSkipped,
    advance,
    skip,
    exitAll,
    completeTour,
    isProfilePhase: currentStep?.kind === 'profile',
    isTourPhase: currentStep?.kind === 'tour',
    isDone: currentStep?.kind === 'done',
  };
}
