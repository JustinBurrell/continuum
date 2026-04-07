import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function MarketingNav() {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();

  const navLinks = [
    { to: '/product', label: 'Product' },
    { to: '/about', label: 'About' },
  ];

  return (
    <header
      className="font-marketing sticky top-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <img src="/wordmark.svg" alt="Continuum" style={{ height: 28 }} />
        </Link>

        {/* Center nav links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(({ to, label }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                style={{
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? '#6B21A8' : '#374151',
                  textDecoration: 'none',
                  padding: '6px 14px',
                  borderRadius: 6,
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = '#111827';
                    e.currentTarget.style.background = '#F9FAFB';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = '#374151';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 180, justifyContent: 'flex-end' }}>
          {isLoading ? null : user ? (
            <Link
              to="/dashboard"
              style={{
                fontSize: 14, fontWeight: 600, color: '#fff',
                background: '#6B21A8', padding: '7px 18px', borderRadius: 8,
                textDecoration: 'none', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#5B1A91'}
              onMouseLeave={e => e.currentTarget.style.background = '#6B21A8'}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  fontSize: 14, fontWeight: 500, color: '#374151',
                  textDecoration: 'none', padding: '7px 14px', borderRadius: 6,
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.background = '#F9FAFB'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#374151'; e.currentTarget.style.background = 'transparent'; }}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  fontSize: 14, fontWeight: 600, color: '#fff',
                  background: '#6B21A8', padding: '7px 18px', borderRadius: 8,
                  textDecoration: 'none', transition: 'background 0.15s',
                  boxShadow: '0 1px 6px rgba(107,33,168,0.2)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#5B1A91'}
                onMouseLeave={e => e.currentTarget.style.background = '#6B21A8'}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
