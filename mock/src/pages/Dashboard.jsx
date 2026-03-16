import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, CheckSquare, Briefcase, Activity, ArrowRight, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative, truncate, stripHtml } from '@/lib/utils';

// Verified backend response shapes:
// GET /notes → { notes[], pagination: { total } }
// GET /tasks → { tasks[] } — no total field
// GET /activity → { feed[] } — actor = item.userId { firstName, lastName, username, avatarUrl }
// GET /applications → { applications[] }
// GET /applications/dashboard → { total, pipeline: { applied, screening, interview, offer, rejected, withdrawn } }

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Unknown';
}

function box(style) {
  return {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    boxShadow: 'var(--shadow-card)',
    ...style,
  };
}

function StatCard({ icon: Icon, label, value, to }) {
  const inner = (
    <div style={{ ...box(), padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, transition: 'box-shadow 0.15s' }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} style={{ color: 'var(--primary)' }} />
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value ?? '—'}</p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</p>
      </div>
    </div>
  );
  return to ? <Link to={to} className="block hover:no-underline">{inner}</Link> : inner;
}

function NoteCard({ note }) {
  return (
    <Link to="/notes/view" state={{ id: note._id }} className="block h-full">
      <div style={{ ...box(), padding: '0.875rem', height: '100%', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 4 }}>
            {note.type || 'note'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{formatRelative(note.updatedAt)}</span>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {note.title}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {truncate(stripHtml(note.content), 120)}
        </p>
      </div>
    </Link>
  );
}

function TaskItem({ task, onView }) {
  const dotColor = task.priority === 'high' ? 'var(--destructive)' : task.priority === 'medium' ? 'var(--warning)' : 'var(--border-hover)';
  return (
    <div
      onClick={() => onView(task._id)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
    >
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</p>
        {task.dueDate && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Clock size={9} /> {new Date(task.dueDate).toLocaleDateString()}
          </p>
        )}
      </div>
      <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'var(--bg-hover)', color: 'var(--text-secondary)', textTransform: 'capitalize', flexShrink: 0 }}>
        {task.priority || 'low'}
      </span>
    </div>
  );
}

function AppItem({ app }) {
  const sc = { draft: ['var(--bg-hover)', 'var(--text-secondary)'], applied: ['var(--bg-hover)', 'var(--text-secondary)'], interview: ['var(--warning-bg)', 'var(--warning)'], offer: ['var(--success-bg)', 'var(--success)'], rejected: ['var(--destructive-bg)', 'var(--destructive)'], withdrawn: ['var(--bg-hover)', 'var(--text-secondary)'] };
  const [bg, color] = sc[app.status] || sc.applied;
  return (
    <Link to="/applications/view" state={{ id: app._id, application: app }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', cursor: 'pointer' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.company}</p>
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.role}</p>
      </div>
      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: bg, color, textTransform: 'capitalize', flexShrink: 0 }}>{app.stage}</span>
    </Link>
  );
}

function getFeedSentence(item, name) {
  const m = item.metadata || {};
  switch (item.type) {
    case 'note_shared':
      return m.noteTitle ? `${name} shared their note "${truncate(m.noteTitle, 40)}"` : `${name} shared a note`;
    case 'flashcard_shared':
      return m.setTitle ? `${name} shared a flashcard set "${truncate(m.setTitle, 40)}"` : `${name} shared a flashcard set`;
    case 'task_created':
      return m.taskTitle ? `${name} created a new task "${truncate(m.taskTitle, 40)}"` : `${name} created a new task`;
    case 'comment_added':
      return m.commentPreview ? `${name} commented: "${truncate(m.commentPreview, 50)}"` : `${name} left a comment`;
    case 'like_added':
      return m.commentPreview ? `${name} liked a comment: "${truncate(m.commentPreview, 50)}"` : `${name} liked a comment`;
    default:
      return `${name} did something`;
  }
}

function FeedItem({ item }) {
  // Backend: item.userId populated { firstName, lastName, username, avatarUrl }
  const actor = item.userId;
  const name = fullName(actor);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, overflow: 'hidden' }}>
        {actor?.avatarUrl
          ? <img src={actor.avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>{name.charAt(0).toUpperCase()}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{getFeedSentence(item, name)}</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

function Section({ label, to, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-tertiary)' }}>{label}</span>
        {to && (
          <Link to={to} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 500, color: 'var(--primary)', textDecoration: 'none' }}>
            View all <ArrowRight size={11} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

const PIPELINE_STAGES = ['draft', 'applied', 'interview', 'offer', 'rejected', 'withdrawn'];

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
    queryKey: ['activity', { limit: 8 }],
    queryFn: () => api.get('/activity', { params: { limit: 8 } }).then(r => r.data),
  });

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', { limit: 5 }],
    queryFn: () => api.get('/applications', { params: { limit: 5 } }).then(r => r.data),
  });

  const { data: appsDashboard } = useQuery({
    queryKey: ['applications-dashboard'],
    queryFn: () => api.get('/applications/dashboard').then(r => r.data),
  });

  const notes      = notesData?.notes || [];
  const tasks      = (tasksData?.tasks || []).filter(t => t.status !== 'completed');
  const activities = activityData?.feed || [];          // ✓ backend field is `feed`
  const apps       = appsData?.applications || [];
  const pipeline   = appsDashboard?.pipeline || {};     // ✓ backend field is `pipeline` not `byStage`

  const greeting = user?.firstName || user?.name?.split(' ')[0] || user?.username;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">Good {getGreeting()}, {greeting}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>Here's what's happening today.</p>
      </div>

      {/* Stats — notes uses pagination.total (verified); tasks has no total so use length */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={FileText}    label="Notes"        value={notesData?.pagination?.total} to="/notes" />
        <StatCard icon={CheckSquare} label="Open tasks"   value={tasks.length}                  to="/tasks" />
        <StatCard icon={Briefcase}   label="Applications" value={appsDashboard?.total}          to="/applications" />
        <StatCard icon={Activity}    label="Activities"   value={activities.length}             to="/activity" />
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Section label="Recent Notes" to="/notes">
            {notesLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[0, 1, 2].map(i => <Skeleton key={i} className="h-28" />)}
              </div>
            ) : notes.length === 0 ? (
              <div style={{ border: '1px dashed var(--border)', borderRadius: 10, padding: '2rem', textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
                No notes yet.{' '}
                <Link to="/notes/new" style={{ color: 'var(--primary)' }}>Create your first</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {notes.map(note => <NoteCard key={note._id} note={note} />)}
              </div>
            )}
          </Section>

          <Section label="Recent Activity" to="/activity">
            <div style={box({ padding: '0 20px' })}>
              {activityLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 my-3" />)
                : activities.length === 0
                  ? <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '1.5rem 0' }}>No activity yet.</p>
                  : activities.map(item => <FeedItem key={item._id} item={item} />)
              }
            </div>
          </Section>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Section label="Priority Tasks" to="/tasks">
            <div style={box({ padding: '0 20px' })}>
              {tasksLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 my-2" />)
                : tasks.length === 0
                  ? <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '1.5rem 0' }}>No open tasks.</p>
                  : tasks.slice(0, 5).map(task => <TaskItem key={task._id} task={task} onView={(id) => navigate('/tasks', { state: { openTaskId: id } })} />)
              }
            </div>
          </Section>

          <Section label="Applications" to="/applications">
            {/* Pipeline pills — backend: pipeline.{ draft, applied, interview, offer, rejected, withdrawn } */}
            {Object.keys(pipeline).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {PIPELINE_STAGES.filter(s => pipeline[s] > 0).map(s => {
                  const sc = { draft: ['var(--bg-hover)', 'var(--text-secondary)'], applied: ['var(--bg-hover)', 'var(--text-secondary)'], interview: ['var(--warning-bg)', 'var(--warning)'], offer: ['var(--success-bg)', 'var(--success)'], rejected: ['var(--destructive-bg)', 'var(--destructive)'], withdrawn: ['var(--bg-hover)', 'var(--text-secondary)'] };
                  const [bg, color] = sc[s] || sc.applied;
                  return (
                    <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: bg, color, textTransform: 'capitalize' }}>
                      {s} <strong>{pipeline[s]}</strong>
                    </span>
                  );
                })}
              </div>
            )}
            <div style={box({ padding: '0 20px' })}>
              {appsLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 my-2" />)
                : apps.length === 0
                  ? <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', padding: '1.5rem 0' }}>
                      No applications.{' '}<Link to="/applications" style={{ color: 'var(--primary)' }}>Add one</Link>
                    </p>
                  : apps.map(app => <AppItem key={app._id} app={app} />)
              }
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
