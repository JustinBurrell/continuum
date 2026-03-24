import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, CheckSquare, Briefcase, Activity, ArrowRight, Clock, BookOpen } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Skeleton from '@/components/ui/Skeleton';
import DashboardSkeleton from '@/components/skeletons/DashboardSkeleton';
import { formatRelative, truncate, stripHtml } from '@/lib/utils';

// Verified backend response shapes:
// GET /notes → { notes[], pagination: { total } }
// GET /tasks → { tasks[] } — no total field
// GET /activity → { feed[], total } — total is the full count across all pages
// GET /applications → { applications[] }
// GET /applications/dashboard → { total, pipeline: { applied, screening, interview, offer, rejected, withdrawn } }
// GET /flashcard-sets → { sets[] }

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
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        padding: '1.25rem 1.375rem',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
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
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${accentColor}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={19} style={{ color: accentColor }} />
      </div>
      <div>
        <p
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 26,
            fontWeight: 700,
            color: accentColor,
            lineHeight: 1,
            letterSpacing: '-0.5px',
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
          border: '1px solid #ede9fe',
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
          padding: '1rem 1.125rem',
          height: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(107,33,168,0.13)';
          e.currentTarget.style.borderColor = '#c4b5fd';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
          e.currentTarget.style.borderColor = '#ede9fe';
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
          border: '1px solid #ede9fe',
          borderRadius: 16,
          boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
          padding: '1.125rem 1.25rem',
          height: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.18s, border-color 0.18s, transform 0.18s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = '0 4px 18px rgba(107,33,168,0.13)';
          e.currentTarget.style.borderColor = '#c4b5fd';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = '0 1px 8px rgba(107,33,168,0.06)';
          e.currentTarget.style.borderColor = '#ede9fe';
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
          <p style={{ fontSize: 12, color: '#a087b0', lineHeight: 1.4 }}>
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
        borderBottom: '1px solid #f5f0ff',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#faf8ff')}
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
    draft:     { background: '#f3f4f6', color: '#6B7280' },
    applied:   { background: '#eff6ff', color: '#2563eb' },
    interview: { background: '#fffbeb', color: '#d97706' },
    offer:     { background: '#f0fdf4', color: '#16a34a' },
    rejected:  { background: '#fef2f2', color: '#dc2626' },
    withdrawn: { background: '#f3f4f6', color: '#6B7280' },
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
        borderBottom: '1px solid #f5f0ff',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#faf8ff')}
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
   Activity Feed
   ──────────────────────────────────────── */
const feedNameLink = (u) => (
  <Link
    key={u._id}
    to="/users/view"
    state={{ id: u._id }}
    style={{ color: '#6b21a8', fontWeight: 600, textDecoration: 'none' }}
  >
    {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Someone'}
  </Link>
);

function feedRenderNames(names) {
  if (!names || names.length === 0) return null;
  if (names.length === 1) return feedNameLink(names[0]);
  if (names.length === 2) return <>{feedNameLink(names[0])} and {feedNameLink(names[1])}</>;
  return <>{feedNameLink(names[0])}, {feedNameLink(names[1])}, and {names.length - 2} other{names.length - 2 !== 1 ? 's' : ''}</>;
}

function feedShareSuffix(m) {
  if (m.isRecipient) return <> with you</>;
  if (m.sharedWithAll) return <> with friends</>;
  if (m.sharedWithNames?.length > 0) return <> with {feedRenderNames(m.sharedWithNames)}</>;
  return null;
}

function getFeedSentence(item, actor) {
  const m = item.metadata || {};
  const name = fullName(actor);
  const bold = (
    <Link to="/users/view" state={{ id: actor?._id }} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
      {name}
    </Link>
  );
  const suffix = feedShareSuffix(m);

  switch (item.type) {
    case 'note_shared':
      return <>{bold} shared their note {m.noteTitle && <span style={{ color: '#a087b0' }}>"{truncate(m.noteTitle, 40)}"</span>}{suffix}</>;
    case 'flashcard_shared':
      return <>{bold} shared a flashcard set {m.setTitle && <span style={{ color: '#a087b0' }}>"{truncate(m.setTitle, 40)}"</span>}{suffix}</>;
    case 'task_created':
      return <>{bold} shared a task {m.taskTitle && <span style={{ color: '#a087b0' }}>"{truncate(m.taskTitle, 40)}"</span>}{suffix}</>;
    case 'comment_added':
      return m.commentPreview
        ? <>{bold} commented: <span style={{ color: '#a087b0' }}>"{truncate(m.commentPreview, 50)}"</span></>
        : <>{bold} left a comment</>;
    case 'like_added':
      return m.commentPreview
        ? <>{bold} liked a comment: <span style={{ color: '#a087b0' }}>"{truncate(m.commentPreview, 50)}"</span></>
        : <>{bold} liked a comment</>;
    default:
      return <>{bold} did something</>;
  }
}

function FeedItem({ item }) {
  const actor = item.userId;
  const name = fullName(actor);
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '11px 0',
        borderBottom: '1px solid #f5f0ff',
      }}
    >
      <Link to="/users/view" state={{ id: actor?._id }} style={{ flexShrink: 0, marginTop: 1 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(107,33,168,0.08)',
            border: '1.5px solid rgba(107,33,168,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {actor?.avatarUrl ? (
            <img src={actor.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: '#6b21a8' }}>{initial}</span>
          )}
        </div>
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{getFeedSentence(item, actor)}</p>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Section Header
   ──────────────────────────────────────── */
function Section({ label, to, children }) {
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
  draft:     { background: '#f3f4f6', color: '#6B7280' },
  applied:   { background: '#eff6ff', color: '#2563eb' },
  interview: { background: '#fffbeb', color: '#d97706' },
  offer:     { background: '#f0fdf4', color: '#16a34a' },
  rejected:  { background: '#fef2f2', color: '#dc2626' },
  withdrawn: { background: '#f3f4f6', color: '#6B7280' },
};

/* ════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: notesData, isLoading: notesLoading } = useQuery({
    queryKey: ['notes', { limit: 3 }],
    queryFn: () => api.get('/notes', { params: { limit: 3 } }).then(r => r.data),
    staleTime: 0,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'open'],
    queryFn: () => api.get('/tasks').then(r => r.data),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity', { limit: 4 }],
    queryFn: () => api.get('/activity', { params: { limit: 4 } }).then(r => r.data),
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
  const tasks      = (tasksData?.tasks || []).filter(t => t.status !== 'completed');
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
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#111827',
            letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}
        >
          Good {getGreeting()}, {greeting}
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6, fontWeight: 400 }}>
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
        <StatCard icon={BookOpen}    label="Flashcard Sets"  value={flashcardData?.sets?.length}  to="/flashcards" accent="#7c3aed" />
        <StatCard icon={CheckSquare} label="Open Tasks"      value={tasks.length}                  to="/tasks" accent="#2563eb" />
        <StatCard icon={Briefcase}   label="Applications"    value={appsDashboard?.total || apps.length} to="/applications" accent="#0891b2" />
        <StatCard icon={Activity}    label="Activities"      value={activityTotal}                  to="/activity" accent="#16a34a" />
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
                  border: '1.5px dashed #ede9fe',
                  borderRadius: 16,
                  padding: '2.25rem',
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9CA3AF',
                  background: '#faf8ff',
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
                  border: '1.5px dashed #ede9fe',
                  borderRadius: 16,
                  padding: '2.25rem',
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#9CA3AF',
                  background: '#faf8ff',
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
                border: '1px solid #ede9fe',
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
                  : activities.map(item => <FeedItem key={item._id} item={item} />)
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
                border: '1px solid #ede9fe',
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

          <Section label="Applications" to="/applications">
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
                border: '1px solid #ede9fe',
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
