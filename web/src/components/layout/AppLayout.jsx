import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function AppLayout() {
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <span className="text-primary font-bold text-lg">C</span>
          </div>
          <p className="text-sm text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 40,
            display: 'none',
          }}
          className="md-overlay"
        />
      )}

      {/* Sidebar — always visible on md+, drawer on mobile */}
      <div
        style={{
          position: 'relative',
          zIndex: 50,
          flexShrink: 0,
        }}
        className={`sidebar-wrapper${sidebarOpen ? ' sidebar-open' : ''}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header with hamburger */}
        <div className="mobile-header">
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 8,
              border: '1px solid #ede9fe',
              background: '#fff',
              cursor: 'pointer',
              color: '#6b21a8',
            }}
          >
            <Menu size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'Georgia, serif' }}>C</span>
            </div>
            <span style={{ fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: 16, color: '#111827' }}>Continuum</span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <ErrorBoundary>
            <div className="page-fade-in">
              <Outlet />
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
