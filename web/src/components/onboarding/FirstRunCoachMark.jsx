import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getSectionConfig } from './tourConfig';

const SECTION_MAP = {
  notes:        { target: 'notes-new',        cta: 'Create your first note' },
  tasks:        { target: 'tasks-new',         cta: 'Add your first task' },
  applications: { target: 'applications-new',  cta: 'Add your first application' },
  friends:      { target: 'friends-search',    cta: 'Find your first friend' },
  flashcards:   { target: 'flashcards-new',    cta: 'Create a flashcard set' },
  resumes:      { target: 'resumes-upload',    cta: 'Upload your resume' },
  messages:     { target: 'messages-new',      cta: 'Start a conversation' },
};

const STORAGE_KEY = 'continuum_first_run_section';

export function signalFirstRun(sectionKey) {
  sessionStorage.setItem(STORAGE_KEY, sectionKey);
}

export default function FirstRunCoachMark() {
  const location = useLocation();
  const { user } = useAuth();
  const [section, setSection] = useState(null);   // { target, cta, config }
  const [rect, setRect] = useState(null);
  const dismissed = useRef(false);
  const targetElRef = useRef(null);

  const computeRect = () => {
    const el = targetElRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useEffect(() => {
    if (dismissed.current) return;
    if (user?.isDemo || user?.isSeedUser) return;
    const key = sessionStorage.getItem(STORAGE_KEY);
    if (!key) return;
    const map = SECTION_MAP[key];
    if (!map) { sessionStorage.removeItem(STORAGE_KEY); return; }

    const timer = setTimeout(() => {
      const el = document.querySelector(`[data-tour-highlight="${map.target}"]`);
      if (!el) return;
      targetElRef.current = el;
      // Ring is rendered via position:fixed using getBoundingClientRect coords so no
      // z-index elevation on the element itself is needed (avoids stacking context issues).
      const r = el.getBoundingClientRect();
      setSection({ ...map, config: getSectionConfig(key) });
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    if (!section) return;
    window.addEventListener('scroll', computeRect, { passive: true, capture: true });
    window.addEventListener('resize', computeRect, { passive: true });
    return () => {
      window.removeEventListener('scroll', computeRect, { capture: true });
      window.removeEventListener('resize', computeRect);
    };
  }, [section]);

  const dismiss = () => {
    dismissed.current = true;
    sessionStorage.removeItem(STORAGE_KEY);
    targetElRef.current = null;
    setSection(null);
    setRect(null);
  };

  if (!section || !rect) return null;

  const cfg = section.config; // tourConfig section (heading, description, sectionName)

  return (
    <>
      {/* Dimmed backdrop — blocks sidebar nav until dismissed */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9995, cursor: 'default' }}
        onClick={dismiss}
      />

      {/* Pulsing ring on the target CTA */}
      <div
        style={{
          position: 'fixed',
          top: rect.top - 4, left: rect.left - 4,
          width: rect.width + 8, height: rect.height + 8,
          borderRadius: 10, border: '2px solid #6b21a8',
          pointerEvents: 'none',
          animation: 'onboardingPulse 1.4s ease-in-out infinite',
          zIndex: 10002,
        }}
      />

      {/* Section feature card — bottom-right, like the tour modal */}
      <div
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 300,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 0 0 1px rgba(107,33,168,0.08)',
          zIndex: 10002, overflow: 'hidden',
        }}
      >
        {/* Purple header bar */}
        <div style={{ background: '#3B0764', padding: '14px 16px 12px' }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {cfg?.sectionName ?? 'Getting started'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {cfg?.heading ?? section.cta}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 16px 16px' }}>
          {cfg?.description && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>
              {cfg.description}
            </p>
          )}
          {/* Arrow hint pointing up-left toward the ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 10px', background: 'rgba(107,33,168,0.06)', borderRadius: 8 }}>
            <span style={{ fontSize: 16 }}>☝️</span>
            <span style={{ fontSize: 12, color: '#6b21a8', fontWeight: 500 }}>{section.cta} to get started</span>
          </div>
          <button
            onClick={dismiss}
            style={{
              width: '100%', padding: '9px 0', background: '#6b21a8', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
