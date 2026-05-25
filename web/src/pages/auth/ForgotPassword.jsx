import { useState, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CheckCircle } from 'lucide-react';
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

const AuthInput = forwardRef(function AuthInput({ label, error, type = 'text', onBlur, onFocus, ...props }, ref) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <input
        ref={ref}
        type={type}
        style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...(error ? { borderColor: '#EF4444' } : {}) }}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...props}
      />
      {error && <p style={{ marginTop: 4, fontSize: 12, color: '#EF4444' }}>{error}</p>}
    </div>
  );
});

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

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  if (sent) {
    return (
      <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
        <LeftPanel />
        <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
          <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <CheckCircle size={28} style={{ color: '#16a34a' }} />
            </div>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 24, color: '#111827', marginBottom: 8 }}>
              Check your email
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 28px' }}>
              We sent a password reset link to your inbox. Follow the instructions to set a new password.
            </p>
            <Link
              to="/login"
              style={{ fontSize: 14, color: '#6B21A8', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
      <LeftPanel />

      {/* Right panel */}
      <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 28, color: '#111827', marginBottom: 4 }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B' }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
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
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          {/* Footer */}
          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            Remembered your password?{' '}
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
