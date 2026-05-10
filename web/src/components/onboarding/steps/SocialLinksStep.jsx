import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function SocialLinksStep({ onContinue, onSkip }) {
  const { user, updateUser } = useAuth();
  const [linkedinUrl, setLinkedinUrl]         = useState(user?.linkedinUrl ?? '');
  const [instagramHandle, setInstagramHandle] = useState(user?.instagramHandle ?? '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setErrors({});
    setLoading(true);
    try {
      const body = {};
      if (linkedinUrl !== (user?.linkedinUrl ?? ''))         body.linkedinUrl = linkedinUrl;
      if (instagramHandle !== (user?.instagramHandle ?? '')) body.instagramHandle = instagramHandle;

      if (Object.keys(body).length > 0) {
        const res = await api.patch('/auth/me/profile', body);
        updateUser({ linkedinUrl: res.data.user.linkedinUrl, instagramHandle: res.data.user.instagramHandle });
      }
      onContinue();
    } catch (e) {
      const msg = e?.response?.data?.error ?? '';
      if (msg.toLowerCase().includes('linkedin')) {
        setErrors({ linkedin: msg });
      } else if (msg.toLowerCase().includes('instagram')) {
        setErrors({ instagram: msg });
      } else if (msg) {
        setErrors({ general: msg });
      } else {
        onContinue(); // network hiccup — don't block the user
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%', padding: '9px 12px',
    border: `1px solid ${hasError ? '#dc2626' : '#e5d3f0'}`,
    borderRadius: 8, fontSize: '0.9rem', color: '#111827', background: '#fff', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  });

  return (
    <div>
      <h2 style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: '1.375rem', fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px', lineHeight: 1.3 }}>
        Add your social links
      </h2>
      <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '0 0 20px' }}>
        Both are optional. Add them later from your Profile page any time.
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          LinkedIn URL
        </label>
        <input
          value={linkedinUrl}
          onChange={e => { setLinkedinUrl(e.target.value); setErrors(p => ({ ...p, linkedin: null })); }}
          placeholder="https://linkedin.com/in/yourname"
          style={inputStyle(!!errors.linkedin)}
          onFocus={e => { if (!errors.linkedin) e.target.style.borderColor = '#6b21a8'; }}
          onBlur={e => { if (!errors.linkedin) e.target.style.borderColor = '#e5d3f0'; }}
        />
        {errors.linkedin && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '4px 0 0' }}>{errors.linkedin}</p>}
        {!errors.linkedin && <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '4px 0 0' }}>e.g. https://linkedin.com/in/yourname</p>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: 4 }}>
          Instagram handle
        </label>
        <input
          value={instagramHandle}
          onChange={e => { setInstagramHandle(e.target.value); setErrors(p => ({ ...p, instagram: null })); }}
          placeholder="yourhandle (without @)"
          style={inputStyle(!!errors.instagram)}
          onFocus={e => { if (!errors.instagram) e.target.style.borderColor = '#6b21a8'; }}
          onBlur={e => { if (!errors.instagram) e.target.style.borderColor = '#e5d3f0'; }}
        />
        {errors.instagram && <p style={{ color: '#dc2626', fontSize: '0.75rem', margin: '4px 0 0' }}>{errors.instagram}</p>}
        {!errors.instagram && <p style={{ color: '#9CA3AF', fontSize: '0.75rem', margin: '4px 0 0' }}>Letters, numbers, periods, underscores (no @)</p>}
      </div>

      {errors.general && <p style={{ color: '#dc2626', fontSize: '0.8125rem', marginBottom: 12 }}>{errors.general}</p>}

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
