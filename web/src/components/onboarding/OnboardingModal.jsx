import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
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

  const handleExit = async () => {
    await exitAll();
    onClose?.();
  };

  const handleTourComplete = async () => {
    await completeTour();
    onClose?.();
  };

  const handleSkipTour = async () => {
    await completeTour();
    onClose?.();
  };

  const handleAdvance = async (stepName) => {
    await advance(stepName);
  };

  const handleSkip = async (stepName) => {
    await skip(stepName);
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
