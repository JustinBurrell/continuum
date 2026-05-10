import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const SECTION_MAP = {
  notes:        { target: 'notes-new',        label: 'Create your first note to get started' },
  tasks:        { target: 'tasks-new',         label: 'Add your first task to get started' },
  applications: { target: 'applications-new',  label: 'Add your first job application' },
  friends:      { target: 'friends-search',    label: 'Search for friends to connect with' },
};

const STORAGE_KEY = 'continuum_first_run_section';

export function signalFirstRun(sectionKey) {
  sessionStorage.setItem(STORAGE_KEY, sectionKey);
}

export default function FirstRunCoachMark() {
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [rect, setRect] = useState(null);
  const dismissed = useRef(false);
  const targetElRef = useRef(null);

  const computeRect = () => {
    const el = targetElRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  // When route changes, look for the target element and begin tracking it
  useEffect(() => {
    if (dismissed.current) return;
    const section = sessionStorage.getItem(STORAGE_KEY);
    if (!section) return;
    const cfg = SECTION_MAP[section];
    if (!cfg) { sessionStorage.removeItem(STORAGE_KEY); return; }

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-tour-highlight="${cfg.target}"]`);
      if (!el) return;
      targetElRef.current = el;

      // Elevate the target above the backdrop so it stays clickable
      el.style.position = 'relative';
      el.style.zIndex = '10001';

      const r = el.getBoundingClientRect();
      setConfig(cfg);
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Track scroll and resize so the ring stays on the element
  useEffect(() => {
    if (!config) return;
    window.addEventListener('scroll', computeRect, { passive: true, capture: true });
    window.addEventListener('resize', computeRect, { passive: true });
    return () => {
      window.removeEventListener('scroll', computeRect, { capture: true });
      window.removeEventListener('resize', computeRect);
    };
  }, [config]);

  const dismiss = () => {
    dismissed.current = true;
    sessionStorage.removeItem(STORAGE_KEY);

    // Restore target element z-index
    if (targetElRef.current) {
      targetElRef.current.style.position = '';
      targetElRef.current.style.zIndex = '';
      targetElRef.current = null;
    }

    setConfig(null);
    setRect(null);
  };

  if (!config || !rect) return null;

  return (
    <>
      {/* Dimmed backdrop — blocks all clicks (including sidebar nav) except the target */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 9995,
          cursor: 'default',
        }}
        onClick={dismiss}
      />

      {/* Pulsing ring on target — sits above backdrop, pointer-events none so clicks reach target */}
      <div
        style={{
          position: 'fixed',
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          borderRadius: 10,
          border: '2px solid #6b21a8',
          pointerEvents: 'none',
          animation: 'onboardingPulse 1.4s ease-in-out infinite',
          zIndex: 10002,
        }}
      />

      {/* Tooltip above the element */}
      <div
        style={{
          position: 'fixed',
          top: rect.top - 52,
          left: rect.left + rect.width / 2,
          transform: 'translateX(-50%)',
          background: '#3B0764',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: 8,
          whiteSpace: 'nowrap',
          zIndex: 10002,
          boxShadow: '0 4px 12px rgba(59,7,100,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'all',
        }}
      >
        {config.label}
        <button
          onClick={dismiss}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}
        >
          Dismiss
        </button>
        <div style={{
          position: 'absolute',
          bottom: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #3B0764',
        }} />
      </div>
    </>
  );
}
