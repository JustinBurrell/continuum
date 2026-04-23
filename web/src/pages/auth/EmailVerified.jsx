import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { posthog } from '@/lib/posthog';

export default function EmailVerified() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, updateUser } = useAuth();

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [resendStatus, setResendStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'
  // Prevents double-firing in React StrictMode dev (effects intentionally run twice).
  // The ref is set synchronously before the async call so the second run is a no-op.
  const calledRef = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No token provided.');
      return;
    }

    if (calledRef.current) return;
    calledRef.current = true;

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        updateUser({ emailVerified: true });
        queryClient.setQueryData(['me'], (old) => {
          if (!old) return old;
          const user = old.user || old.data;
          if (!user) return old;
          const updated = { ...user, emailVerified: true };
          return old.user ? { ...old, user: updated } : { ...old, data: updated };
        });
        posthog.capture('email_verified', { platform: 'web' });
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'This link is invalid or has expired.');
      });
  }, [token]);

  return (
    <div className="font-marketing min-h-screen flex items-center justify-center px-4" style={{ background: '#F8F9FA' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 16, padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: 440, width: '100%', textAlign: 'center' }}>
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader size={40} className="animate-spin mx-auto" style={{ color: '#6B21A8' }} />
            <p style={{ color: '#111827', fontWeight: 500 }}>Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <CheckCircle size={48} className="mx-auto" style={{ color: '#059669' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Email verified</h1>
              <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: 0 }}>
                Your email address has been confirmed. You're all set with Continuum.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-block text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: '#6B21A8' }}
            >
              Continue to Continuum
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <XCircle size={48} className="mx-auto" style={{ color: '#DC2626' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Verification failed</h1>
              <p style={{ color: '#6B7280', fontSize: '0.9375rem', margin: 0 }}>{errorMsg}</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              {user ? (
                resendStatus === 'sent' ? (
                  <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: 500 }}>Verification email sent.</p>
                ) : (
                  <button
                    disabled={resendStatus === 'sending'}
                    onClick={async () => {
                      setResendStatus('sending');
                      try {
                        await api.post('/auth/send-verification');
                        setResendStatus('sent');
                      } catch {
                        setResendStatus('idle');
                      }
                    }}
                    className="inline-block text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90"
                    style={{ background: resendStatus === 'sending' ? '#9CA3AF' : '#6B21A8', border: 'none', cursor: resendStatus === 'sending' ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                  >
                    {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
                  </button>
                )
              ) : (
                <Link
                  to="/login"
                  className="inline-block text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: '#6B21A8' }}
                >
                  Sign in to resend
                </Link>
              )}
              <Link
                to={user ? '/dashboard' : '/'}
                style={{ fontSize: '0.875rem', color: '#6B21A8', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                {user ? 'Back to dashboard' : 'Back to home'}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
