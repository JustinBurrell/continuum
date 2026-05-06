import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

function Field({ label, value, onChange, placeholder, error }) {
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
          border: `1px solid ${error ? '#dc2626' : '#e5d3f0'}`,
          borderRadius: 8,
          fontSize: '0.9rem',
          color: '#111827',
          background: '#fff',
          outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = '#6b21a8'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = '#e5d3f0'; }}
      />
      {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{error}</p>}
    </div>
  );
}

export default function NameStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName]   = useState(user?.lastName ?? '');
  const [username, setUsername]   = useState(user?.username ?? '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim())  e.lastName  = 'Last name is required.';
    if (!username.trim()) {
      e.username = 'Username is required.';
    } else if (!USERNAME_REGEX.test(username)) {
      e.username = 'Username must be 3–30 characters: letters, numbers, and underscores only.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const profileUpdates = {};
      if (firstName.trim() !== user?.firstName) profileUpdates.firstName = firstName.trim();
      if (lastName.trim()  !== user?.lastName)  profileUpdates.lastName  = lastName.trim();

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
            setErrors(prev => ({ ...prev, username: 'That username is already taken.' }));
            setLoading(false);
            return;
          }
          // Other username errors — still advance
        }
      }

      onContinue();
    } catch (_) {
      onContinue(); // profile update failure is non-blocking
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
        This is how others will see you on Continuum. You can change these any time from your profile.
      </p>

      <Field
        label="First name"
        value={firstName}
        onChange={v => { setFirstName(v); setErrors(p => ({ ...p, firstName: null })); }}
        placeholder="First name"
        error={errors.firstName}
      />
      <Field
        label="Last name"
        value={lastName}
        onChange={v => { setLastName(v); setErrors(p => ({ ...p, lastName: null })); }}
        placeholder="Last name"
        error={errors.lastName}
      />

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          Username
        </label>
        <input
          value={username}
          onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: null })); }}
          placeholder="username"
          style={{
            width: '100%',
            padding: '9px 12px',
            border: `1px solid ${errors.username ? '#dc2626' : '#e5d3f0'}`,
            borderRadius: 8,
            fontSize: '0.9rem',
            color: '#111827',
            background: '#fff',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { if (!errors.username) e.target.style.borderColor = '#6b21a8'; }}
          onBlur={e => { if (!errors.username) e.target.style.borderColor = '#e5d3f0'; }}
        />
        {errors.username
          ? <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '4px 0 0' }}>{errors.username}</p>
          : <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '4px 0 0' }}>Letters, numbers, and underscores only. 3–30 characters.</p>
        }
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
