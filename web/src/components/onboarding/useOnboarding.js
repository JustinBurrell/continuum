import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { posthog } from '@/lib/posthog';
import { getOrderedTourSteps } from './tourConfig';

function computeSteps(user, isReplay) {
  const steps = [];

  if (!isReplay) {
    steps.push({ kind: 'profile', key: 'welcome' });
    steps.push({ kind: 'profile', key: 'goal' });
    // Name step only for Google OAuth — their username is auto-generated
    if (user?.googleId) {
      steps.push({ kind: 'profile', key: 'name' });
    }
    steps.push({ kind: 'profile', key: 'photo-bio' });
    steps.push({ kind: 'profile', key: 'social-links' });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.googleId, user?.onboardingGoal, isReplay]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [stepsCompleted, setStepsCompleted] = useState(0);
  const [stepsSkipped, setStepsSkipped] = useState(0);

  const currentStep = steps[Math.min(currentIndex, steps.length - 1)];
  const totalSteps = steps.length - 1; // exclude 'done' sentinel
  const stepNumber = currentIndex + 1;

  // Synchronous advance — state update happens immediately.
  // API calls and analytics are fire-and-forget so they cannot block navigation.
  const advance = useCallback((stepName) => {
    // Profile step analytics
    if (currentStep?.kind === 'profile') {
      try {
        posthog.capture('onboarding_step_completed', {
          platform: 'web',
          step_name: stepName ?? currentStep.key,
          step_index: currentIndex,
        });
      } catch (_) {}
    }

    // Fire onboarding/complete once at the profile→tour boundary
    const nextStep = steps[currentIndex + 1];
    if (
      !isReplay &&
      !user?.onboardingCompleted &&
      currentStep?.kind === 'profile' &&
      nextStep?.kind === 'tour'
    ) {
      try {
        posthog.capture('onboarding_completed', {
          platform: 'web',
          steps_completed: stepsCompleted + 1,
          steps_skipped: stepsSkipped,
          completed_via: 'finish',
        });
      } catch (_) {}
      api.post('/auth/me/onboarding/complete')
        .then(() => updateUser({ onboardingCompleted: true }))
        .catch(() => {});
    }

    setStepsCompleted(c => c + 1);
    setCurrentIndex(i => Math.min(i + 1, steps.length - 1));
  }, [currentIndex, currentStep, steps, isReplay, user?.onboardingCompleted, updateUser, stepsCompleted, stepsSkipped]);

  const skip = useCallback((stepName) => {
    if (currentStep?.kind === 'profile') {
      try {
        posthog.capture('onboarding_step_skipped', {
          platform: 'web',
          step_name: stepName ?? currentStep.key,
          step_index: currentIndex,
        });
      } catch (_) {}
    }

    const nextStep = steps[currentIndex + 1];
    if (
      !isReplay &&
      !user?.onboardingCompleted &&
      currentStep?.kind === 'profile' &&
      nextStep?.kind === 'tour'
    ) {
      try {
        posthog.capture('onboarding_completed', {
          platform: 'web',
          steps_completed: stepsCompleted,
          steps_skipped: stepsSkipped + 1,
          completed_via: 'finish',
        });
      } catch (_) {}
      api.post('/auth/me/onboarding/complete')
        .then(() => updateUser({ onboardingCompleted: true }))
        .catch(() => {});
    }

    setStepsSkipped(s => s + 1);
    setCurrentIndex(i => Math.min(i + 1, steps.length - 1));
  }, [currentIndex, currentStep, steps, isReplay, user?.onboardingCompleted, updateUser, stepsCompleted, stepsSkipped]);

  const completeTour = useCallback(async () => {
    try {
      await api.post('/auth/me/tour/complete');
      updateUser({ tourCompleted: true });
    } catch (_) {}
  }, [updateUser]);

  const exitAll = useCallback(async () => {
    if (!isReplay && !user?.onboardingCompleted) {
      try {
        posthog.capture('onboarding_completed', {
          platform: 'web',
          steps_completed: stepsCompleted,
          steps_skipped: stepsSkipped,
          completed_via: 'x_button',
        });
      } catch (_) {}
      try { await api.post('/auth/me/onboarding/complete'); } catch (_) {}
      updateUser({ onboardingCompleted: true });
    }
    await completeTour();
  }, [isReplay, user?.onboardingCompleted, updateUser, completeTour, stepsCompleted, stepsSkipped]);

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
