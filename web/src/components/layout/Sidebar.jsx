import { useRef } from 'react';
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

// Prefetch map — fires after 150ms hover so fast mouse movements don't trigger requests.
// Query keys must match the initial keys used by each page on first mount.
const prefetchMap = {
  '/notes':        () => queryClient.prefetchInfiniteQuery({ queryKey: ['notes', { search: '', type: '' }], queryFn: ({ pageParam = 1 }) => api.get('/notes', { params: { page: pageParam, limit: 20 } }).then(r => r.data), initialPageParam: 1, getNextPageParam: (last) => { const p = last?.pagination; return p && p.page < p.pages ? p.page + 1 : undefined; }, staleTime: 60_000 }),
  '/flashcards':   () => queryClient.prefetchInfiniteQuery({ queryKey: ['flashcard-sets', ''], queryFn: ({ pageParam = 1 }) => api.get('/flashcard-sets', { params: { page: pageParam, limit: 20 } }).then(r => r.data), initialPageParam: 1, getNextPageParam: (last) => { const p = last?.pagination; return p && p.page < p.pages ? p.page + 1 : undefined; }, staleTime: 120_000 }),
  '/tasks':        () => queryClient.prefetchInfiniteQuery({ queryKey: ['tasks', 'mine', ''], queryFn: ({ pageParam = 1 }) => api.get('/tasks', { params: { page: pageParam, limit: 100 } }).then(r => r.data), initialPageParam: 1, getNextPageParam: (last) => { const p = last?.pagination; return p && p.page < p.pages ? p.page + 1 : undefined; }, staleTime: 30_000 }),
  '/friends':      () => queryClient.prefetchQuery({ queryKey: ['friends', ''], queryFn: () => api.get('/friends').then(r => r.data), staleTime: 120_000 }),
  '/applications': () => queryClient.prefetchQuery({ queryKey: ['applications', { search: '', status: '' }], queryFn: () => api.get('/applications').then(r => r.data), staleTime: 120_000 }),
  '/resumes':      () => queryClient.prefetchQuery({ queryKey: ['resumes', ''], queryFn: () => api.get('/resumes').then(r => r.data), staleTime: 300_000 }),
  '/activity':     () => queryClient.prefetchInfiniteQuery({ queryKey: ['activity', { actSearch: '' }], queryFn: ({ pageParam }) => api.get('/activity', { params: pageParam ? { cursor: pageParam } : {} }).then(r => r.data), initialPageParam: null, getNextPageParam: (last) => last?.nextCursor ?? null, staleTime: 60_000 }),
  '/messages':     () => queryClient.prefetchQuery({ queryKey: ['conversations'], queryFn: () => api.get('/conversations').then(r => r.data), staleTime: 30_000 }),
  '/calendar':     () => queryClient.prefetchQuery({ queryKey: ['calendar'], queryFn: () => api.get('/calendar').then(r => r.data), staleTime: 30_000 }),
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
  const prefetchTimer = useRef(null);

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
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#9CA3AF',
              marginBottom: 4,
              padding: '8px 10px 4px',
            }}>
              {group.label}
            </p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/dashboard'}
                    data-nav-id={to.replace('/', '')}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      borderRadius: 6,
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? '#6b21a8' : '#6B7280',
                      background: isActive ? 'rgba(107,33,168,0.08)' : 'transparent',
                      textDecoration: 'none',
                      transition: 'background 0.15s, color 0.15s',
                    })}
                    onMouseEnter={e => {
                      if (!e.currentTarget.getAttribute('data-active')) {
                        e.currentTarget.style.background = 'rgba(107,33,168,0.08)';
                      }
                      clearTimeout(prefetchTimer.current);
                      prefetchTimer.current = setTimeout(() => prefetchMap[to]?.(), 150);
                    }}
                    onMouseLeave={e => {
                      if (!e.currentTarget.getAttribute('data-active')) {
                        e.currentTarget.style.background = 'transparent';
                      }
                      clearTimeout(prefetchTimer.current);
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0, color: isActive ? '#6b21a8' : '#9CA3AF' }} />
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
          data-nav-id="profile"
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
              color: '#9CA3AF',
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
            color: '#6B7280',
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
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          <LogOut size={14} strokeWidth={1.75} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
