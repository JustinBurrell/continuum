import { useState, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PasswordRequirements from '@/components/ui/PasswordRequirements';
import { friendlyError } from '@/lib/errors';

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
  const inputId = `auth-${(label || type).toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <input
        id={inputId}
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

function PasswordInput({ label, error, register, name, rules, onChange: onChangeProp }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const reg = register(name, rules);
  const inputId = `auth-${name}`;
  return (
    <div>
      <label htmlFor={inputId} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          style={{
            ...inputStyle,
            ...(focused ? inputFocusStyle : {}),
            ...(error ? { borderColor: '#EF4444' } : {}),
            paddingRight: 42,
          }}
          onFocus={() => setFocused(true)}
          onBlur={(e) => { setFocused(false); reg.onBlur(e); }}
          onChange={(e) => { reg.onChange(e); onChangeProp?.(e); }}
          name={reg.name}
          ref={reg.ref}
        />
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
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

export default function Register() {
  const { register: registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { isSubmitting, errors } } = useForm();

  const password = watch('password', '');

  const onSubmit = async (data) => {
    setError('');
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        email: data.email,
        password: data.password,
      });
      navigate('/onboarding');
    } catch (err) {
      setError(friendlyError(err, 'Registration failed. Please try again.'));
    }
  };

  return (
    <div className="font-marketing" style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '40% 60%' }}>
      {/* Left panel */}
      <aside aria-label="About Continuum" style={{ background: '#3B0764', display: 'flex', flexDirection: 'column', padding: '48px 40px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        {/* Logo */}
        <Link to="/" style={{ display: 'inline-block', marginBottom: 'auto' }}>
          <img src="/wordmark.svg" alt="Continuum" style={{ height: 28, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
        </Link>

        {/* Brand copy */}
        <div style={{ marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 32, color: '#ffffff', lineHeight: 1.2, marginBottom: 16 }}>
            Join thousands of students already ahead.
          </p>
          <p style={{ fontSize: 15, color: '#c8bce0', lineHeight: 1.6, maxWidth: 280 }}>
            Set up your account in under a minute and get every tool you need to stay organized and focused.
          </p>

          {/* Feature pills */}
          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'All tools included at no cost',
              'AI-powered across every feature',
              'Sync across all your devices',
            ].map((feat) => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span style={{ fontSize: 13, color: '#d4c8e8' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p style={{ fontSize: 12, color: '#b8a8d5', position: 'relative', zIndex: 1 }}>
          Free forever. No credit card required.
        </p>
      </aside>

      {/* Right panel */}
      <div style={{ background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'Fraunces, Georgia, serif', fontWeight: 700, fontSize: 28, color: '#111827', marginBottom: 4 }}>
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: '#6B7280' }}>Start your journey with Continuum</p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', fontSize: 13, color: '#991B1B' }}>
              {error}
            </div>
          )}

          {/* Google button */}
          <button
            type="button"
            onClick={googleLogin}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff',
              fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>or sign up with email</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <AuthInput
                label="First name"
                placeholder="Alex"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register('firstName', { required: 'Required' })}
              />
              <AuthInput
                label="Last name"
                placeholder="Johnson"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Required' })}
              />
            </div>

            <AuthInput
              label="Username"
              placeholder="alexj"
              autoComplete="username"
              error={errors.username?.message}
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Min 3 characters' },
              })}
            />

            <AuthInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />

            <div>
              <PasswordInput
                label="Password"
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
              {password?.length > 0 && <PasswordRequirements password={password} />}
            </div>

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
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {/* Legal */}
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>
            By signing up, you agree to our{' '}
            <Link to="/terms" style={{ color: '#6B21A8', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy" style={{ color: '#6B21A8', fontWeight: 500, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              Privacy Policy
            </Link>.
          </p>

          {/* Footer */}
          <p style={{ marginTop: 12, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#6B21A8', fontWeight: 600, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
