import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function GoogleDriveStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  const [linking, setLinking] = useState(false);

  // Auto-skip if already linked
  useEffect(() => {
    if (user?.googleId) onContinue();
  }, [user?.googleId, onContinue]);

  const handleConnect = async () => {
    setLinking(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const popup = window.open(`${apiBase}/api/auth/google`, 'google-oauth', 'width=500,height=640');

    const poll = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(poll);
        setLinking(false);
        // Re-check if googleId is now set
        try {
          const res = await api.get('/auth/me');
          const updated = res.data.user || res.data.data;
          if (updated.googleId) {
            updateUser({ googleId: updated.googleId });
            onContinue();
          }
        } catch (_) {}
      }
    }, 500);
  };

  return (
    <div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔗</div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        Connect your Google account
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 16px', lineHeight: 1.5 }}>
        Linking Google lets you sign in without a password and unlocks Google Drive — so you can import your Google Docs directly into Continuum as notes.
      </p>
      <p style={{ color: '#9CA3AF', fontSize: '0.8125rem', margin: '0 0 24px', lineHeight: 1.5 }}>
        You can also do this later from your Profile → Integrations.
      </p>

      <button
        type="button"
        onClick={handleConnect}
        disabled={linking}
        style={{
          width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: linking ? 'not-allowed' : 'pointer', opacity: linking ? 0.7 : 1,
          marginBottom: 10, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!linking) e.currentTarget.style.background = '#581c87'; }}
        onMouseLeave={e => { if (!linking) e.currentTarget.style.background = '#6b21a8'; }}
      >
        {linking ? 'Waiting for Google…' : 'Connect Google'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip for now
      </button>
    </div>
  );
}
