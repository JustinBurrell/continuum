import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <img src="/wordmark.svg" alt="Continuum" style={{ height: 28, opacity: 0.4 }} className="animate-pulse" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-3">
          <Link to="/" className="inline-block no-underline">
            <img src="/wordmark.svg" alt="Continuum" style={{ height: 36 }} />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-card-hover p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
