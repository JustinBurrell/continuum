import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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

  const handleConnectGoogle = () => {
    setLinking(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const popup = window.open(`${apiBase}/api/auth/google`, 'google-oauth', 'width=500,height=640');

    const poll = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(poll);
        setLinking(false);
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
        onClick={onContinue}
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
        onClick={onSkip}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip for now
      </button>
    </div>
  );
}
