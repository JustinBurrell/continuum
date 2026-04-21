import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BookOpen, CheckSquare, Calendar,
  MessageCircle, Users, Activity, Briefcase, FileCheck, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getInitials, cn } from '@/lib/utils';
import AppAvatar from '@/components/ui/AppAvatar';
import queryClient from '@/lib/queryClient';
import api from '@/lib/api';

// Prefetch map — each nav item fires this on hover so data is warm before the click.
// staleTime matches the per-query overrides used on each page.
const prefetchMap = {
  '/notes':        () => queryClient.prefetchInfiniteQuery({ queryKey: ['notes', { search: '', type: 'all' }], queryFn: ({ pageParam }) => api.get('/notes', { params: { page: pageParam, limit: 20 } }).then(r => r.data), initialPageParam: 1, getNextPageParam: (lastPage) => { const p = lastPage?.pagination; return p && p.page < p.pages ? p.page + 1 : undefined; }, staleTime: 60_000 }),
  '/flashcards':   () => queryClient.prefetchQuery({ queryKey: ['flashcard-sets'], queryFn: () => api.get('/flashcard-sets').then(r => r.data), staleTime: 120_000 }),
  '/tasks':        () => queryClient.prefetchQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks').then(r => r.data), staleTime: 30_000 }),
  '/friends':      () => queryClient.prefetchQuery({ queryKey: ['friends', ''], queryFn: () => api.get('/friends').then(r => r.data), staleTime: 120_000 }),
  '/applications': () => queryClient.prefetchQuery({ queryKey: ['applications'], queryFn: () => api.get('/applications').then(r => r.data), staleTime: 60_000 }),
  '/resumes':      () => queryClient.prefetchQuery({ queryKey: ['resumes', ''], queryFn: () => api.get('/resumes').then(r => r.data), staleTime: 300_000 }),
  '/activity':     () => queryClient.prefetchQuery({ queryKey: ['activity'], queryFn: () => api.get('/activity').then(r => r.data), staleTime: 30_000 }),
  '/messages':     () => queryClient.prefetchQuery({ queryKey: ['conversations'], queryFn: () => api.get('/conversations').then(r => r.data), staleTime: 15_000 }),
};

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
      style={{ width: 240, background: '#ffffff', borderRight: '1px solid #E5E7EB' }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px' }}>
        <a href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <img src="/wordmark.svg" alt="Continuum" style={{ height: 26 }} />
        </a>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-4" style={{ padding: '12px 8px' }}>
        {navGroups.map((group) => (
          <div key={group.label}>
            <p style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#a087b0',
              marginBottom: 6,
              padding: '0 10px',
            }}>
              {group.label}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/dashboard'}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: isActive ? '0 8px 8px 0' : 10,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? '#6b21a8' : '#4b5563',
                      background: isActive ? 'rgba(107,33,168,0.08)' : 'transparent',
                      borderLeft: isActive ? '3px solid #6b21a8' : '3px solid transparent',
                      paddingLeft: isActive ? 7 : 10,
                      textDecoration: 'none',
                      transition: 'background 0.15s, color 0.15s',
                    })}
                    onMouseEnter={e => {
                      if (!e.currentTarget.getAttribute('data-active')) {
                        e.currentTarget.style.background = 'rgba(107,33,168,0.08)';
                      }
                      prefetchMap[to]?.();
                    }}
                    onMouseLeave={e => {
                      if (!e.currentTarget.getAttribute('data-active')) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0, color: isActive ? '#6b21a8' : '#4b5563' }} />
                        <span>{label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: 12, borderTop: '1px solid #E5E7EB' }}>
        <button
          onClick={() => navigate('/profile')}
          className="w-full text-left transition-colors"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 12,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,33,168,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <AppAvatar name={fullName} src={user?.avatarUrl} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#111827',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}>
              {fullName}
            </p>
            <p style={{
              fontSize: 11,
              color: '#a087b0',
              lineHeight: 1.3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              margin: 0,
            }}>
              {user?.email || user?.username}
            </p>
          </div>
        </button>
        <button
          onClick={() => { logout(); navigate('/'); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            padding: '8px 10px',
            borderRadius: 8,
            color: '#a087b0',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            marginTop: 2,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#a087b0';
          }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
