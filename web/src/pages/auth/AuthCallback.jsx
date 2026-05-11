import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { connectSocket } from '@/lib/socket';
import { posthog } from '@/lib/posthog';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const processed = useRef(false);
  const [showConnected, setShowConnected] = useState(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login?error=oauth_failed');
      return;
    }

    api
      .post('/auth/google/exchange', { code })
      .then((res) => {
        const { token } = res.data;
        localStorage.setItem('token', token);
        connectSocket(token);
        return api.get('/auth/me');
      })
      .then((res) => {
        const user = res.data.user || res.data.data;
        queryClient.invalidateQueries({ queryKey: ['me'] });
        updateUser(user);

        // source=linking means this tab/popup was opened from the onboarding integrations step.
        // Broadcast the result to the parent tab, then close. If window.close() is blocked
        // (e.g. Android CCT), render a success screen instead of navigating to /onboarding.
        const source = searchParams.get('source');
        if (source === 'linking') {
          const channel = new BroadcastChannel('continuum_oauth');
          channel.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', googleId: user.googleId });
          channel.close();
          window.close();
          // If still here, window.close() was blocked — show connected UI instead of navigating
          setShowConnected(true);
          return;
        }

        if (user.isDemo || user.isSeedUser) {
          posthog.opt_out_capturing();
        } else {
          posthog.identify(user._id, {
            email: user.email,
            username: user.username,
            name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username,
            created_at: user.createdAt,
            onboardingGoal: user.onboardingGoal ?? null,
            tourCompleted: user.tourCompleted ?? false,
          });
          posthog.capture('user_logged_in', { platform: 'web', method: 'google' });
        }
        // New users go to onboarding; returning users who already finished go straight to dashboard
        const destination = (user.onboardingCompleted && user.tourCompleted) ? '/dashboard' : '/onboarding';
        navigate(destination);
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed');
      });
  }, []);

  if (showConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(5,150,105,0.10)' }}>
            <span style={{ fontSize: 24 }}>✓</span>
          </div>
          <p className="text-sm font-semibold" style={{ color: '#059669' }}>Google connected!</p>
          <p className="text-xs" style={{ color: '#6B7280' }}>You can close this tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F9FA' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse" style={{ background: 'rgba(107,33,168,0.10)' }}>
          <span className="font-bold text-xl" style={{ color: '#6B21A8' }}>C</span>
        </div>
        <p className="text-sm" style={{ color: '#6B7280' }}>Signing you in...</p>
      </div>
    </div>
  );
}
