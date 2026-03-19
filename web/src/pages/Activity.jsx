import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity as ActivityIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { formatRelative } from '@/lib/utils';

function fullName(u) {
  return [u?.firstName, u?.lastName].filter(Boolean).join(' ') || u?.username || 'Someone';
}

const nameLink = (u) => (
  <Link
    key={u._id}
    to="/users/view"
    state={{ id: u._id }}
    style={{ color: '#6b21a8', fontWeight: 600, textDecoration: 'none' }}
    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
  >
    {[u.firstName, u.lastName].filter(Boolean).join(' ') || 'Someone'}
  </Link>
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

function getActivitySentence(item, actor) {
  const m = item.metadata || {};
  const name = fullName(actor);
  const bold = (
    <Link to="/users/view" state={{ id: actor?._id }} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none' }}>
      {name}
    </Link>
  );
  const suffix = shareSuffix(m);

  switch (item.type) {
    case 'note_shared':
      return <>{bold} shared their note {m.noteTitle && <span style={{ color: '#a087b0' }}>"{m.noteTitle}"</span>}{suffix}</>;
    case 'flashcard_shared':
      return <>{bold} shared a flashcard set {m.setTitle && <span style={{ color: '#a087b0' }}>"{m.setTitle}"</span>}{suffix}</>;
    case 'task_created':
      return <>{bold} shared a task {m.taskTitle && <span style={{ color: '#a087b0' }}>"{m.taskTitle}"</span>}{suffix}</>;
    case 'comment_added':
      return m.commentPreview
        ? <>{bold} commented: <span style={{ color: '#a087b0' }}>"{m.commentPreview}"</span></>
        : <>{bold} left a comment</>;
    case 'like_added':
      return m.commentPreview
        ? <>{bold} liked a comment: <span style={{ color: '#a087b0' }}>"{m.commentPreview}"</span></>
        : <>{bold} liked a comment</>;
    default:
      return <>{bold} did something</>;
  }
}

const TYPE_COLORS = {
  note_shared: '#6b21a8',
  flashcard_shared: '#7c3aed',
  task_created: '#2563eb',
  comment_added: '#16a34a',
  like_added: '#dc2626',
};

function ActivityItem({ item }) {
  const actor = item.userId;
  const name = fullName(actor);
  const actorId = actor?._id;
  const dotColor = TYPE_COLORS[item.type] || '#a087b0';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid #ede9fe',
      position: 'relative',
    }}>
      {/* Activity type dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Link to="/users/view" state={{ id: actorId }} style={{ display: 'block' }}>
          <Avatar name={name} src={actor?.avatarUrl} size="sm" className="hover:opacity-80 transition-opacity" />
        </Link>
        <div style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: dotColor,
          border: '2px solid #fff',
        }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.5 }}>
          {getActivitySentence(item, actor)}
        </p>
        <p style={{ fontSize: 11, color: '#c4b5d4', marginTop: 4 }}>{formatRelative(item.createdAt)}</p>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function Activity() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['activity', { page }],
    queryFn: () => api.get('/activity', { params: { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE } }).then(r => r.data),
    keepPreviousData: true,
  });

  const activities = data?.feed || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#111827', margin: 0 }}>
          Activity
        </h1>
        <p style={{ fontSize: 13, color: '#a087b0', marginTop: 4 }}>
          {total > 0 ? `${total} activit${total === 1 ? 'y' : 'ies'}` : 'Track what\'s happening'}
        </p>
      </div>

      <div style={{
        background: '#fff',
        border: '1px solid #ede9fe',
        borderRadius: 16,
        boxShadow: '0 1px 8px rgba(107,33,168,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '0 20px' }}>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid #ede9fe' }}>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: '#f5f0ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <ActivityIcon size={24} style={{ color: '#a087b0' }} />
              </div>
              <p style={{ fontSize: 14, color: '#a087b0', margin: 0 }}>
                No activity yet. Start creating notes, tasks, and more.
              </p>
            </div>
          ) : (
            activities.map(item => <ActivityItem key={item._id} item={item} />)
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            padding: '16px 20px',
            borderTop: '1px solid #ede9fe',
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #ede9fe',
                background: 'white',
                color: page === 1 ? '#d1d5db' : '#374151',
                fontSize: 13,
                fontWeight: 500,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s',
              }}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', color: '#a087b0', fontSize: 13 }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: page === p ? 'none' : '1px solid #ede9fe',
                      background: page === p ? '#6b21a8' : 'white',
                      color: page === p ? 'white' : '#374151',
                      fontSize: 13,
                      fontWeight: page === p ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #ede9fe',
                background: 'white',
                color: page === totalPages ? '#d1d5db' : '#374151',
                fontSize: 13,
                fontWeight: 500,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s',
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
