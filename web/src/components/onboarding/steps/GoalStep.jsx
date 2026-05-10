import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';

const GOALS = [
  { value: 'study_smarter',    label: 'Study smarter',       sub: 'Notes, flashcards, AI summaries' },
  { value: 'track_job_search', label: 'Track my job search', sub: 'Applications, resume' },
  { value: 'manage_coursework',label: 'Manage my coursework', sub: 'Tasks, calendar' },
  { value: 'collaborate',      label: 'Collaborate with friends', sub: 'Sharing, social feed' },
  { value: 'not_sure',         label: "Not sure, show me everything", sub: '' },
];

export default function GoalStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  // Pre-select a previously saved goal if the user is returning to onboarding
  const [selected, setSelected] = useState(user?.onboardingGoal ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleContinue = async () => {
    if (!selected) { onContinue(); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await api.patch('/auth/me/profile', { onboardingGoal: selected });
      updateUser({ onboardingGoal: selected });
      posthog.capture('onboarding_goal_selected', { platform: 'web', goal: selected });
      posthog.identify(undefined, { onboardingGoal: selected });
      onContinue();
    } catch (e) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        What brought you to Continuum?
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 18px' }}>
        We'll personalize your tour based on your answer.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {GOALS.map(g => (
          <button
            key={g.value}
            onClick={() => setSelected(g.value)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '10px 14px',
              borderRadius: 8,
              border: `2px solid ${selected === g.value ? '#6b21a8' : '#e5d3f0'}`,
              background: selected === g.value ? 'rgba(107,33,168,0.06)' : '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
              width: '100%',
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: selected === g.value ? '#6b21a8' : '#111827' }}>
              {g.label}
            </span>
            {g.sub && (
              <span style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: 2 }}>{g.sub}</span>
            )}
          </button>
        ))}
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: 12 }}>{error}</p>}

      <button
        onClick={handleContinue}
        disabled={loading}
        style={{
          width: '100%',
          padding: '11px 0',
          background: '#6b21a8',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9375rem',
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
          marginBottom: 10,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#581c87'; }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6b21a8'; }}
      >
        {loading ? 'Saving…' : 'Continue'}
      </button>

      <button
        onClick={onSkip}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip
      </button>
    </div>
  );
}
