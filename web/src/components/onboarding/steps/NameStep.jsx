import { useState, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

// check states: idle | checking | available | taken | invalid
function UsernameHint({ state }) {
  if (state === 'checking') return (
    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '4px 0 0' }}>Checking availability…</p>
  );
  if (state === 'available') return (
    <p style={{ fontSize: '0.75rem', color: '#059669', margin: '4px 0 0' }}>✓ Username is available</p>
  );
  if (state === 'taken') return (
    <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: '4px 0 0' }}>Username is already taken</p>
  );
  if (state === 'invalid') return (
    <p style={{ fontSize: '0.75rem', color: '#dc2626', margin: '4px 0 0' }}>3–30 characters: letters, numbers, and underscores only</p>
  );
  return (
    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '4px 0 0' }}>Letters, numbers, and underscores only. 3–30 characters.</p>
  );
}

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
          width: '100%', padding: '9px 12px',
          border: `1px solid ${error ? '#dc2626' : '#e5d3f0'}`,
          borderRadius: 8, fontSize: '0.9rem', color: '#111827',
          background: '#fff', outline: 'none', boxSizing: 'border-box',
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
  const [nameErrors, setNameErrors] = useState({});
  const [usernameCheck, setUsernameCheck] = useState('idle');
  const [loading, setLoading] = useState(false);
  // Track the username that was already saved so we skip the call on submit
  const savedUsernameRef = useRef(user?.username ?? '');
  const debounceRef = useRef(null);

  const checkUsername = async (value) => {
    const trimmed = value.trim();
    if (trimmed === savedUsernameRef.current) { setUsernameCheck('idle'); return; }
    if (!USERNAME_REGEX.test(trimmed)) { setUsernameCheck('invalid'); return; }

    setUsernameCheck('checking');
    try {
      await api.patch('/auth/me/username', { username: trimmed });
      updateUser({ username: trimmed });
      savedUsernameRef.current = trimmed;
      setUsernameCheck('available');
    } catch (e) {
      setUsernameCheck(e?.response?.status === 409 ? 'taken' : 'idle');
    }
  };

  const handleUsernameChange = (value) => {
    setUsername(value);
    setUsernameCheck('idle');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkUsername(value), 600);
  };

  const handleUsernameBlur = () => {
    clearTimeout(debounceRef.current);
    checkUsername(username);
  };

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name is required.';
    if (!lastName.trim())  e.lastName  = 'Last name is required.';
    setNameErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    if (usernameCheck === 'taken' || usernameCheck === 'invalid') return;
    if (usernameCheck === 'checking') return; // wait for the in-flight check

    setLoading(true);
    try {
      const profileUpdates = {};
      if (firstName.trim() !== user?.firstName) profileUpdates.firstName = firstName.trim();
      if (lastName.trim()  !== user?.lastName)  profileUpdates.lastName  = lastName.trim();

      if (Object.keys(profileUpdates).length > 0) {
        await api.patch('/auth/me/profile', profileUpdates);
        updateUser(profileUpdates);
      }

      // Username was already saved by the availability check if it changed
      if (username !== savedUsernameRef.current) {
        try {
          await api.patch('/auth/me/username', { username });
          updateUser({ username });
          savedUsernameRef.current = username;
        } catch (e) {
          if (e?.response?.status === 409) {
            setUsernameCheck('taken');
            setLoading(false);
            return;
          }
        }
      }

      onContinue();
    } catch (_) {
      onContinue();
    } finally {
      setLoading(false);
    }
  };

  const usernameBorderColor = usernameCheck === 'taken' || usernameCheck === 'invalid'
    ? '#dc2626'
    : usernameCheck === 'available'
      ? '#059669'
      : '#e5d3f0';

  const canSave = usernameCheck !== 'taken' && usernameCheck !== 'invalid' && usernameCheck !== 'checking' && !loading;

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
        onChange={v => { setFirstName(v); setNameErrors(p => ({ ...p, firstName: null })); }}
        placeholder="First name"
        error={nameErrors.firstName}
      />
      <Field
        label="Last name"
        value={lastName}
        onChange={v => { setLastName(v); setNameErrors(p => ({ ...p, lastName: null })); }}
        placeholder="Last name"
        error={nameErrors.lastName}
      />

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          Username
        </label>
        <input
          value={username}
          onChange={e => handleUsernameChange(e.target.value)}
          onBlur={handleUsernameBlur}
          placeholder="username"
          style={{
            width: '100%', padding: '9px 12px',
            border: `1px solid ${usernameBorderColor}`,
            borderRadius: 8, fontSize: '0.9rem', color: '#111827',
            background: '#fff', outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { if (usernameCheck === 'idle') e.target.style.borderColor = '#6b21a8'; }}
        />
        <UsernameHint state={usernameCheck} />
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canSave}
        style={{
          width: '100%', padding: '11px 0', background: '#6b21a8', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: '0.9375rem', fontWeight: 600,
          cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.7,
          marginBottom: 10, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (canSave) e.currentTarget.style.background = '#581c87'; }}
        onMouseLeave={e => { if (canSave) e.currentTarget.style.background = '#6b21a8'; }}
      >
        {loading ? 'Saving…' : usernameCheck === 'checking' ? 'Checking username…' : 'Save & Continue'}
      </button>
      <button
        type="button"
        onClick={onSkip}
        style={{ background: 'none', border: 'none', color: '#a087b0', fontSize: '0.875rem', cursor: 'pointer', width: '100%' }}
      >
        Skip
      </button>
    </div>
  );
}
