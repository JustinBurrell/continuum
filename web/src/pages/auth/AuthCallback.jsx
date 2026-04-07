import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import queryClient from '@/lib/queryClient';
import { connectSocket } from '@/lib/socket';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const processed = useRef(false);

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
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed');
      });
  }, []);

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
