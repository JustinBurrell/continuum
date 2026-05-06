import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NotificationsStep({ onContinue, onSkip }) {
  const { updateUser } = useAuth();
  const [status, setStatus] = useState('idle'); // idle | requesting | granted | denied

  // Auto-skip if already granted
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      onContinue();
    }
  }, [onContinue]);

  const handleEnable = async () => {
    if (typeof Notification === 'undefined') { onContinue(); return; }
    setStatus('requesting');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setStatus('granted');
      try {
        await api.patch('/auth/me/profile', { 'settings.pushNotifications': true });
        updateUser({ settings: { pushNotifications: true } });
      } catch (_) { /* non-blocking */ }
      setTimeout(() => onContinue(), 800);
    } else {
      setStatus('denied');
    }
  };

  if (status === 'granted') {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
        <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '1rem' }}>Notifications enabled!</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🔔</div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        Stay in the loop
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 8px' }}>
        Get notified when friends send you messages, accept friend requests, or comment on your work.
      </p>
      {status === 'denied' && (
        <p style={{ color: '#9CA3AF', fontSize: '0.8125rem', margin: '0 0 16px', lineHeight: 1.5 }}>
          Notifications are blocked in your browser settings. You can enable them later in your Profile.
        </p>
      )}

      {status !== 'denied' && (
        <button
          onClick={handleEnable}
          disabled={status === 'requesting'}
          style={{
            width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
            cursor: status === 'requesting' ? 'not-allowed' : 'pointer',
            opacity: status === 'requesting' ? 0.7 : 1, marginBottom: 10,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => { if (status === 'idle') e.currentTarget.style.background = '#581c87'; }}
          onMouseLeave={e => { if (status === 'idle') e.currentTarget.style.background = '#6b21a8'; }}
        >
          {status === 'requesting' ? 'Requesting…' : 'Enable notifications'}
        </button>
      )}

      <button
        onClick={onSkip}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        {status === 'denied' ? 'Continue' : 'Skip for now'}
      </button>
    </div>
  );
}
