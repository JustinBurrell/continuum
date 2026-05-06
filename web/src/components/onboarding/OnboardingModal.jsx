import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';
import { getOrderedTourSteps } from './tourConfig';
import { useOnboarding } from './useOnboarding';

// Step components — imported lazily to keep the initial bundle lighter
import WelcomeStep from './steps/WelcomeStep';
import GoalStep from './steps/GoalStep';
import NameStep from './steps/NameStep';
import PhotoBioStep from './steps/PhotoBioStep';
import SocialLinksStep from './steps/SocialLinksStep';
import NotificationsStep from './steps/NotificationsStep';
import GoogleDriveStep from './steps/GoogleDriveStep';
import TourStep from './steps/TourStep';
import DoneSlide from './steps/DoneSlide';

const PROFILE_STEP_COMPONENTS = {
  welcome: WelcomeStep,
  goal: GoalStep,
  name: NameStep,
  'photo-bio': PhotoBioStep,
  'social-links': SocialLinksStep,
  notifications: NotificationsStep,
  'google-drive': GoogleDriveStep,
};

// isReplay: true when opened from "Replay tour" / "Finish setup" in Profile
// onClose: called after all API calls complete so the parent can clear forceOnboardingOpen
export default function OnboardingModal({ isReplay, onClose }) {
  const { user } = useAuth();
  const {
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
    isDone,
  } = useOnboarding(isReplay);

  const tourStartedRef = useRef(false);

  // Fire onboarding_started once on fresh onboarding mount (not replay)
  useEffect(() => {
    if (!isReplay && user && !user.onboardingCompleted) {
      posthog.capture('onboarding_started', {
        platform: 'web',
        signup_method: user.googleId ? 'google' : 'email',
      });
    }
    // On replay, tour_started fires when the first tour step renders (below)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire tour_started the first time the user enters the tour phase
  useEffect(() => {
    if (currentStep?.kind === 'tour' && currentStep?.tourIndex === 0 && !tourStartedRef.current) {
      tourStartedRef.current = true;
      try {
        const tourOrder = getOrderedTourSteps(user?.onboardingGoal ?? 'not_sure').map(s => s.id);
        posthog.capture('tour_started', {
          platform: 'web',
          goal: user?.onboardingGoal ?? 'not_sure',
          tour_order: tourOrder,
          is_replay: isReplay,
        });
      } catch (_) {}
    }
  }, [currentStep?.kind, currentStep?.tourIndex]);

  const handleExit = async () => {
    await exitAll();
    onClose?.();
  };

  const handleTourComplete = async () => {
    try {
      posthog.capture('tour_completed', {
        platform: 'web',
        goal: user?.onboardingGoal ?? 'not_sure',
        is_replay: isReplay,
        steps_seen: totalSteps,
      });
    } catch (_) {}
    await completeTour();
    onClose?.();
  };

  const handleSkipTour = async () => {
    try {
      posthog.capture('tour_completed', {
        platform: 'web',
        goal: user?.onboardingGoal ?? 'not_sure',
        is_replay: isReplay,
        steps_seen: currentStep?.tourIndex != null ? currentStep.tourIndex + 1 : 0,
      });
    } catch (_) {}
    await completeTour();
    onClose?.();
  };

  const handleAdvance = (stepName) => {
    advance(stepName);
  };

  const handleSkip = (stepName) => {
    skip(stepName);
  };

  const renderStep = () => {
    if (!currentStep) return null;

    if (currentStep.kind === 'profile') {
      const StepComponent = PROFILE_STEP_COMPONENTS[currentStep.key];
      if (!StepComponent) return null;
      return (
        <StepComponent
          onContinue={() => handleAdvance(currentStep.key)}
          onSkip={() => handleSkip(currentStep.key)}
        />
      );
    }

    if (currentStep.kind === 'tour') {
      return (
        <TourStep
          config={currentStep.tourStep}
          tourIndex={currentStep.tourIndex}
          isReplay={isReplay}
          onNext={() => handleAdvance('tour_' + currentStep.tourStep.id)}
          onSkipTour={handleSkipTour}
        />
      );
    }

    if (currentStep.kind === 'done') {
      return <DoneSlide isReplay={isReplay} onFinish={handleTourComplete} />;
    }

    return null;
  };

  return (
    // Backdrop — non-dismissable
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Modal card */}
      <div
        style={{
          background: '#fef7ff',
          borderRadius: '1rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Header row: progress + X button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 0',
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#a087b0',
              letterSpacing: '0.02em',
            }}
          >
            {isDone ? '' : `Step ${stepNumber} of ${totalSteps}`}
          </span>
          <button
            onClick={handleExit}
            aria-label="Skip onboarding"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid #e5d3f0',
              background: 'transparent',
              cursor: 'pointer',
              color: '#a087b0',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f3e8ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <X size={14} />
          </button>
        </div>

        {/* Step content — keyed by index so the slide-in animation fires on each change */}
        <div
          key={currentIndex}
          className="onboarding-step-enter"
          style={{ padding: '20px 28px 28px' }}
        >
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
