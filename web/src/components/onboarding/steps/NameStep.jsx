import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function Field({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
        {label}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '9px 12px',
          border: '1px solid #e5d3f0',
          borderRadius: 8,
          fontSize: '0.9rem',
          color: '#111827',
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#6b21a8'}
        onBlur={e => e.target.style.borderColor = '#e5d3f0'}
      />
    </div>
  );
}

export default function NameStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [username, setUsername]   = useState(user?.username ?? '');
  const [usernameError, setUsernameError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    setUsernameError(null);
    try {
      const profileUpdates = {};
      if (firstName !== user?.firstName) profileUpdates.firstName = firstName;
      if (lastName  !== user?.lastName)  profileUpdates.lastName  = lastName;

      if (Object.keys(profileUpdates).length > 0) {
        await api.patch('/auth/me/profile', profileUpdates);
        updateUser(profileUpdates);
      }

      if (username !== user?.username) {
        try {
          await api.patch('/auth/me/username', { username });
          updateUser({ username });
        } catch (e) {
          if (e?.response?.status === 409) {
            setUsernameError('That username is already taken. Choose a different one or skip.');
            setLoading(false);
            return;
          }
          throw e;
        }
      }

      onContinue();
    } catch (_) {
      // Profile update failure is non-blocking — still advance
      onContinue();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        Confirm your name and username
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        This is how others will find you on Continuum.
      </p>

      <Field label="First name" value={firstName} onChange={setFirstName} placeholder="First name" />
      <Field label="Last name"  value={lastName}  onChange={setLastName}  placeholder="Last name" />

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          Username
        </label>
        <input
          value={username}
          onChange={e => { setUsername(e.target.value); setUsernameError(null); }}
          placeholder="username"
          style={{
            width: '100%',
            padding: '9px 12px',
            border: `1px solid ${usernameError ? '#dc2626' : '#e5d3f0'}`,
            borderRadius: 8,
            fontSize: '0.9rem',
            color: '#111827',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { if (!usernameError) e.target.style.borderColor = '#6b21a8'; }}
          onBlur={e => { if (!usernameError) e.target.style.borderColor = '#e5d3f0'; }}
        />
        {usernameError && (
          <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{usernameError}</p>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={loading}
        style={{
          width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          marginBottom: 10, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#581c87'; }}
        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#6b21a8'; }}
      >
        {loading ? 'Saving…' : 'Save & Continue'}
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
