import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: '#F8F9FA' }}>
        <img src="/wordmark.svg" alt="Continuum" style={{ height: 28, opacity: 0.4 }} className="animate-pulse" />
      </div>
    );
  }

  if (user) {
    // Logged-in users who haven't finished onboarding go to /onboarding;
    // fully-completed users skip straight to the dashboard.
    const destination = (user.onboardingCompleted && user.tourCompleted) ? '/dashboard' : '/onboarding';
    return <Navigate to={destination} replace />;
  }

  return <Outlet />;
}
