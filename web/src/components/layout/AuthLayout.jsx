import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
          <span className="text-primary font-bold text-lg">C</span>
        </div>
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
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
              <span className="text-white text-base font-bold">C</span>
            </div>
            <span className="font-serif font-bold text-2xl text-primary tracking-tight">
              Continuum
            </span>
          </div>
          <p className="text-secondary text-sm">Your academic & career companion</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border shadow-card-hover p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
