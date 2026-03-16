import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    if (!token) {
      navigate('/login?error=oauth_failed');
      return;
    }

    localStorage.setItem('token', token);

    api
      .get('/auth/me')
      .then((res) => {
        const user = res.data.user || res.data.data;
        updateUser(user);
        navigate('/dashboard');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=oauth_failed');
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="text-primary font-bold text-xl">C</span>
        </div>
        <p className="text-sm text-secondary">Signing you in...</p>
      </div>
    </div>
  );
}
