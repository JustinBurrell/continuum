import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/ui/Avatar';

const DROPDOWN_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/notes', label: 'Notes' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/applications', label: 'Applications' },
  { to: '/resumes', label: 'Resume' },
  { to: '/messages', label: 'Messages' },
  { to: '/friends', label: 'Friends' },
  { to: '/activity', label: 'Activity' },
  { to: '/profile', label: 'Settings' },
];

export default function MarketingNav() {
  const { user, isLoading, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinks = [
    { to: '/product', label: 'Product' },
    { to: '/about', label: 'About' },
  ];

  const firstName = user?.firstName || user?.name?.split(' ')[0] || user?.username || 'Account';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.username || '';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/');
  }

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
          <img src="/logo-lockup.svg" alt="Continuum" style={{ height: 28 }} />
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
            /* Logged-in: avatar + first name + chevron dropdown */
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'none', border: '1px solid #E5E7EB',
                  borderRadius: 999, padding: '4px 12px 4px 4px',
                  cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#6B21A8'; e.currentTarget.style.background = '#F5F3FF'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'none'; }}
              >
                <Avatar src={user.avatarUrl} name={fullName} size="sm" />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>
                  {firstName}
                </span>
                {/* Chevron */}
                <svg
                  width="14" height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6B7280"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {open && (
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#fff', border: '1px solid #E5E7EB',
                    borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    minWidth: 200, zIndex: 50, overflow: 'hidden',
                  }}
                >
                  {/* User info header */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={user.avatarUrl} name={fullName} size="md" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{fullName || firstName}</div>
                      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{user.email || ''}</div>
                    </div>
                  </div>

                  {/* Nav links */}
                  <div style={{ padding: '6px 0' }}>
                    {DROPDOWN_LINKS.map(({ to, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setOpen(false)}
                        style={{
                          display: 'block', padding: '8px 16px',
                          fontSize: 14, fontWeight: 500, color: '#374151',
                          textDecoration: 'none', transition: 'background 0.1s, color 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F5F3FF'; e.currentTarget.style.color = '#6B21A8'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; }}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>

                  {/* Sign out */}
                  <div style={{ padding: '6px 0', borderTop: '1px solid #F3F4F6' }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 16px', fontSize: 14, fontWeight: 500,
                        color: '#DC2626', background: 'none', border: 'none',
                        cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
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
