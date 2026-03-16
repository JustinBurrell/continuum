import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';

export default function EmailVerified() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No token provided.');
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        // Invalidate the cached user so emailVerified: true is reflected immediately
        queryClient.invalidateQueries({ queryKey: ['me'] });
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'This link is invalid or has expired.');
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="space-y-4">
            <Loader size={40} className="text-primary animate-spin mx-auto" />
            <p className="text-foreground font-medium">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-5">
            <CheckCircle size={48} className="text-green-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Email verified</h1>
              <p className="text-secondary text-sm mt-2">
                Your email address has been confirmed. You're all set with Continuum.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-block bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Continue to Continuum
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-5">
            <XCircle size={48} className="text-red-500 mx-auto" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Verification failed</h1>
              <p className="text-secondary text-sm mt-2">{errorMsg}</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Link
                to="/profile"
                className="inline-block bg-primary text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Go to Settings to resend
              </Link>
              <Link to="/dashboard" className="text-sm text-secondary hover:text-foreground transition-colors">
                Back to dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
