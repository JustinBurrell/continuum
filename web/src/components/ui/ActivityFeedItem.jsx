import { Link, useNavigate } from 'react-router-dom';
import AppAvatar from '@/components/ui/AppAvatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import { formatRelative } from '@/lib/utils';
import { posthog } from '@/lib/posthog';

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Someone';
}

const nameLink = (u) => (
  <span key={u._id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    <Link
      to="/users/view"
      state={{ id: u._id }}
      style={{ color: '#6b21a8', fontWeight: 600, textDecoration: 'none' }}
      onClick={e => e.stopPropagation()}
      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
    >
      {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Someone'}
    </Link>
    <VerifiedBadge roles={u.roles} />
  </span>
);

function renderNames(names) {
  if (!names || names.length === 0) return null;
  if (names.length === 1) return nameLink(names[0]);
  if (names.length === 2) return <>{nameLink(names[0])} and {nameLink(names[1])}</>;
  return <>{nameLink(names[0])}, {nameLink(names[1])}, and {names.length - 2} other{names.length - 2 !== 1 ? 's' : ''}</>;
}

function shareSuffix(m) {
  if (m.isRecipient) return <> with you</>;
  if (m.sharedWithAll) return <> with friends</>;
  if (m.sharedWithNames?.length > 0) return <> with {renderNames(m.sharedWithNames)}</>;
  return null;
}

const contentLink = (to, state, text) => (
  <Link
    to={to}
    state={state}
    style={{ color: '#6b21a8', fontStyle: 'italic', fontWeight: 500, textDecoration: 'none' }}
    onClick={e => e.stopPropagation()}
    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
  >
    "{text}"
  </Link>
);

const resourceNav = (type, id) => {
  if (type === 'note') return { to: '/notes/view', state: { id } };
  if (type === 'flashcardSet') return { to: '/flashcards/view', state: { id } };
  if (type === 'task') return { to: '/tasks', state: { openTaskId: id } };
  return null;
};

// Primary destination for the whole row — used for the row-level click
function getRowNav(item) {
  const m = item.metadata || {};
  switch (item.type) {
    case 'note_created':
    case 'note_shared':    return { to: '/notes/view', state: { id: item.targetId } };
    case 'flashcard_set_created':
    case 'flashcard_shared': return { to: '/flashcards/view', state: { id: item.targetId } };
    case 'task_created':
    case 'task_completed': return { to: '/tasks', state: { openTaskId: item.targetId } };
    case 'comment_added': {
      const base = resourceNav(item.targetType, item.targetId);
      if (!base) return null;
      return m.commentId ? { to: base.to, state: { ...base.state, commentId: m.commentId } } : base;
    }
    default: return null;
  }
}

export function getActivitySentence(item, actor) {
  const m = item.metadata || {};
  const name = fullName(actor);
  const bold = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <Link
        to="/users/view"
        state={{ id: actor?._id }}
        style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}
        onClick={e => e.stopPropagation()}
      >
        {name}
      </Link>
      <VerifiedBadge roles={actor?.roles} />
    </span>
  );
  const suffix = shareSuffix(m);

  switch (item.type) {
    case 'note_created':
      return <>{bold} created a note {m.noteTitle && contentLink('/notes/view', { id: item.targetId }, m.noteTitle)}</>;
    case 'note_shared':
      return <>{bold} shared their note {m.noteTitle && contentLink('/notes/view', { id: item.targetId }, m.noteTitle)}{suffix}</>;
    case 'flashcard_set_created':
      return <>{bold} {m.isAIGenerated ? 'generated' : 'created'} a flashcard set {m.setTitle && contentLink('/flashcards/view', { id: item.targetId }, m.setTitle)}</>;
    case 'flashcard_shared':
      return <>{bold} shared a flashcard set {m.setTitle && contentLink('/flashcards/view', { id: item.targetId }, m.setTitle)}{suffix}</>;
    case 'task_created':
      return <>{bold} shared a task {m.taskTitle && contentLink('/tasks', { openTaskId: item.targetId }, m.taskTitle)}{suffix}</>;
    case 'task_completed':
      return <>{bold} completed a task {m.taskTitle && contentLink('/tasks', { openTaskId: item.targetId }, m.taskTitle)}</>;
    case 'comment_added': {
      const base = resourceNav(item.targetType, item.targetId);
      const nav = base && m.commentId ? { to: base.to, state: { ...base.state, commentId: m.commentId } } : base;
      return m.commentPreview
        ? <>{bold} commented: {nav ? contentLink(nav.to, nav.state, m.commentPreview) : <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>"{m.commentPreview}"</span>}</>
        : <>{bold} left a comment</>;
    }
    default:
      return <>{bold} did something</>;
  }
}

export default function ActivityFeedItem({ item, isLast = false }) {
  const actor = item.userId;
  const name = fullName(actor);
  const navigate = useNavigate();
  const rowNav = getRowNav(item);

  function handleRowClick() {
    if (!rowNav) return;
    posthog.capture('activity_item_clicked', {
      type: item.type,
      target_type: item.targetType,
      actor_id: actor?._id,
    });
    navigate(rowNav.to, { state: rowNav.state });
  }

  return (
    <div
      onClick={rowNav ? handleRowClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: '14px 0',
        borderBottom: isLast ? 'none' : '1px solid #E5E7EB',
        cursor: rowNav ? 'pointer' : 'default',
        borderRadius: 4,
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (rowNav) e.currentTarget.style.background = 'rgba(107,33,168,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Avatar — links to the actor's profile, stops row click */}
      <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0 }}>
        <Link to="/users/view" state={{ id: actor?._id }}>
          <AppAvatar name={name} src={actor?.avatarUrl} size="sm" className="hover:opacity-80 transition-opacity" />
        </Link>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>
          {getActivitySentence(item, actor)}
        </p>
        <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}
