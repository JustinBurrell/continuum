import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import GoogleDriveStep from './steps/GoogleDriveStep';
import TourStep from './steps/TourStep';
import DoneSlide from './steps/DoneSlide';

const PROFILE_STEP_COMPONENTS = {
  welcome: WelcomeStep,
  goal: GoalStep,
  name: NameStep,
  'photo-bio': PhotoBioStep,
  'social-links': SocialLinksStep,
  'google-drive': GoogleDriveStep,
};

// isReplay: true when opened from "Replay tour" / "Finish setup" in Profile
// onClose: called after all API calls complete so the parent can clear forceOnboardingOpen
export default function OnboardingModal({ isReplay, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    navigate('/profile');
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

  // Floating bottom-right card — page stays fully visible behind it
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 200,
        width: 320,
        background: '#fff',
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f0e6fb',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 0' }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#a087b0', letterSpacing: '0.02em' }}>
          {isDone ? '' : `Step ${stepNumber} of ${totalSteps}`}
        </span>
        <button
          onClick={handleExit}
          aria-label="Close tour"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 6, border: '1px solid #e5d3f0',
            background: 'transparent', cursor: 'pointer', color: '#a087b0', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#f3e8ff'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <X size={12} />
        </button>
      </div>

      {/* Step content */}
      <div key={currentIndex} className="onboarding-step-enter" style={{ padding: '14px 16px 18px' }}>
        {renderStep()}
      </div>
    </div>
  );
}
