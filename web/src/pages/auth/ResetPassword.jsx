import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

const inputStyle = {
  width: '100%',
  border: '1px solid #E5E7EB',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  color: '#111827',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
};

const inputFocusStyle = {
  borderColor: '#6B21A8',
  boxShadow: '0 0 0 3px rgba(107,33,168,0.12)',
};

function PasswordInput({ label, error, register, name, rules }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const reg = register(name, rules);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          style={{
            ...inputStyle,
            ...(focused ? inputFocusStyle : {}),
            ...(error ? { borderColor: '#EF4444' } : {}),
            paddingRight: 42,
          }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); reg.onBlur(e); }}
          {...reg}
          ref={reg.ref}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0, display: 'flex',
          }}
          tabIndex={-1}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{error}</p>}
    </div>
  );
}

function LeftPanel() {
  return (
    <div style={{ background: '#3B0764', display: 'flex', flexDirection: 'column', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

      <Link to="/" style={{ display: 'inline-block', marginBottom: 'auto' }}>
        <img src="/wordmark.svg" alt="Continuum" style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
      </Link>

      <div style={{ marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 32, color: '#ffffff', lineHeight: 1.2, marginBottom: 16 }}>
          Your academic life, all in one place.
        </p>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 280 }}>
          Notes, flashcards, tasks, applications, and more, organized so you can focus on what matters.
        </p>
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', position: 'relative', zIndex: 1 }}>
        Free forever. No credit card required.
      </p>
    </div>
  );
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'expired'
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: data.password });
      setStatus('success');
      setTimeout(() => navigate('/login?reset=1'), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        setStatus('expired');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    }
  };

  // Success state
  if (status === 'success') {
    return (
      <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
        <LeftPanel />
        <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={28} style={{ color: '#16a34a' }} />
            </div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 24, color: '#111827', marginBottom: 8 }}>
              Password updated
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
              Your password has been reset. Redirecting you to sign in...
            </p>
            <Link
              to="/login"
              style={{ fontSize: 14, color: '#6B21A8', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expired / invalid token state
  if (status === 'expired') {
    return (
      <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
        <LeftPanel />
        <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <AlertCircle size={28} style={{ color: '#DC2626' }} />
            </div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 24, color: '#111827', marginBottom: 8 }}>
              Link expired
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              style={{
                display: 'inline-block', padding: '10px 20px', borderRadius: 8,
                background: '#6B21A8', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#5B1A91'}
              onMouseLeave={e => e.currentTarget.style.background = '#6B21A8'}
            >
              Request new link
            </Link>
            <p style={{ marginTop: 16, fontSize: 13, color: '#6B7280' }}>
              <Link
                to="/login"
                style={{ color: '#6B21A8', fontWeight: 600, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default: form
  return (
    <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
      <LeftPanel />

      {/* Right panel */}
      <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 28, color: '#111827', marginBottom: 4 }}>
              Set new password
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Choose a strong password for your account.</p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PasswordInput
              label="New password"
              name="password"
              register={register}
              rules={{
                required: 'Password is required',
                minLength: { value: 8, message: 'Min 8 characters' },
                validate: (v) =>
                  /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(v) ||
                  'Must include a letter, a number, and a special character',
              }}
              error={errors.password?.message}
            />

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '11px 16px', borderRadius: 8, border: 'none',
                background: isSubmitting ? '#9CA3AF' : '#6B21A8', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = '#5B1A91'; }}
              onMouseLeave={e => { if (!isSubmitting) e.currentTarget.style.background = '#6B21A8'; }}
            >
              {isSubmitting ? 'Resetting...' : 'Reset password'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            <Link
              to="/login"
              style={{ color: '#6B21A8', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
