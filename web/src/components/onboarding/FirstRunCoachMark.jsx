import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Maps the section key stored in sessionStorage to the data-tour-highlight value
// and the tooltip label shown above the highlighted element.
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
  const [config, setConfig] = useState(null); // { target, label }
  const [rect, setRect] = useState(null);
  const dismissed = useRef(false);

  // When the route changes, check sessionStorage and try to find the target element
  useEffect(() => {
    if (dismissed.current) return;
    const section = sessionStorage.getItem(STORAGE_KEY);
    if (!section) return;
    const cfg = SECTION_MAP[section];
    if (!cfg) { sessionStorage.removeItem(STORAGE_KEY); return; }

    // Delay so the navigated page mounts its buttons
    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-tour-highlight="${cfg.target}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setConfig(cfg);
      // Use viewport-relative coords so position: fixed works correctly
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const dismiss = () => {
    dismissed.current = true;
    sessionStorage.removeItem(STORAGE_KEY);
    setConfig(null);
    setRect(null);
  };

  if (!config || !rect) return null;

  return (
    <>
      {/* Pulsing ring overlay on the target element */}
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
          zIndex: 9998,
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
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(59,7,100,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {config.label}
        <button
          onClick={dismiss}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}
        >
          Skip
        </button>
        {/* Caret pointing down */}
        <div style={{
          position: 'absolute',
          bottom: -5,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid #3B0764',
        }} />
      </div>
    </>
  );
}
