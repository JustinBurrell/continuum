import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, CheckSquare, Briefcase, Activity, ArrowRight, Clock, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Skeleton from '@/components/ui/Skeleton';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { formatRelative, truncate, stripHtml } from '@/lib/utils';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import ActivityFeedItem from '@/components/ui/ActivityFeedItem';

// Verified backend response shapes:
// GET /notes → { notes[], pagination: { total, page, limit, pages } }
// GET /tasks → { tasks[], pagination: { total, page, limit, pages } }
// GET /activity → { feed[], nextCursor, total } — total is the full count across all pages
// GET /applications → { applications[] }
// GET /applications/dashboard → { total, pipeline: { applied, screening, interview, offer, rejected, withdrawn } }
// GET /flashcard-sets → { sets[], pagination: { total, page, limit, pages } }

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';
}

/* ────────────────────────────────────────
   Stat Card
   ──────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, to, accent }) {
  const accentColor = accent || '#6b21a8';
  const inner = (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '1rem 1.125rem',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'box-shadow 0.18s, transform 0.18s',
        cursor: to ? 'pointer' : 'default',
      }}
      onMouseEnter={e => {
        if (to) {
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(107,33,168,0.13)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${accentColor}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={17} style={{ color: accentColor }} />
      </div>
      <div>
        <p
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '1.375rem',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1,
            letterSpacing: '-0.3px',
          }}
        >
          {value ?? '\u2014'}
        </p>
        <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, fontWeight: 500 }}>{label}</p>
      </div>
    </div>
  );
  return to ? (
    <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
      {inner}
    </Link>
  ) : (
    inner
  );
}

/* ────────────────────────────────────────
   Note Card
   ──────────────────────────────────────── */
function NoteCard({ note }) {
  return (
    <Link to="/notes/view" state={{ id: note._id }} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
          padding: '1rem 1.125rem',
          height: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(107,33,168,0.13)';
          e.currentTarget.style.borderColor = '#6b21a8';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: 'rgba(107,33,168,0.08)',
              color: '#6b21a8',
              padding: '3px 8px',
              borderRadius: 6,
              lineHeight: 1.5,
            }}
          >
            {note.type || 'note'}
          </span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>{formatRelative(note.updatedAt)}</span>
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.45,
          }}
        >
          {note.title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: '#6B7280',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.55,
          }}
        >
          {truncate(stripHtml(note.content), 120)}
        </p>
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────
   Flashcard Set Card
   ──────────────────────────────────────── */
function FlashcardSetCard({ set }) {
  return (
    <Link to="/flashcards/view" state={{ id: set._id }} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
          padding: '1.125rem 1.25rem',
          height: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(107,33,168,0.13)';
          e.currentTarget.style.borderColor = '#6b21a8';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              background: set.isAIGenerated ? '#fef3c7' : 'rgba(107,33,168,0.08)',
              color: set.isAIGenerated ? '#b45309' : '#6b21a8',
              padding: '2px 7px',
              borderRadius: 20,
              lineHeight: 1.5,
              whiteSpace: 'nowrap',
            }}
          >
            {set.isAIGenerated ? 'AI Generated' : 'Manual Creation'}
          </span>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            {set.totalCards || 0} card{(set.totalCards || 0) !== 1 ? 's' : ''}
          </span>
        </div>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#111827',
            marginBottom: 6,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            lineHeight: 1.45,
          }}
        >
          {set.title}
        </p>
        {set.subject && (
          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
            {set.subject}
          </p>
        )}
        {set.lastStudiedAt && (
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={10} /> Studied {formatRelative(set.lastStudiedAt)}
          </p>
        )}
      </div>
    </Link>
  );
}

/* ────────────────────────────────────────
   Task Item
   ──────────────────────────────────────── */
function TaskItem({ task, onView }) {
  const priorityConfig = {
    high:   { dot: '#ef4444', badge: { background: '#fef2f2', color: '#dc2626' } },
    medium: { dot: '#f59e0b', badge: { background: '#fffbeb', color: '#d97706' } },
    low:    { dot: '#9CA3AF', badge: { background: '#f9fafb', color: '#6B7280' } },
  };
  const cfg = priorityConfig[task.priority] || priorityConfig.low;

  return (
    <div
      onClick={() => onView(task._id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #E5E7EB',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: cfg.dot,
          flexShrink: 0,
          boxShadow: `0 0 0 2px ${cfg.dot}22`,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p
            style={{
              fontSize: 11,
              color: '#9CA3AF',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 2,
            }}
          >
            <Clock size={10} />
            {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 9px',
          borderRadius: 20,
          textTransform: 'capitalize',
          flexShrink: 0,
          ...cfg.badge,
        }}
      >
        {task.priority || 'low'}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────
   Application Item
   ──────────────────────────────────────── */
function AppItem({ app }) {
  const sc = {
    draft:     { background: '#F3F4F6', color: '#6B7280' },
    applied:   { background: 'rgba(107,33,168,0.08)', color: '#6b21a8' },
    interview: { background: 'rgba(217,119,6,0.08)', color: '#D97706' },
    offer:     { background: 'rgba(5,150,105,0.08)', color: '#059669' },
    rejected:  { background: '#FEE2E2', color: '#DC2626' },
    withdrawn: { background: '#F3F4F6', color: '#9CA3AF' },
  };
  const badgeStyle = sc[app.status] || sc.applied;

  return (
    <Link
      to="/applications/view"
      state={{ id: app._id, application: app }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #E5E7EB',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#F8F9FA')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}
        >
          {app.company}
        </p>
        <p
          style={{
            fontSize: 11,
            color: '#6B7280',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginTop: 1,
          }}
        >
          {app.role}
        </p>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
          textTransform: 'capitalize',
          flexShrink: 0,
          ...badgeStyle,
        }}
      >
        {app.status}
      </span>
    </Link>
  );
}


/* ────────────────────────────────────────
   Section Header
   ──────────────────────────────────────── */
function Section({ label, to, children, count }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#9CA3AF',
            }}
          >
            {label}
          </span>
          {count != null && (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#6b21a8',
              background: 'rgba(107,33,168,0.08)',
              borderRadius: 20,
              padding: '1px 8px',
              lineHeight: 1.5,
            }}>
              {count}
            </span>
          )}
        </div>
        {to && (
          <Link
            to={to}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: '#6b21a8',
              textDecoration: 'none',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            View all <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

const PIPELINE_STAGES = ['draft', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'];

const PIPELINE_BADGE = {
  draft:     { background: '#F3F4F6', color: '#6B7280' },
  applied:   { background: 'rgba(107,33,168,0.08)', color: '#6b21a8' },
  interview: { background: 'rgba(217,119,6,0.08)', color: '#D97706' },
  offer:     { background: 'rgba(5,150,105,0.08)', color: '#059669' },
  rejected:  { background: '#FEE2E2', color: '#DC2626' },
  withdrawn: { background: '#F3F4F6', color: '#9CA3AF' },
};

/* ════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Use server-side lastViewedActivityAt from the authenticated user — device-consistent
  const lastViewedActivityAt = user?.lastViewedActivityAt ?? null;

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', { limit: 3 }],
    queryFn: () => api.get('/notes', { params: { limit: 3 } }).then(r => r.data),
  });

  // Fetch the top open tasks for the Priority Tasks display list (todo only, first 10)
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks-dashboard-display'],
    queryFn: () => api.get('/tasks', { params: { status: 'todo', page: 1, limit: 10 } }).then(r => r.data),
  });

  // Count-only queries for accurate Open Tasks stat (backend paginates — need totals, not list size)
  const { data: todoCountData } = useQuery({
    queryKey: ['tasks-count', 'todo'],
    queryFn: () => api.get('/tasks', { params: { status: 'todo', page: 1, limit: 1 } }).then(r => r.data),
    staleTime: 30000,
  });
  const { data: inProgressCountData } = useQuery({
    queryKey: ['tasks-count', 'in_progress'],
    queryFn: () => api.get('/tasks', { params: { status: 'in_progress', page: 1, limit: 1 } }).then(r => r.data),
    staleTime: 30000,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity', { limit: 4, since: lastViewedActivityAt }],
    queryFn: () => api.get('/activity', {
      params: { limit: 4, ...(lastViewedActivityAt ? { since: lastViewedActivityAt } : {}) },
    }).then(r => r.data),
  });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', { limit: 5 }],
    queryFn: () => api.get('/applications', { params: { limit: 5 } }).then(r => r.data),
  });

  const { data: appsDashboard } = useQuery({
    queryKey: ['applications-dashboard'],
    queryFn: () => api.get('/applications/dashboard').then(r => r.data),
  });

  const { data: flashcardData, isLoading: flashcardLoading } = useQuery({
    queryKey: ['flashcard-sets', { limit: 3 }],
    queryFn: () => api.get('/flashcard-sets').then(r => r.data),
  });

  const notes      = notesData?.notes || [];
  // Tasks for the Priority Tasks display list (already filtered to todo only by the query)
  const tasks      = tasksData?.tasks || [];
  // Open Tasks stat = todo total + in_progress total (accurate across all pages)
  const openTaskCount = (todoCountData?.pagination?.total ?? 0) + (inProgressCountData?.pagination?.total ?? 0);
  const activities = activityData?.feed || [];
  const activityTotal = activityData?.total ?? activities.length;
  const apps       = appsData?.applications || [];
  const pipeline   = appsDashboard?.pipeline || {};
  const flashcardSets = (flashcardData?.sets || []).slice(0, 3);

  const greeting = user?.firstName || user?.name?.split(' ')[0] || user?.username;

  return (
    <div style={{ padding: '0 0 3rem' }}>
      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: '1.625rem',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}
        >
          Good {getGreeting()}, {greeting}
        </h1>
        <p style={{ fontSize: '0.9375rem', color: '#6B7280', marginTop: 4, fontWeight: 400 }}>
          Here's what's happening today.
        </p>
      </div>

      {/* Show skeleton on first load (all primary queries pending) */}
      {notesLoading && tasksLoading && activityLoading && appsLoading ? (
        <DashboardSkeleton />
      ) : <>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 16,
          marginBottom: 36,
        }}
      >
        <StatCard icon={FileText}    label="Notes"           value={notesData?.pagination?.total} to="/notes" />
        <StatCard icon={BookOpen}    label="Flashcards"      value={flashcardData?.pagination?.total ?? flashcardData?.sets?.length} to="/flashcards" />
        <StatCard icon={CheckSquare} label="Open Tasks"      value={openTaskCount}                  to="/tasks" />
        <StatCard icon={Briefcase}   label="Applications"    value={appsDashboard?.total || apps.length} to="/applications" />
        <StatCard icon={Activity}    label="New Activity"    value={activityTotal}                  to="/activity" />
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 28 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Section label="Recent Notes" to="/notes">
            {notesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : notes.length === 0 ? (
              <div
                style={{
                  border: '1.5px dashed #E5E7EB',
                  borderRadius: 16,
                  padding: '2.25rem',
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9CA3AF',
                  background: '#F8F9FA',
                }}
              >
                No notes yet.{' '}
                <Link to="/notes/new" style={{ color: '#6b21a8', fontWeight: 600 }}>
                  Create your first
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                {notes.map(note => <NoteCard key={note._id} note={note} />)}
              </div>
            )}
          </Section>

          <Section label="Flashcard Sets" to="/flashcards">
            {flashcardLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : flashcardSets.length === 0 ? (
              <div
                style={{
                  border: '1.5px dashed #E5E7EB',
                  borderRadius: 16,
                  padding: '2.25rem',
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9CA3AF',
                  background: '#F8F9FA',
                }}
              >
                No flashcard sets yet. Create one from a note or manually.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                {flashcardSets.map(set => <FlashcardSetCard key={set._id} set={set} />)}
              </div>
            )}
          </Section>

          <Section label="Recent Activity" to="/activity">
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                padding: '0 20px',
              }}
            >
              {activityLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 my-3" />)
                : activities.length === 0
                  ? (
                    <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '1.75rem 0' }}>
                      No activity yet.
                    </p>
                  )
                  : activities.slice(0, 5).map((item, idx, arr) => (
                      <ActivityFeedItem key={item._id} item={item} isLast={idx === arr.length - 1} />
                    ))
              }
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Section label="Priority Tasks" to="/tasks">
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                padding: '0 20px',
              }}
            >
              {tasksLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 my-2" />)
                : tasks.length === 0
                  ? (
                    <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '1.75rem 0' }}>
                      No open tasks.
                    </p>
                  )
                  : tasks.slice(0, 5).map(task => (
                    <TaskItem
                      key={task._id}
                      task={task}
                      onView={(id) => navigate('/tasks', { state: { openTaskId: id } })}
                    />
                  ))
              }
            </div>
          </Section>

          <Section label="Applications" to="/applications" count={appsDashboard?.total || undefined}>
            {/* Pipeline pills */}
            {Object.keys(pipeline).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {PIPELINE_STAGES.filter(s => pipeline[s] > 0).map(s => {
                  const badgeStyle = PIPELINE_BADGE[s] || PIPELINE_BADGE.applied;
                  return (
                    <span
                      key={s}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 10px',
                        borderRadius: 20,
                        textTransform: 'capitalize',
                        ...badgeStyle,
                      }}
                    >
                      {s} <strong>{pipeline[s]}</strong>
                    </span>
                  );
                })}
              </div>
            )}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #E5E7EB',
                borderRadius: 16,
                boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
                padding: '0 20px',
              }}
            >
              {appsLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 my-2" />)
                : apps.length === 0
                  ? (
                    <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '1.75rem 0' }}>
                      No applications.{' '}
                      <Link to="/applications" style={{ color: '#6b21a8', fontWeight: 600 }}>
                        Add one
                      </Link>
                    </p>
                  )
                  : apps.slice(0, 3).map(app => <AppItem key={app._id} app={app} />)
              }
            </div>
          </Section>
        </div>
      </div>
      </>}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
