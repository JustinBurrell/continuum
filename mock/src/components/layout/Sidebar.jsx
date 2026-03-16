import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BookOpen, CheckSquare, Calendar,
  MessageCircle, Users, Activity, Briefcase, FileCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials, cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/notes', label: 'Notes', icon: FileText },
      { to: '/flashcards', label: 'Flashcards', icon: BookOpen },
      { to: '/tasks', label: 'Tasks', icon: CheckSquare },
      { to: '/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Career',
    items: [
      { to: '/applications', label: 'Applications', icon: Briefcase },
      { to: '/resumes', label: 'Resumes', icon: FileCheck },
    ],
  },
  {
    label: 'Social',
    items: [
      { to: '/messages', label: 'Messages', icon: MessageCircle },
      { to: '/friends', label: 'Friends', icon: Users },
      { to: '/activity', label: 'Activity', icon: Activity },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.username;

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen"
      style={{ width: 220, background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)' }}
    >
      {/* Brand */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <a href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'var(--primary)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'Lora, serif' }}>C</span>
          </div>
          <span style={{
            fontFamily: 'Lora, serif',
            fontWeight: 600,
            fontSize: 17,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Continuum
          </span>
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="section-label px-2.5 mb-1">{group.label}</p>
            <ul className="space-y-px">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/dashboard'}
                    className={({ isActive }) =>
                      cn('nav-link', isActive && 'nav-link-active')
                    }
                  >
                    <Icon size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-left"
          style={{ background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: user?.avatarUrl ? 'transparent' : 'var(--primary-bg)',
              overflow: 'hidden',
            }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 600 }}>
                {getInitials(fullName || 'U')}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {fullName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
              {user?.email}
            </p>
          </div>
        </button>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="mt-0.5 w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--destructive-bg)'; e.currentTarget.style.color = 'var(--destructive)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
