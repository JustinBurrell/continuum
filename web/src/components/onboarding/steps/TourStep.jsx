import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';

function injectPulseKeyframes() {
  if (document.getElementById('ob-pulse-kf')) return;
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

// Returns the screen rect of the page CTA after a 400ms delay (page mount time).
// Uses getBoundingClientRect so the ring is rendered via portal at the correct
// viewport coordinates — unaffected by any transform on the element's ancestors.
function usePageHighlightRect(pageTarget) {
  const [ringRect, setRingRect] = useState(null);

  useEffect(() => {
    if (!pageTarget) { setRingRect(null); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour-highlight="${pageTarget}"]`);
      if (!el) return;
      injectPulseKeyframes();
      const r = el.getBoundingClientRect();
      setRingRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setRingRect(null);
    };
  }, [pageTarget]);

  return ringRect;
}

export default function TourStep({ config, tourIndex, onNext, onBack, onSkipTour }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ringRect = usePageHighlightRect(config.pageTarget);

  useEffect(() => {
    if (config.route) navigate(config.route);
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

  // Everything rendered via portal so it sits at document.body level — fully outside
  // any transformed ancestor (e.g. the page-fade-in animation) that would otherwise
  // confine position:fixed elements and break the backdrop coverage.
  return createPortal(
    <>
      {/* Dimmed backdrop — blocks all page + sidebar interaction during the tour */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 9995,
          pointerEvents: 'all',
        }}
      />

      {/* Pulsing purple ring on the page CTA — positioned with screen coords so it
          renders correctly above the backdrop regardless of any ancestor transform */}
      {ringRect && (
        <div
          style={{
            position: 'fixed',
            top: ringRect.top - 4,
            left: ringRect.left - 4,
            width: ringRect.width + 8,
            height: ringRect.height + 8,
            borderRadius: 8,
            border: '2px solid #6b21a8',
            pointerEvents: 'none',
            animation: 'onboardingPulse 1.4s ease-in-out infinite',
            zIndex: 10001,
          }}
        />
      )}

      {/* Tour card */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 10002,
          width: 340,
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(107,33,168,0.08)',
          overflow: 'hidden',
          pointerEvents: 'all',
        }}
      >
        {/* Purple header */}
        <div style={{ background: '#3B0764', padding: '16px 18px 14px' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {config.sectionName}
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {config.heading}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 18px 18px' }}>
          <p style={{ margin: '0 0 18px', fontSize: 14, color: '#4B5563', lineHeight: 1.6 }}>
            {config.description}
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {tourIndex > 0 && (
              <button
                onClick={onBack}
                style={{
                  flex: '0 0 auto',
                  padding: '10px 16px',
                  background: 'transparent',
                  color: '#6b21a8',
                  border: '1px solid #e5d3f0',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={onNext}
              style={{
                flex: 1,
                padding: '10px 0',
                background: '#6b21a8',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#581c87'}
              onMouseLeave={e => e.currentTarget.style.background = '#6b21a8'}
            >
              Next
            </button>
          </div>

          <button
            onClick={handleSkipTour}
            style={{ background: 'none', border: 'none', color: '#6B7280', fontSize: 13, cursor: 'pointer', width: '100%' }}
          >
            Skip tour
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
