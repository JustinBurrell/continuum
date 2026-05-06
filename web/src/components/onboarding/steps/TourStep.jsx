import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';

// Renders a pulsing purple ring around the sidebar nav element
// identified by data-nav-id="<target>" while this tour step is active.
function useSidebarHighlight(target) {
  useEffect(() => {
    if (!target) return;
    const el = document.querySelector(`[data-nav-id="${target}"]`);
    if (!el) return;

    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      inset: -3px;
      border-radius: 8px;
      border: 2px solid #6b21a8;
      pointer-events: none;
      animation: onboardingPulse 1.4s ease-in-out infinite;
      z-index: 9999;
    `;

    if (!document.getElementById('ob-pulse-kf')) {
      const style = document.createElement('style');
      style.id = 'ob-pulse-kf';
      style.textContent = `
        @keyframes onboardingPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(107,33,168,0.35); }
          50% { opacity: 0.7; box-shadow: 0 0 0 6px rgba(107,33,168,0); }
        }
      `;
      document.head.appendChild(style);
    }

    el.style.position = 'relative';
    el.appendChild(ring);
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    return () => ring.remove();
  }, [target]);
}

export default function TourStep({ config, tourIndex, isReplay, onNext, onSkipTour }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  useSidebarHighlight(config.sidebarTarget);

  // Navigate to the section's page and fire analytics on mount
  useEffect(() => {
    if (config.route) {
      navigate(config.route);
    }
    try {
      posthog.capture('tour_step_viewed', {
        platform: 'web',
        section_name: config.sectionName,
        step_index: tourIndex,
        goal: user?.onboardingGoal ?? 'not_sure',
      });
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSkipTour = () => {
    try {
      posthog.capture('tour_step_skipped', {
        platform: 'web',
        section_name: config.sectionName,
        step_index: tourIndex,
        goal: user?.onboardingGoal ?? 'not_sure',
        steps_seen: tourIndex + 1,
      });
    } catch (_) {}
    onSkipTour();
  };

  return (
    <div>
      {/* Section badge */}
      <p style={{
        display: 'inline-block',
        fontSize: '0.75rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#6b21a8',
        background: 'rgba(107,33,168,0.08)',
        padding: '3px 10px',
        borderRadius: 20,
        marginBottom: 14,
      }}>
        {config.sectionName}
      </p>

      <h2 style={{
        fontFamily: 'Fraunces, Georgia, serif',
        fontSize: '1.375rem',
        fontWeight: 600,
        color: '#1a1a2e',
        margin: '0 0 8px',
        lineHeight: 1.3,
      }}>
        {config.heading}
      </h2>

      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 28px', lineHeight: 1.6 }}>
        {config.description}
      </p>

      <button
        onClick={onNext}
        style={{
          width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: 'pointer', marginBottom: 10, transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#581c87'}
        onMouseLeave={e => e.currentTarget.style.background = '#6b21a8'}
      >
        Next
      </button>

      <button
        onClick={handleSkipTour}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip tour
      </button>
    </div>
  );
}
