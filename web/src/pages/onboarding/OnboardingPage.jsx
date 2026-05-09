import { useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';
import { useOnboarding } from '@/components/onboarding/useOnboarding';

import WelcomeStep from '@/components/onboarding/steps/WelcomeStep';
import GoalStep from '@/components/onboarding/steps/GoalStep';
import NameStep from '@/components/onboarding/steps/NameStep';
import PhotoBioStep from '@/components/onboarding/steps/PhotoBioStep';
import SocialLinksStep from '@/components/onboarding/steps/SocialLinksStep';
import GoogleDriveStep from '@/components/onboarding/steps/GoogleDriveStep';
import ActivationStep from '@/components/onboarding/steps/ActivationStep';

const PROFILE_STEP_COMPONENTS = {
  welcome: WelcomeStep,
  goal: GoalStep,
  name: NameStep,
  'photo-bio': PhotoBioStep,
  'social-links': SocialLinksStep,
  'google-drive': GoogleDriveStep,
};

// Left-panel illustration content keyed by profile step
const LEFT_PANEL = {
  welcome: {
    icon: '👋',
    headline: "You're in.",
    body: "Let's personalize Continuum for you — this takes less than 2 minutes.",
  },
  goal: {
    icon: '🎯',
    headline: "What matters to you?",
    body: "Your goal shapes your dashboard, your tour, and every tool we surface first.",
  },
  name: {
    icon: '✏️',
    headline: "Make it yours.",
    body: "Your name is how everyone on Continuum recognizes you.",
  },
  'photo-bio': {
    icon: '📷',
    headline: "Put a face to it.",
    body: "A photo and bio help friends find and connect with you.",
  },
  'social-links': {
    icon: '🔗',
    headline: "Connect your world.",
    body: "Add your social profiles so your network can find you here.",
  },
  'google-drive': {
    icon: '📁',
    headline: "Bring your content.",
    body: "Link Google Drive to import your Docs directly as notes in one click.",
  },
  activation: {
    icon: '🚀',
    headline: "One last thing.",
    body: "Take your first action and see exactly why Continuum was built for you.",
  },
};

// Goal → first action mapping
const GOAL_ACTIVATION = {
  study_smarter: {
    headline: "Create your first note",
    body: "Rich-text notes with AI summaries — the fastest way to start studying smarter.",
    cta: "Open Notes",
    route: '/notes',
  },
  track_job_search: {
    headline: "Add your first application",
    body: "Track every job you've applied to and exactly where each one stands.",
    cta: "Open Applications",
    route: '/applications',
  },
  manage_coursework: {
    headline: "Create your first task",
    body: "A kanban board for every assignment, project, and deadline.",
    cta: "Open Tasks",
    route: '/tasks',
  },
  collaborate: {
    headline: "Find your first friend",
    body: "Connect with other students and start sharing notes and activity.",
    cta: "Find Friends",
    route: '/friends',
  },
  not_sure: {
    headline: "Explore Continuum",
    body: "Your dashboard is the bird's-eye view of everything — notes, tasks, flashcards, and more.",
    cta: "Go to Dashboard",
    route: '/dashboard',
  },
};

// Profile steps are always exactly 5 (email: welcome+goal+photo-bio+social+drive; google: welcome+goal+name+photo-bio+social).
// Activation is displayed as the final (+1) step, making the total 6.
const TOTAL_PROFILE_STEPS = 5;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // isReplay = true when profile setup is already complete but tour isn't —
  // useOnboarding skips profile steps and goes straight to tour phase.
  const isReplay = !!(user?.onboardingCompleted);

  const {
    currentStep,
    currentIndex,
    advance,
    skip,
    exitAll,
    completeTour,
  } = useOnboarding(isReplay);

  // Activation is shown instead of the full 11-step tour for fresh onboarding
  const showActivation = currentStep?.kind === 'tour' || currentStep?.kind === 'done';

  // Display step counting — only profile steps + 1 activation
  const totalDisplaySteps = isReplay ? 1 : TOTAL_PROFILE_STEPS + 1;
  const displayStepNumber = showActivation
    ? totalDisplaySteps
    : Math.min(currentIndex + 1, TOTAL_PROFILE_STEPS);
  const progress = displayStepNumber / totalDisplaySteps;

  const pageViewedRef = useRef(false);
  useEffect(() => {
    if (pageViewedRef.current || !user) return;
    pageViewedRef.current = true;
    try {
      posthog.capture('onboarding_page_viewed', { platform: 'web', entry_point: 'fresh' });
    } catch (_) {}
  }, [user]);

  // --- Guards (after all hooks) ---
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FA' }}>
        <img src="/wordmark.svg" alt="Continuum" style={{ height: 28, opacity: 0.4 }} className="animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted && user.tourCompleted) return <Navigate to="/dashboard" replace />;

  // --- Handlers ---
  const handleExit = async () => {
    try {
      posthog.capture('onboarding_exited_early', {
        platform: 'web',
        step_index: currentIndex,
        step_name: currentStep?.key ?? currentStep?.kind,
      });
    } catch (_) {}
    await exitAll();
    navigate('/dashboard', { replace: true });
  };

  const handleActivationGo = (route) => {
    const goal = user?.onboardingGoal ?? 'not_sure';
    const act = GOAL_ACTIVATION[goal] ?? GOAL_ACTIVATION.not_sure;
    try {
      posthog.capture('activation_step_completed', {
        platform: 'web',
        goal,
        action_taken: act.cta,
        skipped: false,
      });
    } catch (_) {}
    completeTour();
    navigate(route);
  };

  const handleActivationSkip = () => {
    try {
      posthog.capture('activation_step_completed', {
        platform: 'web',
        goal: user?.onboardingGoal ?? 'not_sure',
        skipped: true,
      });
    } catch (_) {}
    completeTour();
    navigate('/dashboard');
  };

  // --- Left panel content ---
  const leftContent = showActivation
    ? LEFT_PANEL.activation
    : (LEFT_PANEL[currentStep?.key] ?? LEFT_PANEL.welcome);

  // --- Step renderer ---
  const renderStep = () => {
    if (showActivation) {
      const goal = user?.onboardingGoal ?? 'not_sure';
      const act = GOAL_ACTIVATION[goal] ?? GOAL_ACTIVATION.not_sure;
      return (
        <ActivationStep
          headline={act.headline}
          body={act.body}
          cta={act.cta}
          route={act.route}
          onGo={handleActivationGo}
          onSkip={handleActivationSkip}
        />
      );
    }

    if (currentStep?.kind === 'profile') {
      const StepComponent = PROFILE_STEP_COMPONENTS[currentStep.key];
      if (!StepComponent) return null;
      return (
        <StepComponent
          onContinue={() => advance(currentStep.key)}
          onSkip={() => skip(currentStep.key)}
        />
      );
    }

    return null;
  };

  return (
    <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div style={{ background: '#3B0764', display: 'flex', flexDirection: 'column', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs — mirrors Register.jsx */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Wordmark */}
        <img
          src="/wordmark.svg"
          alt="Continuum"
          style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9, position: 'relative', zIndex: 1 }}
        />

        {/* Step illustration */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div
            key={currentStep?.key ?? 'activation'}
            className="onboarding-step-enter"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, marginBottom: 28 }}>
              {leftContent.icon}
            </div>
            <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 28, color: '#ffffff', lineHeight: 1.2, marginBottom: 12, maxWidth: 260 }}>
              {leftContent.headline}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 260 }}>
              {leftContent.body}
            </p>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          {Array.from({ length: totalDisplaySteps }).map((_, i) => (
            <div
              key={i}
              style={{
                width: i < displayStepNumber ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i < displayStepNumber ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)',
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          {/* Progress header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#a087b0', letterSpacing: '0.02em' }}>
                {showActivation ? 'Almost done' : `Step ${displayStepNumber} of ${totalDisplaySteps}`}
              </span>
              <button
                onClick={handleExit}
                style={{ fontSize: 12, color: '#a087b0', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
              >
                Skip setup
              </button>
            </div>
            {/* Thin progress bar */}
            <div style={{ height: 3, background: 'rgba(107,33,168,0.10)', borderRadius: 2 }}>
              <div
                style={{
                  height: '100%',
                  background: '#6B21A8',
                  borderRadius: 2,
                  width: `${progress * 100}%`,
                  transition: 'width 0.35s ease',
                }}
              />
            </div>
          </div>

          {/* Step content — keyed so slide animation fires on each change */}
          <div key={currentIndex} className="onboarding-step-enter">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}
