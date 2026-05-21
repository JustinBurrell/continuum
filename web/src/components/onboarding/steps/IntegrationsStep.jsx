import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';

function IntegrationCard({ icon, name, description, connected, onConnect, connecting }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', border: '1px solid #e5d3f0', borderRadius: 10,
      background: connected ? 'rgba(5,150,105,0.04)' : '#fff',
      marginBottom: 10,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{name}</p>
        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#6B7280' }}>{description}</p>
      </div>
      {connected ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>
          ✓ Connected
        </span>
      ) : (
        <button
          onClick={onConnect}
          disabled={connecting}
          style={{
            padding: '6px 14px', background: '#6b21a8', color: '#fff',
            border: 'none', borderRadius: 6, fontSize: '0.8125rem', fontWeight: 600,
            cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.7 : 1,
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {connecting ? 'Connecting…' : 'Connect'}
        </button>
      )}
    </div>
  );
}

export default function IntegrationsStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  const [linking, setLinking] = useState(false);

  const isGoogleConnected = !!user?.googleId;

  useEffect(() => {
    try {
      posthog.capture('integrations_step_viewed', {
        platform: 'web',
        google_already_connected: isGoogleConnected,
      });
    } catch (_) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the popup can't close itself (window.close() blocked), the original tab
  // never detects the connection because popup.closed stays false. Re-check on
  // visibility: fires when the user closes the popup tab and returns here.
  useEffect(() => {
    if (!linking) return;
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await api.get('/auth/me');
        const updated = res.data.user || res.data.data;
        if (updated?.googleId) {
          setLinking(false);
          updateUser({ googleId: updated.googleId });
        }
      } catch (_) {}
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [linking]);

  const handleConnectGoogle = () => {
    setLinking(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    // BroadcastChannel receives the success message from AuthCallback regardless of
    // whether the browser opened a popup or a new tab (window.opener is unreliable
    // after cross-origin OAuth redirects through Google's servers).
    const channel = new BroadcastChannel('continuum_oauth');
    channel.onmessage = (e) => {
      if (e.data.type === 'GOOGLE_OAUTH_SUCCESS' && e.data.googleId) {
        channel.close();
        setLinking(false);
        updateUser({ googleId: e.data.googleId });
        try {
          posthog.capture('integration_connected', {
            platform: 'web',
            integration: 'google_drive',
            connected_during: 'onboarding',
          });
        } catch (_) {}
      }
    };

    const popup = window.open(`${apiBase}/api/auth/google?source=linking`, 'google-oauth', 'width=500,height=640');

    // Keep polling popup.closed as a fallback for when window.close() works normally
    const poll = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(poll);
        channel.close();
        setLinking(false);
        try {
          const res = await api.get('/auth/me');
          const updated = res.data.user || res.data.data;
          if (updated.googleId) {
            updateUser({ googleId: updated.googleId });
            try {
              posthog.capture('integration_connected', {
                platform: 'web',
                integration: 'google_drive',
                connected_during: 'onboarding',
              });
            } catch (_) {}
          }
        } catch (_) {}
      }
    }, 500);

    // Clean up channel and poll if the component unmounts mid-flow
    return () => {
      clearInterval(poll);
      channel.close();
    };
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        Connect your tools
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Power up Continuum with the apps you already use. You can always connect more later from Profile → Integrations.
      </p>

      <IntegrationCard
        icon="📁"
        name="Google Drive"
        description="Import Google Docs directly as notes"
        connected={isGoogleConnected}
        onConnect={handleConnectGoogle}
        connecting={linking}
      />

      {/* Additional integration cards (Canvas LMS, etc.) slot here */}

      <button
        type="button"
        onClick={() => {
          if (!isGoogleConnected) {
            try {
              posthog.capture('integration_step_skipped', {
                platform: 'web',
                integration: 'google_drive',
                via: 'continue',
              });
            } catch (_) {}
          }
          onContinue();
        }}
        style={{
          width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: 'pointer', marginBottom: 10, marginTop: 10, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#581c87'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#6b21a8'; }}
      >
        {isGoogleConnected ? 'Continue' : 'Save & Continue'}
      </button>
      <button
        type="button"
        onClick={() => {
          try {
            posthog.capture('integration_step_skipped', {
              platform: 'web',
              integration: 'google_drive',
              via: 'skip',
            });
          } catch (_) {}
          onSkip();
        }}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip for now
      </button>
    </div>
  );
}
